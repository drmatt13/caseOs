import { z } from "zod";
import { API_ROUTE } from "@repo/api-contract";
import { fetchWithAuthRefresh } from "#/lib/auth";

// Self-serve tiers only; ENTERPRISE is sales-managed and never purchasable
// through the API.
export const billingTierSchema = z.enum(["SOLO", "PRO"]);

export type BillingTier = z.infer<typeof billingTierSchema>;

export const billingIntervalSchema = z.enum(["month", "year"]);

export type BillingProductInterval = z.infer<typeof billingIntervalSchema>;

// Zod schemas for the billing REST endpoints' responses.
const billingProductSchema = z.object({
  tier: billingTierSchema,
  name: z.string(),
  description: z.string().nullable(),
  stripeProductId: z.string(),
  stripePriceId: z.string(),
  lookupKey: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  interval: billingIntervalSchema,
});

const listBillingProductsResponseSchema = z.object({
  success: z.literal(true),
  products: z.array(billingProductSchema),
});

const createSetupIntentResponseSchema = z.object({
  success: z.literal(true),
  clientSecret: z.string(),
  setupIntentId: z.string(),
});

const createSubscriptionResponseSchema = z.object({
  success: z.literal(true),
  subscriptionId: z.string(),
  status: z.string(),
  tier: billingTierSchema,
  startTrial: z.boolean(),
  action: z.enum(["created", "updated"]),
});

const planChangePreviewResponseSchema = z.object({
  success: z.literal(true),
  amountDueToday: z.number(),
  currency: z.string(),
  nextRenewalAmount: z.number(),
  nextRenewalDate: z.string().nullable(),
  paymentMethod: z
    .object({
      brand: z.string(),
      last4: z.string(),
      expMonth: z.number(),
      expYear: z.number(),
    })
    .nullable(),
  currentPriceId: z.string(),
  proposedPriceId: z.string(),
  proposedInterval: billingIntervalSchema,
});

export type BillingProduct = z.infer<typeof billingProductSchema>;
export type PlanChangePreview = z.infer<typeof planChangePreviewResponseSchema>;

async function parseErrorResponse(res: Response): Promise<never> {
  const body = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  throw new Error(body?.error ?? `Request failed: ${res.status}`);
}

// API operations consumed by hooks and other feature callers.
export async function listBillingProducts() {
  const res = await fetchWithAuthRefresh(API_ROUTE.billingListProducts, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return listBillingProductsResponseSchema.parse(await res.json());
}

export async function createSetupIntent() {
  const res = await fetchWithAuthRefresh(API_ROUTE.billingCreateSetupIntent, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return createSetupIntentResponseSchema.parse(await res.json());
}

export type CreateSubscriptionInput = {
  tier: BillingTier;
  priceId: string;
  /** Omitted on plan switches: the backend charges the card on file. */
  paymentMethodId?: string;
  startTrial: boolean;
};

export async function createSubscription(input: CreateSubscriptionInput) {
  const res = await fetchWithAuthRefresh(API_ROUTE.billingCreateSubscription, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    await parseErrorResponse(res);
  }

  return createSubscriptionResponseSchema.parse(await res.json());
}

export async function getPlanChangePreview(input: { priceId: string }) {
  const res = await fetchWithAuthRefresh(API_ROUTE.billingPlanChangePreview, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    await parseErrorResponse(res);
  }

  return planChangePreviewResponseSchema.parse(await res.json());
}
