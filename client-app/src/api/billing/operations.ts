import { z } from "zod";
import type {
  AccountStatus,
  AccountTier,
  SubscriptionStatus,
} from "#/api/generated/graphql";
import { fetchWithAuthRefresh } from "#/lib/auth";

export const billingTierSchema = z.enum(["PRO", "ENTERPRISE"]);

export type BillingTier = z.infer<typeof billingTierSchema>;

// Typed GraphQL documents for this feature's operations.
const billingProductSchema = z.object({
  tier: billingTierSchema,
  name: z.string(),
  description: z.string().nullable(),
  stripeProductId: z.string(),
  stripePriceId: z.string(),
  amount: z.number(),
  currency: z.string(),
  interval: z.enum(["day", "week", "month", "year"]),
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
});

type Subscription = {
  accountTier?: AccountTier | null;
  accountStatus?: AccountStatus | null;
  subscriptionStatus?: SubscriptionStatus | null;
  billingInterval?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
};

interface GetSubscriptionResponse {
  subscription: Subscription;
}

export type BillingProduct = z.infer<typeof billingProductSchema>;

// API operations consumed by hooks and other feature callers.
export async function listBillingProducts() {
  const res = await fetchWithAuthRefresh("/billing/list-products", {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return listBillingProductsResponseSchema.parse(await res.json());
}

export async function createSetupIntent() {
  const res = await fetchWithAuthRefresh("/billing/create-setup-intent", {
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
  paymentMethodId: string;
  startTrial: boolean;
};

export async function createSubscription(input: CreateSubscriptionInput) {
  const res = await fetchWithAuthRefresh("/billing/create-subscription", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }

  return createSubscriptionResponseSchema.parse(await res.json());
}

export async function getSubscription(): Promise<GetSubscriptionResponse> {
  const res = await fetchWithAuthRefresh("/get-subscription", {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return (await res.json()) as GetSubscriptionResponse;
}
