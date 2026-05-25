import {
  accountTierLabels,
  formatPrice,
  type AccountTier,
  type ModalStep,
} from "#/components/modals/modify-subscription/types";

type SubscriptionSnapshotProps = {
  modalStep: ModalStep;
  currentTier: AccountTier;
  selectedTierLabel: string;
  selectedPrice: Parameters<typeof formatPrice>[0];
};

const SubscriptionSnapshot = ({
  modalStep,
  currentTier,
  selectedTierLabel,
  selectedPrice,
}: SubscriptionSnapshotProps) => {
  const isSelectingTier = modalStep === "select-tier";
  const label = isSelectingTier
    ? "Current subscription"
    : "Selected subscription";
  const tierName = isSelectingTier
    ? accountTierLabels[currentTier]
    : selectedTierLabel;
  const statusText = isSelectingTier
    ? currentTier === "FREE"
      ? "Default tier"
      : "Active tier"
    : `${formatPrice(selectedPrice)}${selectedPrice ? " /mo" : ""}`;

  return (
    <div className="mb-3 rounded-lg border border-black/10 bg-black/[0.03] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-gray-600">{label}</p>
          <p className="mt-1 font-serif text-xl">{tierName}</p>
        </div>

        <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] text-gray-700">
          {statusText}
        </span>
      </div>
    </div>
  );
};

export default SubscriptionSnapshot;
