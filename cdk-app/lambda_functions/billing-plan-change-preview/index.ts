import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import Stripe from "stripe";
import {
  getDatabaseUrl,
  jsonResponse,
  parseJsonBody,
  requireAuthenticatedSub,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";
import {
  isSelfServeTier,
  type SelfServeTierId,
} from "@repo/billing-catalog";

// The stripe package's CJS types only export the constructor, so API object
// types are derived from the client instance instead of the Stripe namespace.
type StripeClient = InstanceType<typeof Stripe>;
type StripeSubscription = Awaited<
  ReturnType<StripeClient["subscriptions"]["retrieve"]>
>;
type StripeSubscriptionItem = StripeSubscription["items"]["data"][number];
type StripeInvoicePreview = Awaited<
  ReturnType<StripeClient["invoices"]["createPreview"]>
>;

type CardPaymentMethod = {
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null;
};

type PreviewBody = {
  priceId?: unknown;
};

function normalizeTier(value: unknown): SelfServeTierId | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();
  return isSelfServeTier(normalized) ? normalized : null;
}

function toIsoDate(epochSeconds: unknown): string | null {
  return typeof epochSeconds === "number"
    ? new Date(epochSeconds * 1000).toISOString()
    : null;
}

function isSalesManagedPrice(
  price: { metadata: Record<string, string> },
  product: { metadata: Record<string, string> } | null,
) {
  return (
    price.metadata.priceVisibility === "hidden" ||
    price.metadata.selfService === "false" ||
    product?.metadata.selfService === "false"
  );
}

function toCardSummary(paymentMethod: CardPaymentMethod | null) {
  if (!paymentMethod?.card) return null;

  return {
    brand: paymentMethod.card.brand,
    last4: paymentMethod.card.last4,
    expMonth: paymentMethod.card.exp_month,
    expYear: paymentMethod.card.exp_year,
  };
}

async function resolveDefaultPaymentMethod(
  stripe: StripeClient,
  subscription: StripeSubscription,
  fallbackPaymentMethodId: string | null,
): Promise<CardPaymentMethod | null> {
  // Subscription-level default wins, then the customer invoice default,
  // then the payment method persisted on the user record.
  if (
    subscription.default_payment_method &&
    typeof subscription.default_payment_method !== "string"
  ) {
    return subscription.default_payment_method;
  }

  const customer =
    typeof subscription.customer === "string" || subscription.customer.deleted
      ? null
      : subscription.customer;
  const customerDefault = customer?.invoice_settings?.default_payment_method;

  if (customerDefault && typeof customerDefault !== "string") {
    return customerDefault;
  }

  const paymentMethodId =
    (typeof subscription.default_payment_method === "string"
      ? subscription.default_payment_method
      : null) ??
    (typeof customerDefault === "string" ? customerDefault : null) ??
    fallbackPaymentMethodId;

  if (!paymentMethodId) return null;

  try {
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch {
    return null;
  }
}

function getNextRenewalDate(
  preview: StripeInvoicePreview,
  subscription: StripeSubscription,
  proposedPriceId: string,
): string | null {
  // Prefer the preview line for the proposed price: its period end reflects
  // the new billing cycle even when the interval changes.
  for (const line of preview.lines.data) {
    const linePriceId = (
      line as unknown as {
        pricing?: { price_details?: { price?: string } | null } | null;
      }
    ).pricing?.price_details?.price;

    if (linePriceId === proposedPriceId && line.period?.end) {
      return toIsoDate(line.period.end);
    }
  }

  const item = subscription.items.data[0] as
    | (StripeSubscriptionItem & { current_period_end?: number })
    | undefined;
  const record = subscription as StripeSubscription & {
    current_period_end?: number;
  };

  return toIsoDate(item?.current_period_end ?? record.current_period_end);
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate the Cognito session and expose the Cognito subject.
    const cognitoSub = await requireAuthenticatedSub(event);

    // Return 401 when the request has no valid session.
    if (!cognitoSub) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonResponse(500, { error: "STRIPE_SECRET_KEY is not configured" });
    }

    let body: PreviewBody;

    try {
      // Parse the JSON request body.
      body = parseJsonBody<PreviewBody>(event.body);
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }

    const priceId = typeof body.priceId === "string" ? body.priceId : null;

    if (!priceId) {
      return jsonResponse(400, { error: "priceId is required" });
    }

    // Resolve the production or local database URL.
    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });

    // Initialize Prisma with the resolved database URL.
    const prisma = getPrismaClient(databaseUrl);
    // Fetch the user by Cognito subject.
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
    });

    // Return 404 when the authenticated user has no database record.
    if (!user) {
      return jsonResponse(404, { error: "User not found" });
    }

    if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
      return jsonResponse(409, {
        error: "No active subscription to change",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let subscription: StripeSubscription;

    try {
      subscription = await stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
        {
          expand: [
            "default_payment_method",
            "customer.invoice_settings.default_payment_method",
          ],
        },
      );
    } catch (error) {
      const maybeStripeError = error as { code?: string };
      if (maybeStripeError.code === "resource_missing") {
        return jsonResponse(409, { error: "No active subscription to change" });
      }
      throw error;
    }

    if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      return jsonResponse(409, { error: "No active subscription to change" });
    }

    const currentItem = subscription.items.data[0];

    if (!currentItem) {
      return jsonResponse(409, { error: "No active subscription to change" });
    }

    if (currentItem.price.id === priceId) {
      return jsonResponse(400, { error: "Already on this plan" });
    }

    // Verify the proposed price is a live, self-serve catalog price.
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });
    const product =
      typeof price.product === "string" || price.product.deleted
        ? null
        : price.product;
    const proposedInterval = price.recurring?.interval;

    if (
      !price.active ||
      !price.unit_amount ||
      (proposedInterval !== "month" && proposedInterval !== "year")
    ) {
      return jsonResponse(400, { error: "Invalid price for a plan change" });
    }

    if (isSalesManagedPrice(price, product)) {
      return jsonResponse(400, {
        error: "This plan is sales-managed. Contact sales.",
      });
    }

    const proposedTier =
      normalizeTier(price.metadata.accountTier) ??
      normalizeTier(price.metadata.tier) ??
      normalizeTier(product?.metadata.accountTier) ??
      normalizeTier(product?.metadata.tier) ??
      normalizeTier(product?.name);

    if (!proposedTier) {
      return jsonResponse(400, { error: "Invalid price for a plan change" });
    }

    // Preview the proration invoice the plan change would settle today.
    const preview = await stripe.invoices.createPreview({
      customer: user.stripeCustomerId,
      subscription: subscription.id,
      subscription_details: {
        items: [{ id: currentItem.id, price: priceId }],
        proration_behavior: "always_invoice",
      },
    });

    const paymentMethod = await resolveDefaultPaymentMethod(
      stripe,
      subscription,
      user.stripeDefaultPaymentMethodId,
    );

    // preview.total is signed: negative means the switch produces a credit.
    return jsonResponse(200, {
      success: true,
      amountDueToday: preview.total / 100,
      currency: preview.currency.toUpperCase(),
      nextRenewalAmount: price.unit_amount / 100,
      nextRenewalDate: getNextRenewalDate(preview, subscription, priceId),
      paymentMethod: toCardSummary(paymentMethod),
      currentPriceId: currentItem.price.id,
      proposedPriceId: priceId,
      proposedInterval,
    });
  } catch (error) {
    console.error("Error previewing Stripe plan change:", error);
    return jsonResponse(500, { error: "Could not preview plan change" });
  }
};
