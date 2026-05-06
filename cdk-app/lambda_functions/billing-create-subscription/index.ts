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

type AccountTier = "PRO" | "ENTERPRISE";
type SubscriptionBody = {
  tier?: unknown;
  priceId?: unknown;
  paymentMethodId?: unknown;
  startTrial?: unknown;
};

function normalizeTier(value: unknown): AccountTier | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();
  return normalized === "PRO" || normalized === "ENTERPRISE"
    ? normalized
    : null;
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

    // Validate the requested subscription inputs.
    const tier = normalizeTier(body.tier);
    const priceId = typeof body.priceId === "string" ? body.priceId : null;
    const paymentMethodId =
      typeof body.paymentMethodId === "string" ? body.paymentMethodId : null;
    const requestedTrial = body.startTrial === true;

    if (!tier || !priceId || !paymentMethodId) {
      return jsonResponse(400, {
        error: "tier, priceId, and paymentMethodId are required",
      });
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

    const startTrial =
      tier === "PRO" && requestedTrial && !user.hasHadActiveSubscription;

    // Attach the payment method and set it as the customer's invoice default.
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

    // Create the Stripe subscription with idempotency.
    const subscription = await stripe.subscriptions.create(
      {
        customer: user.stripeCustomerId,
        items: [{ price: priceId }],
        default_payment_method: paymentMethodId,
        payment_behavior: "error_if_incomplete",
        trial_period_days: startTrial ? 7 : undefined,
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

    const subscriptionRecord = subscription as typeof subscription & {
      current_period_start?: number;
      current_period_end?: number;
      trial_start?: number | null;
      trial_end?: number | null;
    };

    // Persist subscription details on the user record.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        accountTier: tier,
        stripeSubscriptionId: subscription.id,
        stripePriceId: price.id,
        stripeProductId: product?.id ?? null,
        stripeDefaultPaymentMethodId: paymentMethodId,
        subscriptionStatus: normalizeSubscriptionStatus(subscription.status),
        billingInterval: price.recurring?.interval === "year" ? "YEAR" : "MONTH",
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: toDate(subscriptionRecord.current_period_start),
        currentPeriodEnd: toDate(subscriptionRecord.current_period_end),
        trialStartsAt: toDate(subscriptionRecord.trial_start),
        trialEndsAt: toDate(subscriptionRecord.trial_end),
        hasHadActiveSubscription:
          subscription.status === "active" ? true : user.hasHadActiveSubscription,
      },
    });

    // Return the created subscription summary.
    return jsonResponse(200, {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      tier,
      startTrial,
    });
  } catch (error) {
    console.error("Error creating Stripe subscription:", error);
    return jsonResponse(500, { error: "Could not create subscription" });
  }
};
