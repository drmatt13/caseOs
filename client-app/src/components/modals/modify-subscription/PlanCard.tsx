import { Check } from "lucide-react";

import Button from "#/components/ui/Button";
import { TONES } from "#/lib/tones";
import type { AccountTier } from "#/api/generated/graphql";
import type { BillingProductInterval } from "#/api/billing/operations";
import {
  CONTACT_SALES_MAILTO,
  formatCurrency,
  getCardPrice,
  type LivePrice,
  type PriceView,
  type TierCard,
} from "#/components/modals/modify-subscription/types";

type PlanCardProps = {
  card: TierCard;
  interval: BillingProductInterval;
  currentTier: AccountTier;
  currentPriceId: string | null;
  hasActiveSubscription: boolean;
  trialEligible: boolean;
  pricesLoading: boolean;
  isEnterpriseUser: boolean;
  onSelect: (
    card: TierCard,
    price: PriceView & { live: LivePrice },
    startTrial: boolean,
  ) => void;
};

const tierRank: Record<string, number> = {
  FREE: 0,
  TRIAL: 0,
  SOLO: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

const PlanCard = ({
  card,
  interval,
  currentTier,
  currentPriceId,
  hasActiveSubscription,
  trialEligible,
  pricesLoading,
  isEnterpriseUser,
  onSelect,
}: PlanCardProps) => {
  const price = getCardPrice(card, interval);
  const isCurrentTier = currentTier === card.tier;
  const isCurrentPrice = Boolean(
    price?.live && currentPriceId === price.live.stripePriceId,
  );
  const purchasable = Boolean(price?.live);
  const showTrialCta =
    card.selfService &&
    card.trialDays !== null &&
    trialEligible &&
    !isEnterpriseUser;

  const ctaLabel = (() => {
    if (isCurrentPrice) return "Current plan";
    if (isCurrentTier && hasActiveSubscription) {
      return interval === "month"
        ? "Switch to monthly billing"
        : "Switch to yearly billing";
    }
    if (hasActiveSubscription) {
      return tierRank[card.tier] > tierRank[currentTier]
        ? `Upgrade to ${card.label}`
        : `Switch to ${card.label}`;
    }
    if (showTrialCta) return `Start ${card.trialDays}-day free trial`;
    return `Choose ${card.label}`;
  })();

  const selectPrice = (startTrial: boolean) => {
    if (!price?.live) return;

    onSelect(card, { ...price, live: price.live }, startTrial);
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-4 backdrop-blur-sm ${
        card.mostPopular
          ? "border-black/30 bg-white/60 shadow-md"
          : "border-black/15 bg-white/40 shadow-sm"
      }`}
    >
      {card.mostPopular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#282828] px-2.5 py-0.5 text-xs text-white">
          Most popular
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <p className="font-serif text-lg">{card.label}</p>

        {isCurrentTier && (
          <span
            className={`rounded-full border px-2 py-0.5 text-xs ${TONES.neutral.badge}`}
          >
            Current
          </span>
        )}
      </div>

      <div className="mt-3">
        {card.selfService && price ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-3xl">
                {formatCurrency(price.effectiveMonthly, price.currency)}
              </span>
              <span className="text-sm text-black/60">/mo</span>
            </div>
            <p className="mt-0.5 text-xs text-black/55">
              {interval === "year"
                ? `billed ${formatCurrency(price.amount, price.currency)} yearly`
                : "billed monthly"}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-black/55">Starting at</p>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-3xl">
                {card.startingAtMonthly !== null
                  ? formatCurrency(card.startingAtMonthly)
                  : "Custom"}
              </span>
              {card.startingAtMonthly !== null && (
                <span className="text-sm text-black/60">/mo</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-black/55">
              custom annual agreements
            </p>
          </>
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-black/65">{card.description}</p>

      <div className="mt-3 mb-4 flex flex-col gap-1.5">
        {card.marketingFeatures.map((feature) => (
          <div key={feature} className="flex items-start gap-1.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-black/50" />
            <span className="text-xs leading-5 text-black/70">{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        {card.selfService ? (
          <>
            <Button
              text={ctaLabel}
              style={isCurrentPrice ? "secondary" : "primary"}
              fullWidth
              disabled={isCurrentPrice || !purchasable || isEnterpriseUser}
              title={
                !purchasable && !isCurrentPrice
                  ? "Live pricing unavailable"
                  : undefined
              }
              onClick={() => selectPrice(showTrialCta)}
            />

            {showTrialCta && purchasable && (
              <button
                type="button"
                onClick={() => selectPrice(false)}
                className="mt-1.5 w-full cursor-pointer text-center text-xs text-black/55 underline-offset-2 hover:text-black hover:underline"
              >
                or subscribe now without a trial
              </button>
            )}

            {isEnterpriseUser && (
              <p className="mt-1.5 text-center text-xs text-black/55">
                Contact sales to change your plan.
              </p>
            )}

            {!purchasable && !pricesLoading && !isEnterpriseUser && !isCurrentPrice && (
              <p className={`mt-1.5 text-center text-xs ${TONES.caution.ink}`}>
                Live pricing unavailable
              </p>
            )}
          </>
        ) : (
          <a
            href={CONTACT_SALES_MAILTO}
            className="inline-flex w-full items-center justify-center gap-2 rounded border border-black/10 bg-black/10 px-4 py-2 text-sm text-black/75 shadow-sm transition-colors duration-150 ease-in hover:bg-gray-300 hover:text-black hover:duration-100 hover:ease-out"
          >
            Contact sales
          </a>
        )}
      </div>
    </div>
  );
};

export default PlanCard;
