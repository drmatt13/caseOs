import { catalog } from "./catalog";
import {
  SELF_SERVE_TIERS,
  type CatalogPrice,
  type CatalogProduct,
  type SelfServeTierId,
  type TierId,
} from "./types";

export function isSelfServeTier(value: string): value is SelfServeTierId {
  return (SELF_SERVE_TIERS as readonly string[]).includes(value);
}

export function getCatalogProduct(tier: string): CatalogProduct | null {
  return catalog.find((product) => product.tier === tier) ?? null;
}

export function getCatalogPrice(
  lookupKey: string,
): { product: CatalogProduct; price: CatalogPrice } | null {
  for (const product of catalog) {
    const price = product.prices.find((p) => p.lookupKey === lookupKey);
    if (price) return { product, price };
  }

  return null;
}

export function getPublicPrices(tier: TierId): CatalogPrice[] {
  return (
    getCatalogProduct(tier)?.prices.filter(
      (price) => price.visibility === "public",
    ) ?? []
  );
}

/** Percent saved paying `yearlyAmount` once vs `monthlyAmount` twelve times. */
export function savingsPercent(
  monthlyAmount: number,
  yearlyAmount: number,
): number | null {
  if (monthlyAmount <= 0 || yearlyAmount <= 0) return null;

  return Math.round((1 - yearlyAmount / (monthlyAmount * 12)) * 100);
}

export function yearlySavingsPercent(product: CatalogProduct): number | null {
  const monthly = product.prices.find(
    (price) => price.interval === "month" && price.visibility === "public",
  );
  const yearly = product.prices.find(
    (price) => price.interval === "year" && price.visibility === "public",
  );

  if (!monthly || !yearly) return null;

  return savingsPercent(monthly.unitAmount, yearly.unitAmount);
}
