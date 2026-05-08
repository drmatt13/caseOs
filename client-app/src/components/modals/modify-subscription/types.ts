import type { BillingProduct, BillingTier } from "#/api/billing";

export type AccountTier = "FREE" | "TRIAL" | "PRO" | "ENTERPRISE";
export type SelectableAccountTier = BillingTier;

export type TierPrice = {
  amount: number;
  currency: string;
  interval: "month";
  stripePriceId: string | null;
  stripeProductId: string | null;
};

export type TierOption = {
  tier: SelectableAccountTier;
  name: string;
  description: string;
  details: string;
  price: TierPrice | null;
  features: string[];
};

export type ModalStep = "select-tier" | "payment";
export type PaymentStatus = "idle" | "processing" | "success";

export const accountTierLabels: Record<AccountTier, string> = {
  FREE: "Free",
  TRIAL: "Trial",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

const fallbackTierPricing: Record<SelectableAccountTier, TierPrice> = {
  PRO: {
    amount: 200,
    currency: "USD",
    interval: "month",
    stripePriceId: null,
    stripeProductId: null,
  },
  ENTERPRISE: {
    amount: 500,
    currency: "USD",
    interval: "month",
    stripePriceId: null,
    stripeProductId: null,
  },
};

export function formatPrice(price: TierPrice | null) {
  if (!price) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(price.amount);
}

export function getDefaultSelectedTier(
  currentTier: AccountTier,
): SelectableAccountTier | null {
  if (currentTier === "FREE") return null;
  if (currentTier === "TRIAL") return "PRO";
  if (currentTier === "PRO") return "ENTERPRISE";
  return "PRO";
}

export function toTierPricing(products: BillingProduct[] | undefined) {
  const pricing = { ...fallbackTierPricing };

  for (const product of products ?? []) {
    if (product.interval !== "month") continue;

    pricing[product.tier] = {
      amount: product.amount,
      currency: product.currency,
      interval: "month",
      stripePriceId: product.stripePriceId,
      stripeProductId: product.stripeProductId,
    };
  }

  return pricing;
}

export function buildTierOptions(products: BillingProduct[] | undefined) {
  const pricing = toTierPricing(products);

  return [
    {
      tier: "PRO",
      name: "Pro",
      description: "Full subscription for active case work.",
      details:
        "Designed for solo operators and small teams that need dependable access for day-to-day case organization, workspace management, and routine billing without enterprise overhead.",
      price: pricing.PRO,
      features: [
        "Stripe-secured subscription billing",
        "Optional 7 day trial for eligible new subscribers",
        "Standard workspace and case capacity",
      ],
    },
    {
      tier: "ENTERPRISE",
      name: "Enterprise",
      description: "Expanded subscription for larger teams.",
      details:
        "Built for firms and organizations that expect higher usage, broader workspace needs, and priority billing support as their CaseOS footprint grows.",
      price: pricing.ENTERPRISE,
      features: [
        "Stripe-secured subscription billing",
        "Priority billing setup",
        "Expanded usage profile for teams",
      ],
    },
  ] satisfies TierOption[];
}

export type PaymentStepProps = {
  selectedOption: TierOption;
  startTrial: boolean;
  onPaymentStatusChange: (status: PaymentStatus) => void;
  onBack: () => void;
  onSubscribed: () => void;
};
