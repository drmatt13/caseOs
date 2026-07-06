import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import Stripe from "stripe";
import {
  getDatabaseUrl,
  jsonResponse,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

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

// The webhook must sync every tier Stripe can bill, including sales-managed
// ENTERPRISE subscriptions created from the dashboard.
type AccountTier = "SOLO" | "PRO" | "ENTERPRISE";

function normalizeTier(value: unknown): AccountTier | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();
  return normalized === "SOLO" ||
    normalized === "PRO" ||
    normalized === "ENTERPRISE"
    ? normalized
    : null;
}

function toDate(epochSeconds: unknown): Date | null {
  return typeof epochSeconds === "number" ? new Date(epochSeconds * 1000) : null;
}

function getBody(event: APIGatewayProxyEvent | APIGatewayProxyEventV2): string {
  if (!event.body) return "";
  return event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
}

async function getPrisma() {
  const databaseUrl = await getDatabaseUrl({
    primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
    primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
    primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
  });

  return getPrismaClient(databaseUrl);
}

// A deleted subscription drops the user back to FREE. Match on subscription
// id ONLY: matching by customer could clobber a user who already started a
// replacement subscription under a new id.
async function handleSubscriptionDeleted(subscription: any) {
  const prisma = await getPrisma();

  await prisma.user.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      accountTier: "FREE",
      subscriptionStatus: "CANCELLED",
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeProductId: null,
      cancelAtPeriodEnd: false,
      billingInterval: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      trialStartsAt: null,
      trialEndsAt: null,
    },
  });
}

async function syncSubscription(stripe: InstanceType<typeof Stripe>, subscription: any) {
  const prisma = await getPrisma();

  const price = subscription.items.data[0]?.price;
  const productId =
    typeof price?.product === "string" ? price.product : price?.product?.id;
  let tier = normalizeTier(subscription.metadata.accountTier);

  if (!tier && price) {
    const expandedPrice = await stripe.prices.retrieve(price.id, {
      expand: ["product"],
    });
    const product =
      typeof expandedPrice.product === "string" || expandedPrice.product.deleted
        ? null
        : expandedPrice.product;

    tier =
      normalizeTier(expandedPrice.metadata.accountTier) ??
      normalizeTier(expandedPrice.metadata.tier) ??
      normalizeTier(product?.metadata.accountTier) ??
      normalizeTier(product?.metadata.tier) ??
      normalizeTier(product?.name);
  }

  const subscriptionRecord = subscription as typeof subscription & {
    current_period_start?: number;
    current_period_end?: number;
    trial_start?: number | null;
    trial_end?: number | null;
  };
  // Newer Stripe API versions expose the period bounds on the subscription
  // item instead of the subscription itself.
  const firstItem = subscription.items?.data?.[0];

  const updateData = {
    ...(tier ? { accountTier: tier } : {}),
    stripeSubscriptionId: subscription.id,
    stripePriceId: price?.id ?? null,
    stripeProductId: productId ?? null,
    stripeDefaultPaymentMethodId:
      typeof subscription.default_payment_method === "string"
        ? subscription.default_payment_method
        : subscription.default_payment_method?.id ?? null,
    subscriptionStatus: normalizeSubscriptionStatus(subscription.status),
    billingInterval: price?.recurring?.interval === "year" ? "YEAR" : "MONTH",
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodStart: toDate(
      firstItem?.current_period_start ?? subscriptionRecord.current_period_start,
    ),
    currentPeriodEnd: toDate(
      firstItem?.current_period_end ?? subscriptionRecord.current_period_end,
    ),
    trialStartsAt: toDate(subscriptionRecord.trial_start),
    trialEndsAt: toDate(subscriptionRecord.trial_end),
    ...(subscription.status === "active"
      ? { hasHadActiveSubscription: true }
      : {}),
  } as const;

  await prisma.user.updateMany({
    where: {
      OR: [
        { stripeCustomerId: String(subscription.customer) },
        { stripeSubscriptionId: subscription.id },
      ],
    },
    data: updateData,
  });
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonResponse(500, { error: "STRIPE_SECRET_KEY is not configured" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = getBody(event);
    const signature =
      event.headers["stripe-signature"] ?? event.headers["Stripe-Signature"];

    let stripeEvent: any;

    if (process.env.STRIPE_WEBHOOK_SECRET) {
      if (!signature) {
        return jsonResponse(400, { error: "Missing Stripe signature" });
      }

      stripeEvent = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } else {
      stripeEvent = JSON.parse(body);
    }

    switch (stripeEvent.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(stripe, stripeEvent.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;
      default:
        break;
    }

    return jsonResponse(200, { received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    return jsonResponse(400, { error: "Webhook processing failed" });
  }
};
