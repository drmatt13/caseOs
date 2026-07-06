import type { CatalogPrice, CatalogProduct } from "./types";

// Stripe metadata is the queryable runtime mirror of the typed catalog. These
// derivations are the ONLY place typed catalog fields become metadata strings;
// the sync tool diffs against their output, so key/value output must stay
// byte-identical for unchanged catalog data.

type Metadata = Record<string, string>;

function boolString(value: boolean): string {
  return value ? "true" : "false";
}

function mixedString(value: boolean | string): string {
  return typeof value === "boolean" ? boolString(value) : value;
}

export function toStripeProductMetadata(product: CatalogProduct): Metadata {
  const features = product.features;

  return {
    tier: product.tier,
    displayOrder: String(product.displayOrder),
    selfService: boolString(product.selfService),
    priceLabel: product.priceLabel,
    ...(product.startingAtMonthly !== undefined
      ? { startingAt: String(product.startingAtMonthly) }
      : {}),
    includedMembers: String(features.includedMembers),
    includedWorkspaces: String(features.includedWorkspaces),
    storageGb: String(features.storageGb),
    ...(features.storageExpandable !== undefined
      ? { storageExpandable: boolString(features.storageExpandable) }
      : {}),
    aiCreditsIncluded: String(features.aiCreditsIncluded),
    ...(features.aiCreditsCustom !== undefined
      ? { aiCreditsCustom: boolString(features.aiCreditsCustom) }
      : {}),
    teamCollaboration: boolString(features.teamCollaboration),
    rolesAndPermissions: mixedString(features.rolesAndPermissions),
    sharedWorkspaces: boolString(features.sharedWorkspaces),
    auditLogs: boolString(features.auditLogs),
    ssoSaml: boolString(features.ssoSaml),
    apiAccess: mixedString(features.apiAccess),
    prioritySupport: features.prioritySupport,
    dedicatedOnboarding: boolString(features.dedicatedOnboarding),
    additionalAiCredits: features.additionalAiCredits,
    billingOwner: features.billingOwner,
    ...(product.trialDays !== undefined
      ? { trialDays: String(product.trialDays) }
      : {}),
  };
}

export function toStripePriceMetadata(
  price: CatalogPrice,
  product: CatalogProduct,
): Metadata {
  return {
    tier: product.tier,
    lookupKey: price.lookupKey,
    selfService: boolString(product.selfService),
    priceLabel: product.selfService
      ? price.interval === "month"
        ? "monthly"
        : "yearly"
      : "contact_sales",
    priceVisibility: price.visibility,
    ...(price.startingAt !== undefined ? { startingAt: price.startingAt } : {}),
    effectiveMonthly: price.effectiveMonthly,
  };
}
