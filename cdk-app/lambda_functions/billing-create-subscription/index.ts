import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import cookie from "cookie";
import { createRemoteJWKSet, jwtVerify } from "jose";
import Stripe from "stripe";
import { getDatabaseUrl } from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

type AccountTier = "PRO" | "ENTERPRISE";
type SubscriptionBody = {
  tier?: unknown;
  priceId?: unknown;
  paymentMethodId?: unknown;
  startTrial?: unknown;
};

const { AWS_REGION, USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;

if (!AWS_REGION || !USER_POOL_ID || !USER_POOL_CLIENT_ID) {
  throw new Error("Missing Cognito environment variables");
}

const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(body),
});

function parseBody(body: string | null | undefined): SubscriptionBody {
  if (!body) return {};
  return JSON.parse(body) as SubscriptionBody;
}

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

async function requireAuthenticatedSub(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
) {
  const idToken = cookie.parse(event.headers.cookie ?? "").idToken;

  if (!idToken) return null;

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer,
    audience: USER_POOL_CLIENT_ID,
  });

  if (payload.token_use !== "id" || !payload.sub) return null;

  return payload.sub;
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    const cognitoSub = await requireAuthenticatedSub(event);

    if (!cognitoSub) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonResponse(500, { error: "STRIPE_SECRET_KEY is not configured" });
    }

    let body: SubscriptionBody;

    try {
      body = parseBody(event.body);
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }

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

    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });

    const prisma = getPrismaClient(databaseUrl);
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
    });

    if (!user) {
      return jsonResponse(404, { error: "User not found" });
    }

    if (!user.stripeCustomerId) {
      return jsonResponse(400, {
        error: "Stripe customer is missing. Create a SetupIntent first.",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
