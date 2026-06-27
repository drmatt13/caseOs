import type { ChangeEventHandler, FocusEvent, ReactNode } from "react";

import type { SelectOption } from "#/components/features/create-case/caseIntakeForm";
import { TONES } from "#/lib/tones";
import {
  Clock,
  Target,
  Briefcase,
  Scale,
  Users,
  FileTextIcon,
  ListChecks,
  Plus,
  X,
} from "lucide-react";

type FormSectionProps = {
  title: string;
  description: string;
  icon:
    | "briefcase"
    | "scale"
    | "clock"
    | "target"
    | "users"
    | "file-text"
    | "list-checks";
  children: ReactNode;
};

type FieldBaseProps = {
  label: string;
  description?: string;
  className?: string;
};

type TextInputFieldProps = FieldBaseProps & {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
};

type SelectFieldProps<T extends string> = FieldBaseProps & {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
};

export const fieldClassName =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-md text-black shadow-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5";

const FieldShell = ({
  label,
  description,
  className = "",
  children,
}: FieldBaseProps & { children: ReactNode }) => (
  <label className={`grid self-start items-start gap-2 ${className}`.trim()}>
    <span className="flex flex-col gap-0.5 justify-end h-full">
      <span className="text-md font-medium text-black">{label}</span>
      {description ? (
        <span className="text-sm text-black/60">{description}</span>
      ) : null}
    </span>
    {children}
  </label>
);

export const FormSection = ({
  title,
  description,
  icon,
  children,
}: FormSectionProps) => (
  <section className="flex flex-col gap-6">
    <div className="flex items-center gap-2.5">
      <div className="rounded-lg bg-black/15 p-2.5">
        {icon === "briefcase" && (
          <Briefcase className="w-5 h-5 text-black/90" />
        )}
        {icon === "scale" && <Scale className="w-5 h-5 text-black/90" />}
        {icon === "clock" && <Clock className="w-5 h-5 text-black/90" />}
        {icon === "target" && <Target className="w-5 h-5 text-black/90" />}
        {icon === "users" && <Users className="w-5 h-5 text-black/90" />}
        {icon === "file-text" && (
          <FileTextIcon className="w-5 h-5 text-black/90" />
        )}
        {icon === "list-checks" && (
          <ListChecks className="w-5 h-5 text-black/90" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <h2 className="text-xl font-semibold text-black">{title}</h2>
        <p className="-translate-y-px text-sm text-black/65 truncate">
          {description}
        </p>
      </div>
    </div>
    {children}
  </section>
);

export const TextInputField = ({
  label,
  description,
  value,
  onChange,
  placeholder,
  className,
}: TextInputFieldProps) => (
  <FieldShell label={label} description={description} className={className}>
    <input
      className={fieldClassName}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  </FieldShell>
);

export const SelectField = <T extends string>({
  label,
  description,
  value,
  onChange,
  options,
  className,
}: SelectFieldProps<T>) => (
  <FieldShell label={label} description={description} className={className}>
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
  </FieldShell>
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

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export const CheckboxField = ({
  label,
  checked,
  onChange,
  className = "",
}: CheckboxFieldProps) => (
  <label
    className={`flex items-center gap-2 text-sm text-black/80 ${className}`.trim()}
  >
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-black/25 accent-[#282828]"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    {label}
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
