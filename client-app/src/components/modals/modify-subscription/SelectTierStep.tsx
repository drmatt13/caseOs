import Button from "#/components/ui/Button";
import { TONES } from "#/lib/tones";
import type { AccountTier } from "#/api/generated/graphql";
import type { BillingProductInterval } from "#/api/billing/operations";
import IntervalToggle from "#/components/modals/modify-subscription/IntervalToggle";
import PlanCard from "#/components/modals/modify-subscription/PlanCard";
import {
  yearlySavingsBadgePercent,
  type LivePrice,
  type PriceView,
  type TierCard,
} from "#/components/modals/modify-subscription/types";

type SelectTierStepProps = {
  cards: TierCard[];
  interval: BillingProductInterval;
  currentTier: AccountTier;
  currentPriceId: string | null;
  hasActiveSubscription: boolean;
  trialEligible: boolean;
  pricesLoading: boolean;
  productsError: Error | null;
  onIntervalChange: (interval: BillingProductInterval) => void;
  onSelect: (
    card: TierCard,
    price: PriceView & { live: LivePrice },
    startTrial: boolean,
  ) => void;
  onClose: () => void;
};

const SelectTierStep = ({
  cards,
  interval,
  currentTier,
  currentPriceId,
  hasActiveSubscription,
  trialEligible,
  pricesLoading,
  productsError,
  onIntervalChange,
  onSelect,
  onClose,
}: SelectTierStepProps) => {
  const isEnterpriseUser = currentTier === "ENTERPRISE";

  return (
    <>
      {productsError && (
        <div
          className={`mb-3 rounded-lg border p-3 ${TONES.caution.surface}`}
        >
          <p className={`text-md ${TONES.caution.ink}`}>
            Live Stripe prices could not be loaded.
          </p>
          <p className="mt-0.5 text-xs leading-5 text-black/65">
            Plans are shown from the published catalog, but purchasing is
            paused until pricing is available again.
          </p>
        </div>
      )}

      <div className="mb-3 flex justify-end">
        <IntervalToggle
          value={interval}
          savingsPercent={yearlySavingsBadgePercent(cards)}
          onChange={onIntervalChange}
        />
      </div>

      <div className="grid gap-3 pt-2.5 md:grid-cols-3">
        {cards.map((card) => (
          <PlanCard
            key={card.tier}
            card={card}
            interval={interval}
            currentTier={currentTier}
            currentPriceId={currentPriceId}
            hasActiveSubscription={hasActiveSubscription}
            trialEligible={trialEligible}
            pricesLoading={pricesLoading}
            isEnterpriseUser={isEnterpriseUser}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button text="Close" style="secondary" onClick={onClose} />
      </div>
    </>
  );
};

export default SelectTierStep;
