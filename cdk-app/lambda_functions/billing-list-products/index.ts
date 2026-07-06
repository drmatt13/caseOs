import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import Stripe from "stripe";
import {
  jsonResponse,
  requireAuthenticatedSub,
} from "@repo/shared-lambda-utils";
import {
  getCatalogProduct,
  isSelfServeTier,
  type SelfServeTierId,
} from "@repo/billing-catalog";

function normalizeTier(value: unknown): SelfServeTierId | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();
  return isSelfServeTier(normalized) ? normalized : null;
}

function inferTier(price: {
  metadata: Record<string, string>;
}, product: {
  metadata: Record<string, string>;
  name: string;
}): SelfServeTierId | null {
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
    // Validate the Cognito session and expose the Cognito subject.
    const cognitoSub = await requireAuthenticatedSub(event);

    // Return 401 when the request has no valid session.
    if (!cognitoSub) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonResponse(500, { error: "STRIPE_SECRET_KEY is not configured" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // Load all active prices (monthly and yearly) with their Stripe products.
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 100,
    });

    const products = prices.data
      .map((price) => {
        if (typeof price.product === "string" || price.product.deleted) {
          return null;
        }

        // Sales-managed and internal prices never surface to the client.
        if (
          price.metadata.priceVisibility === "hidden" ||
          price.metadata.selfService === "false" ||
          price.product.metadata.selfService === "false"
        ) {
          return null;
        }

        const product = price.product;
        const tier = inferTier(price, product);
        const interval = price.recurring?.interval;

        if (
          !tier ||
          !price.unit_amount ||
          !price.currency ||
          (interval !== "month" && interval !== "year")
        ) {
          return null;
        }

        return {
          tier,
          name: product.name,
          description: product.description,
          stripeProductId: product.id,
          stripePriceId: price.id,
          lookupKey: price.lookup_key ?? null,
          amount: price.unit_amount / 100,
          currency: price.currency.toUpperCase(),
          interval,
        };
      })
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product),
      )
      .sort((a, b) => {
        const orderA = getCatalogProduct(a.tier)?.displayOrder ?? 999;
        const orderB = getCatalogProduct(b.tier)?.displayOrder ?? 999;

        if (orderA !== orderB) return orderA - orderB;

        return a.interval === b.interval ? 0 : a.interval === "month" ? -1 : 1;
      });

    // Return the available billing products.
    return jsonResponse(200, { success: true, products });
  } catch (error) {
    console.error("Error listing Stripe billing products:", error);
    return jsonResponse(500, { error: "Could not load billing products" });
  }
};
