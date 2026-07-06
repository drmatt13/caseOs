export type BillingInterval = "month" | "year";

export type TierId = "SOLO" | "PRO" | "ENTERPRISE";

export const SELF_SERVE_TIERS = ["SOLO", "PRO"] as const;
export type SelfServeTierId = (typeof SELF_SERVE_TIERS)[number];

export type PriceVisibility = "public" | "hidden";
export type PriceLabel = "monthly_and_yearly" | "contact_sales";

export type CatalogFeatures = {
  includedMembers: number | "unlimited";
  includedWorkspaces: number | "unlimited";
  storageGb: number;
  storageExpandable?: boolean;
  aiCreditsIncluded: number;
  aiCreditsCustom?: boolean;
  teamCollaboration: boolean;
  rolesAndPermissions: boolean | "advanced";
  sharedWorkspaces: boolean;
  auditLogs: boolean;
  ssoSaml: boolean;
  apiAccess: boolean | "optional";
  prioritySupport: "email" | "priority" | "dedicated";
  dedicatedOnboarding: boolean;
  additionalAiCredits: "purchase_packs" | "negotiated";
  billingOwner: "workspace_owner" | "organization";
};

export type CatalogPrice = {
  lookupKey: string;
  /** Minor units (cents). */
  unitAmount: number;
  currency: string;
  interval: BillingInterval;
  defaultForProduct?: boolean;
  visibility: PriceVisibility;
  /** Display string of the per-month cost, e.g. "79.08" for a yearly price. */
  effectiveMonthly: string;
  /** Display floor for sales-managed prices, in major units (e.g. "1499"). */
  startingAt?: string;
};

export type CatalogProduct = {
  tier: TierId;
  name: string;
  description: string;
  displayOrder: number;
  selfService: boolean;
  /** Trial length in days; only self-serve tiers may carry one. */
  trialDays?: number;
  /** "Starting at $X/mo" figure for sales-managed tiers, in major units. */
  startingAtMonthly?: number;
  priceLabel: PriceLabel;
  features: CatalogFeatures;
  /** Bullet copy rendered on pricing cards, in display order. */
  marketingFeatures: string[];
  prices: CatalogPrice[];
};
