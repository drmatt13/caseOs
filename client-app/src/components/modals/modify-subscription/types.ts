import {
  catalog,
  savingsPercent,
  type CatalogProduct,
  type TierId,
} from "@repo/billing-catalog";

import type { AccountTier } from "#/api/generated/graphql";
import type {
  BillingProduct,
  BillingProductInterval,
  BillingTier,
  PlanChangePreview,
} from "#/api/billing/operations";

export type ModalStep = "select-tier" | "switch-confirm" | "payment";
export type PaymentStatus = "idle" | "processing" | "success";

export const accountTierLabels: Record<AccountTier, string> = {
  FREE: "Free",
  TRIAL: "Trial",
  SOLO: "Solo",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

// Placeholder sales contact until a real address is provisioned.
export const CONTACT_SALES_MAILTO =
  "mailto:sales@lawstruct.ai?subject=Enterprise%20plan%20inquiry";

export type LivePrice = {
  stripePriceId: string;
  stripeProductId: string;
  amount: number;
  currency: string;
};

// Display pricing always comes from the catalog so cards render even when the
// products API is down; `live` carries the purchasable Stripe price and CTAs
// stay disabled without it.
export type PriceView = {
  interval: BillingProductInterval;
  amount: number;
  currency: string;
  effectiveMonthly: number;
  live: LivePrice | null;
};

export type TierCard = {
  tier: TierId;
  label: string;
  description: string;
  marketingFeatures: string[];
  selfService: boolean;
  trialDays: number | null;
  mostPopular: boolean;
  startingAtMonthly: number | null;
  monthly: PriceView | null;
  yearly: PriceView | null;
};

export type PlanSelection = {
  tier: BillingTier;
  tierLabel: string;
  price: PriceView & { live: LivePrice };
  startTrial: boolean;
  trialDays: number | null;
};

export type PaymentStepProps = {
  selection: PlanSelection;
  /** Present when a plan switch pays with a newly entered card. */
  switchPreview: PlanChangePreview | null;
  onPaymentStatusChange: (status: PaymentStatus) => void;
  onBack: () => void;
};

export function formatCurrency(amount: number, currency = "USD") {
  const hasCents = Math.abs(amount % 1) >= 0.005;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}

export function formatBillingDate(iso: string | null | undefined) {
  if (!iso) return null;

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function toPriceView(
  catalogProduct: CatalogProduct,
  interval: BillingProductInterval,
  products: BillingProduct[] | undefined,
): PriceView | null {
  const catalogPrice = catalogProduct.prices.find(
    (price) => price.interval === interval && price.visibility === "public",
  );

  if (!catalogPrice) return null;

  const liveProduct =
    products?.find((product) => product.lookupKey === catalogPrice.lookupKey) ??
    products?.find(
      (product) =>
        product.tier === catalogProduct.tier && product.interval === interval,
    ) ??
    null;

  const amount = liveProduct?.amount ?? catalogPrice.unitAmount / 100;
  const currency = liveProduct?.currency ?? catalogPrice.currency.toUpperCase();

  return {
    interval,
    amount,
    currency,
    effectiveMonthly: interval === "month" ? amount : amount / 12,
    live: liveProduct
      ? {
          stripePriceId: liveProduct.stripePriceId,
          stripeProductId: liveProduct.stripeProductId,
          amount: liveProduct.amount,
          currency: liveProduct.currency,
        }
      : null,
  };
}

export function buildTierCards(
  products: BillingProduct[] | undefined,
): TierCard[] {
  return [...catalog]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((catalogProduct) => ({
      tier: catalogProduct.tier,
      label: accountTierLabels[catalogProduct.tier],
      description: catalogProduct.description,
      marketingFeatures: catalogProduct.marketingFeatures,
      selfService: catalogProduct.selfService,
      trialDays: catalogProduct.trialDays ?? null,
      mostPopular: catalogProduct.tier === "PRO",
      startingAtMonthly: catalogProduct.startingAtMonthly ?? null,
      monthly: catalogProduct.selfService
        ? toPriceView(catalogProduct, "month", products)
        : null,
      yearly: catalogProduct.selfService
        ? toPriceView(catalogProduct, "year", products)
        : null,
    }));
}

export function getCardPrice(
  card: TierCard,
  interval: BillingProductInterval,
): PriceView | null {
  return interval === "month" ? card.monthly : card.yearly;
}

// The yearly-savings badge quotes the best savings across self-serve tiers,
// preferring live amounts over catalog display prices.
export function yearlySavingsBadgePercent(cards: TierCard[]): number | null {
  let best: number | null = null;

  for (const card of cards) {
    if (!card.selfService || !card.monthly || !card.yearly) continue;

    const percent = savingsPercent(card.monthly.amount, card.yearly.amount);

    if (percent !== null && percent > 0 && (best === null || percent > best)) {
      best = percent;
    }
  }

  return best;
}
