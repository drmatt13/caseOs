import type { BillingProductInterval } from "#/api/billing/operations";
import { TONES } from "#/lib/tones";

type IntervalToggleProps = {
  value: BillingProductInterval;
  savingsPercent: number | null;
  onChange: (interval: BillingProductInterval) => void;
};

const intervalOptions: { value: BillingProductInterval; label: string }[] = [
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

const IntervalToggle = ({
  value,
  savingsPercent,
  onChange,
}: IntervalToggleProps) => {
  return (
    <div className="flex items-center gap-2">
      {savingsPercent !== null && (
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${TONES.neutral.badge}`}
        >
          Save ~{savingsPercent}% yearly
        </span>
      )}

      <div
        role="radiogroup"
        aria-label="Billing interval"
        className="flex rounded-lg border border-black/15 bg-white/50 p-0.5 shadow-sm"
      >
        {intervalOptions.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(option.value)}
              className={`rounded-md px-3 py-1 text-sm transition-colors duration-150 ease-in hover:duration-100 hover:ease-out ${
                isActive
                  ? "bg-[#282828] text-white"
                  : "cursor-pointer text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IntervalToggle;
