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
  getCatalogProduct,
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

type SubscriptionBody = {
  tier?: unknown;
  priceId?: unknown;
  paymentMethodId?: unknown;
  startTrial?: unknown;
};

function normalizeTier(value: unknown): SelfServeTierId | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();
  return isSelfServeTier(normalized) ? normalized : null;
}

function normalizeSubscriptionStatus(status: string) {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "unpaid":
      return "UNPAID";
    case "canceled":
      return "CANCELLED";
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    default:
      return "INACTIVE";
  }
}

function toDate(epochSeconds: unknown): Date | null {
  return typeof epochSeconds === "number" ? new Date(epochSeconds * 1000) : null;
}

// On newer Stripe API versions current_period_start/end live on the
// subscription item; older versions expose them on the subscription itself.
function getPeriodBounds(subscription: StripeSubscription) {
  const item = subscription.items.data[0] as
    | (StripeSubscriptionItem & {
        current_period_start?: number;
        current_period_end?: number;
      })
    | undefined;
  const record = subscription as StripeSubscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  return {
    currentPeriodStart: toDate(
      item?.current_period_start ?? record.current_period_start,
    ),
    currentPeriodEnd: toDate(
      item?.current_period_end ?? record.current_period_end,
    ),
  };
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

    let body: SubscriptionBody;

    try {
      // Parse the JSON request body.
      body = parseJsonBody<SubscriptionBody>(event.body);
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }

    // Validate the requested subscription inputs. paymentMethodId is optional:
    // plan switches for existing subscribers charge the card on file.
    const tier = normalizeTier(body.tier);
    const priceId = typeof body.priceId === "string" ? body.priceId : null;
    const paymentMethodId =
      typeof body.paymentMethodId === "string" ? body.paymentMethodId : null;
    const requestedTrial = body.startTrial === true;

    if (!tier || !priceId) {
      return jsonResponse(400, { error: "tier and priceId are required" });
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

    if (!user.stripeCustomerId) {
      return jsonResponse(400, {
        error: "Stripe customer is missing. Create a SetupIntent first.",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // Verify the selected Stripe price matches the requested tier.
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });
    const product =
      typeof price.product === "string" || price.product.deleted
        ? null
        : price.product;

    if (!price.active) {
      return jsonResponse(400, { error: "Selected price is no longer active" });
    }

    if (isSalesManagedPrice(price, product)) {
      return jsonResponse(400, {
        error: "This plan is sales-managed. Contact sales.",
      });
    }

    const stripeTier =
      normalizeTier(price.metadata.accountTier) ??
      normalizeTier(price.metadata.tier) ??
      normalizeTier(product?.metadata.accountTier) ??
      normalizeTier(product?.metadata.tier) ??
      normalizeTier(product?.name);

    if (stripeTier !== tier) {
      return jsonResponse(400, {
        error: "Selected price does not match the requested tier",
      });
    }

    // Look up any existing subscription so a plan change updates it in place
    // instead of stacking a second subscription on the customer.
    let existingSubscription: StripeSubscription | null = null;

    if (user.stripeSubscriptionId) {
      try {
        existingSubscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
        );
      } catch (error) {
        const maybeStripeError = error as { code?: string };
        if (maybeStripeError.code !== "resource_missing") {
          throw error;
        }
      }
    }

    const existingStatus = existingSubscription?.status ?? null;

    if (
      existingStatus === "past_due" ||
      existingStatus === "unpaid" ||
      existingStatus === "incomplete"
    ) {
      return jsonResponse(409, {
        error: "Resolve the outstanding payment before changing plans.",
      });
    }

    const isPlanChange =
      existingSubscription !== null &&
      (existingStatus === "active" || existingStatus === "trialing");

    if (!isPlanChange && !paymentMethodId) {
      return jsonResponse(400, {
        error: "paymentMethodId is required to start a subscription",
      });
    }

    // Attach the payment method and set it as the customer's invoice default.
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
      }).catch((error: unknown) => {
        const maybeStripeError = error as { code?: string };
        if (maybeStripeError.code !== "resource_already_exists") {
          throw error;
        }
      });

      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    let subscription: StripeSubscription;
    let startTrial = false;
    let action: "created" | "updated";

    if (isPlanChange && existingSubscription) {
      const currentItem = existingSubscription.items.data[0];

      if (!currentItem) {
        return jsonResponse(500, {
          error: "Existing subscription has no items to update",
        });
      }

      if (currentItem.price.id === priceId) {
        return jsonResponse(400, { error: "Already on this plan" });
      }

      // Swap the price on the existing subscription. always_invoice settles
      // the proration immediately; a trialing subscription keeps its
      // remaining trial window (no new trial on plan changes).
      subscription = await stripe.subscriptions.update(
        existingSubscription.id,
        {
          items: [{ id: currentItem.id, price: priceId }],
          proration_behavior: "always_invoice",
          payment_behavior: "error_if_incomplete",
          cancel_at_period_end: false,
          ...(paymentMethodId
            ? { default_payment_method: paymentMethodId }
            : {}),
          metadata: {
            userId: user.id,
            cognitoSub,
            accountTier: tier,
          },
        },
        {
          idempotencyKey: `update-subscription-${user.id}-${existingSubscription.id}-${priceId}-${paymentMethodId ?? "default"}`,
        },
      );
      action = "updated";
    } else {
      // Trial policy is catalog-driven and only applies to first-time
      // subscribers starting a brand-new subscription.
      const trialDays = getCatalogProduct(tier)?.trialDays;
      startTrial =
        typeof trialDays === "number" &&
        requestedTrial &&
        !user.hasHadActiveSubscription;

      subscription = await stripe.subscriptions.create(
        {
          customer: user.stripeCustomerId,
          items: [{ price: priceId }],
          default_payment_method: paymentMethodId ?? undefined,
          payment_behavior: "error_if_incomplete",
          trial_period_days: startTrial ? trialDays : undefined,
          metadata: {
            userId: user.id,
            cognitoSub,
            accountTier: tier,
          },
        },
        {
          idempotencyKey: `create-subscription-${user.id}-${priceId}-${paymentMethodId}-${startTrial ? "trial" : "paid"}`,
        },
      );
      action = "created";
    }

    const subscriptionRecord = subscription as StripeSubscription & {
      trial_start?: number | null;
      trial_end?: number | null;
    };
    const { currentPeriodStart, currentPeriodEnd } =
      getPeriodBounds(subscription);

    // Persist subscription details on the user record.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        accountTier: tier,
        stripeSubscriptionId: subscription.id,
        stripePriceId: price.id,
        stripeProductId: product?.id ?? null,
        stripeDefaultPaymentMethodId:
          paymentMethodId ?? user.stripeDefaultPaymentMethodId,
        subscriptionStatus: normalizeSubscriptionStatus(subscription.status),
        billingInterval: price.recurring?.interval === "year" ? "YEAR" : "MONTH",
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart,
        currentPeriodEnd,
        trialStartsAt: toDate(subscriptionRecord.trial_start),
        trialEndsAt: toDate(subscriptionRecord.trial_end),
        hasHadActiveSubscription:
          subscription.status === "active" ? true : user.hasHadActiveSubscription,
      },
    });

    // Return the created or updated subscription summary.
    return jsonResponse(200, {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      tier,
      startTrial,
      action,
    });
  } catch (error) {
    console.error("Error creating Stripe subscription:", error);
    return jsonResponse(500, { error: "Could not create subscription" });
  }
};
