import { BadgeCheck } from "lucide-react";

import Button from "#/components/ui/Button";
import {
  formatPrice,
  type AccountTier,
  type SelectableAccountTier,
  type TierOption,
} from "#/components/modals/modify-subscription/types";

type SelectTierStepProps = {
  tierOptions: TierOption[];
  selectedTier: SelectableAccountTier | null;
  currentTier: AccountTier;
  hasHadActiveSubscription: boolean;
  productsPending: boolean;
  productsError: Error | null;
  startTrial: boolean;
  canContinue: boolean;
  onTierSelect: (tier: SelectableAccountTier) => void;
  onStartTrialChange: (startTrial: boolean) => void;
  onClose: () => void;
  onContinue: () => void;
};

const SelectTierStep = ({
  tierOptions,
  selectedTier,
  currentTier,
  hasHadActiveSubscription,
  productsPending,
  productsError,
  startTrial,
  canContinue,
  onTierSelect,
  onStartTrialChange,
  onClose,
  onContinue,
}: SelectTierStepProps) => {
  return (
    <>
      {productsError && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
          Stripe prices could not be loaded. Check the billing products API and
          Stripe product metadata before subscribing.
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-2">
        {tierOptions.map((option) => {
          const isSelected = selectedTier === option.tier;
          const isCurrentTier = currentTier === option.tier;
          const showTrialOption =
            option.tier === "PRO" && !hasHadActiveSubscription;

          return (
            <div
              key={option.tier}
              role="button"
              tabIndex={isCurrentTier ? -1 : 0}
              onClick={() => {
                if (isCurrentTier) return;

                onTierSelect(option.tier);
              }}
              onKeyDown={(event) => {
                if (isCurrentTier) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onTierSelect(option.tier);
                }
              }}
              className={`flex min-h-64 flex-col rounded-lg border p-3 text-left transition-colors ${
                isCurrentTier
                  ? "cursor-not-allowed border-black/10 bg-gray-100 text-gray-500"
                  : isSelected
                    ? "border-black/50 bg-black/6"
                    : "cursor-pointer border-black/10 bg-white/60 hover:border-black/25 hover:bg-black/3"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-md">{option.name}</p>
                  <p className="mt-1 text-xs leading-4 text-gray-600">
                    {option.description}
                  </p>
                </div>

                {isCurrentTier && (
                  <span className="rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-xs text-gray-700">
                    Current
                  </span>
                )}
              </div>

              <div className="mt-4">
                <span className="font-serif text-2xl">
                  {productsPending ? "..." : formatPrice(option.price)}
                </span>
                {option.price && (
                  <span className="ml-1 text-xs text-gray-500">/mo</span>
                )}
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-600">
                {option.details}
              </p>

              <div className="mt-auto flex flex-col gap-1.5 pt-4">
                {option.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                    <span className="text-xs leading-4 text-gray-600">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {showTrialOption && (
                <label
                  onClick={(event) => event.stopPropagation()}
                  className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 bg-white/70 p-2 text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={startTrial && selectedTier === "PRO"}
                    onChange={(event) => {
                      onTierSelect("PRO");
                      onStartTrialChange(event.currentTarget.checked);
                    }}
                    className="h-3.5 w-3.5 accent-black"
                  />
                  <span>Start with a 7 day trial</span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button text="Close" style="secondary" onClick={onClose} />
        <Button
          text="Continue"
          icon="continue"
          onClick={onContinue}
          disabled={!canContinue}
        />
      </div>
    </>
  );
};

export default SelectTierStep;
