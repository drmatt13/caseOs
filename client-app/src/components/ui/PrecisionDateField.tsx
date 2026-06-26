import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";

import type { DatePrecision } from "#/types/caseRecords";
import {
  inputTypeForPrecision,
  stepForPrecision,
  toDateInputValue,
} from "#/lib/datePrecision";

// ─────────────────────────────────────────────────────────────────────────────
// Adaptive date / date-time field.
//
// The single date input reused everywhere a timeline date is captured (the
// case-creation key-dates form and the workspace record editor). Its control
// morphs with the chosen `precision`: a plain date picker for year/month/day,
// a date-and-time picker for hour/minute/second (see #/lib/datePrecision). The
// owner keeps the precision in its own state and passes it in; this component
// only renders the right input and slices the stored ISO value to fit it.
//
// Styling is delegated so each surface keeps its own look — pass the wrapper /
// label / input classNames the surrounding form already uses.
// ─────────────────────────────────────────────────────────────────────────────

export default function PrecisionDateField({
  label,
  value,
  precision,
  onChange,
  min,
  required,
  action,
  className = "flex flex-col gap-1.5",
  labelClassName = "text-xs text-black/60",
  inputClassName,
}: {
  label: string;
  value: string | undefined;
  precision: DatePrecision;
  onChange: (next: string) => void;
  // Lower bound as a raw ISO value (e.g. an event's start when picking its end);
  // converted to the input's format internally.
  min?: string;
  required?: boolean;
  // Optional trailing control rendered on the label row (e.g. a "Remove" button).
  action?: ReactNode;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}) {
  return (
    <label className={className}>
      <span className="flex items-center justify-between gap-2">
        <span className={labelClassName}>{label}</span>
        {action}
      </span>
      <input
        type={inputTypeForPrecision(precision)}
        step={stepForPrecision(precision)}
        min={min ? toDateInputValue(min, precision) : undefined}
        required={required}
        className={inputClassName}
        value={toDateInputValue(value, precision)}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Optional end-date field (collapsed by default).
//
// A timeline event's end bound is optional — most events are a single instant.
// Rather than always render an empty input, this collapses to a small "Add end
// date" affordance and only expands into a PrecisionDateField (with an inline
// "Remove") once the user opts into a ranged event. Removing clears the value
// (onChange(undefined)) and collapses again. Shares the same precision as the
// start date so both bounds render at one grain.
// ─────────────────────────────────────────────────────────────────────────────

export function OptionalEndDateField({
  value,
  precision,
  onChange,
  min,
  label = "End date",
  addLabel = "Add end date",
  className,
  labelClassName,
  inputClassName,
}: {
  value: string | undefined;
  precision: DatePrecision;
  onChange: (next: string | undefined) => void;
  min?: string;
  label?: string;
  addLabel?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}) {
  const [expanded, setExpanded] = useState(Boolean(value));

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex h-fit w-fit items-center gap-1.5 self-end rounded-lg border border-dashed border-black/20 px-2.5 py-1.5 text-xs text-black/55 transition-colors hover:border-black/35 hover:text-black/80"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    );
  }

  return (
    <PrecisionDateField
      label={label}
      value={value}
      precision={precision}
      onChange={(next) => onChange(next)}
      min={min}
      className={className}
      labelClassName={labelClassName}
      inputClassName={inputClassName}
      action={
        <button
          type="button"
          onClick={() => {
            onChange(undefined);
            setExpanded(false);
          }}
          className="flex items-center gap-1 text-xs text-black/45 transition-colors hover:text-red-700"
        >
          <X className="h-3 w-3" />
          Remove
        </button>
      }
    />
  );
}
