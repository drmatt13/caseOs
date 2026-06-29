import type { FocusEvent, ReactNode } from "react";
import { Plus, X } from "lucide-react";

import type { SelectOption } from "#/components/features/create-case/caseIntakeForm";
import { TONES } from "#/lib/tones";
import {
  fieldClassName,
  SelectField as SharedSelectField,
  TextInputField as SharedTextInputField,
  type SelectFieldProps,
  type TextInputFieldProps,
} from "#/components/ui/form";

// Field primitives now live in #/components/ui/form. Re-exported here so the
// case-intake forms keep importing from one place; `fieldClassName` stays a
// value export because the date pickers pass it to PrecisionDateField.
export { CheckboxField, FormSection } from "#/components/ui/form";
export { fieldClassName };

// Case intake bottom-aligns its labelled controls across multi-column rows, so
// these wrappers default the shared fields to `align="end"`.
export const TextInputField = (props: TextInputFieldProps) => (
  <SharedTextInputField align="end" {...props} />
);

export const SelectField = <T extends string>(props: SelectFieldProps<T>) => (
  <SharedSelectField align="end" {...props} />
);

// ─────────────────────────────────────────────────────────────────────────────
// Compact controls + repeater chrome
// Used inside repeater rows (people / events / claims) where the heavier
// label+description FieldShell would be too tall. Labels are text-sm; no
// description slot.
// ─────────────────────────────────────────────────────────────────────────────

type InlineTextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  className?: string;
};

export const InlineTextField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: InlineTextFieldProps) => (
  <label className={`grid gap-1.5 ${className}`.trim()}>
    <span className="text-sm font-medium text-black/80">{label}</span>
    <input
      className={fieldClassName}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
);

type InlineSelectFieldProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  className?: string;
};

export const InlineSelectField = <T extends string>({
  label,
  value,
  onChange,
  options,
  className = "",
}: InlineSelectFieldProps<T>) => (
  <label className={`grid gap-1.5 ${className}`.trim()}>
    <span className="text-sm font-medium text-black/80">{label}</span>
    <select
      className={fieldClassName}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

// Header for an optional "pin an anchor" repeater (claims / key dates / people).
// Frames the repeater as subordinate to the prose narrative above it: a compact
// title with the optionality inline, plus a one-line rationale for *why* you'd
// pin a row instead of leaving it to the assistant.
export const PinnedAnchorsHeader = ({
  title,
  rationale,
}: {
  title: string;
  rationale: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-md font-medium text-black">{title}</span>
    <span className="text-sm text-black/60">{rationale}</span>
  </div>
);

// A single removable entry in a repeater list (a person, event, claim, or task).
// When `invalid` is set, the row was started but is missing its identifying
// anchor (name / label / title) — the card switches to the `critical` tone and
// shows `invalidHint`. Parents flag a row on blur (not while typing) by wiring
// `onBlurLeave`, which fires only when focus actually leaves the card.
export const RepeaterCard = ({
  onRemove,
  removeLabel = "Remove",
  invalid = false,
  invalidHint,
  onBlurLeave,
  children,
}: {
  onRemove: () => void;
  removeLabel?: string;
  invalid?: boolean;
  invalidHint?: string;
  onBlurLeave?: () => void;
  children: ReactNode;
}) => {
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    // Only fire once focus has left the whole card, not when moving between its
    // own inputs.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onBlurLeave?.();
    }
  };

  return (
    <div
      onBlur={onBlurLeave ? handleBlur : undefined}
      className={`relative rounded-xl border p-4 pr-11 ${
        invalid ? TONES.critical.surface : "border-black/15 bg-white/50"
      }`}
    >
      <button
        type="button"
        onClick={onRemove}
        title={removeLabel}
        aria-label={removeLabel}
        className="absolute right-2.5 top-2.5 cursor-pointer rounded-lg p-1.5 text-black/45 transition-colors hover:bg-black/10 hover:text-black"
      >
        <X className="h-4 w-4" />
      </button>
      {children}
      {invalid && invalidHint ? (
        <p className={`mt-3 text-sm ${TONES.critical.ink}`}>{invalidHint}</p>
      ) : null}
    </div>
  );
};

// Dashed "add another" affordance that anchors the bottom of a repeater list.
export const AddRowButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/25 bg-transparent px-3 py-2.5 text-sm font-medium text-black/65 transition-colors hover:border-black/40 hover:bg-black/3 hover:text-black cursor-pointer"
  >
    <Plus className="h-4 w-4" />
    {label}
  </button>
);
