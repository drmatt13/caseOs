import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import cookie from "cookie";
import { createRemoteJWKSet, jwtVerify } from "jose";
import Stripe from "stripe";

type AccountTier = "PRO" | "ENTERPRISE";

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

async function requireAuthenticatedUser(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
) {
  const idToken = cookie.parse(event.headers.cookie ?? "").idToken;

  if (!idToken) {
    return null;
  }

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer,
    audience: USER_POOL_CLIENT_ID,
  });

  if (payload.token_use !== "id" || !payload.sub) {
    return null;
  }

  return payload;
}

function normalizeTier(value: unknown): AccountTier | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();
  return normalized === "PRO" || normalized === "ENTERPRISE"
    ? normalized
    : null;
}

function inferTier(price: {
  metadata: Record<string, string>;
}, product: {
  metadata: Record<string, string>;
  name: string;
}): AccountTier | null {
  return (
    normalizeTier(price.metadata.accountTier) ??
    normalizeTier(price.metadata.tier) ??
    normalizeTier(product.metadata.accountTier) ??
    normalizeTier(product.metadata.tier) ??
    normalizeTier(product.name)
  );
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    const payload = await requireAuthenticatedUser(event);

    if (!payload) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonResponse(500, { error: "STRIPE_SECRET_KEY is not configured" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      recurring: {
        interval: "month",
      },
      limit: 100,
    });

    const products = prices.data
      .map((price) => {
        if (typeof price.product === "string" || price.product.deleted) {
          return null;
        }

        const product = price.product;
        const tier = inferTier(price, product);

        if (!tier || !price.unit_amount || !price.currency || !price.recurring) {
          return null;
        }

        return {
          tier,
          name: product.name,
          description: product.description,
          stripeProductId: product.id,
          stripePriceId: price.id,
          amount: price.unit_amount / 100,
          currency: price.currency.toUpperCase(),
          interval: price.recurring.interval,
        };
      })
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product),
      )
      .sort((a, b) => a.amount - b.amount);

    return jsonResponse(200, { success: true, products });
  } catch (error) {
    console.error("Error listing Stripe billing products:", error);
    return jsonResponse(500, { error: "Could not load billing products" });
  }
};
