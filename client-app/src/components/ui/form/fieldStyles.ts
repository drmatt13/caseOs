// Single source of truth for form-field styling. Two tiers:
//   md — full-page forms (create-workspace wizard, create-case intake)
//   sm — fields inside modals (record editor, Onboard Members, Edit User)
// Components below resolve a `size` prop through these tokens so that every
// field in a tier is pixel-identical, app-wide.

export type FieldSize = "md" | "sm";
export type FieldAlign = "start" | "end";

// One canonical option shape for every <SelectField>. Structurally identical to
// create-case's SelectOption, so the two are interchangeable.
export type SelectOption<T extends string> = { value: T; label: string };

// md — the canonical field. Unchanged from the old duplicated `fieldClassName`.
export const FIELD_CLASS_MD =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-md text-black shadow-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5";

// sm — the compact field. Standardizes the old ad-hoc `compactInputClass`, plus
// a hairline focus ring so the two tiers feel related.
export const FIELD_CLASS_SM =
  "w-full rounded-lg border border-black/15 bg-white/80 px-2 py-1 text-sm text-black/75 outline-none transition focus:border-black/30 focus:ring-1 focus:ring-black/5";

// Back-compat VALUE export: PrecisionDateField consumers (Timeline/Tasks intake)
// pass this string straight into `inputClassName`.
export const fieldClassName = FIELD_CLASS_MD;

export const fieldClass = (size: FieldSize = "md"): string =>
  size === "sm" ? FIELD_CLASS_SM : FIELD_CLASS_MD;

// Disabled overrides — mirrors TextAreaField so a disabled input and a disabled
// textarea read identically.
export const fieldDisabledClass =
  "cursor-not-allowed !bg-black/[0.045] !text-black/40 !shadow-none placeholder:!text-black/35 focus:!border-black/10 focus:!ring-0";

// Label / description, as complete per-state strings (not additive) so the `cn`
// joiner never has to break a text-color conflict between enabled and disabled.
export const LABEL_CLASS: Record<FieldSize, string> = {
  md: "text-md font-medium text-black",
  sm: "text-sm font-medium text-black/80",
};
export const LABEL_CLASS_DISABLED: Record<FieldSize, string> = {
  md: "text-md font-medium text-black/45",
  sm: "text-sm font-medium text-black/45",
};
export const DESC_CLASS: Record<FieldSize, string> = {
  md: "text-sm text-black/60",
  sm: "text-xs text-black/60",
};
export const DESC_CLASS_DISABLED: Record<FieldSize, string> = {
  md: "text-sm text-black/40",
  sm: "text-xs text-black/40",
};

// Leading-icon field variant (used by EditUserModal). Built per-size rather than
// override-chained so the bare `cn` joiner never has to break a class conflict.
export const ICON_SHELL_CLASS: Record<FieldSize, string> = {
  md: "flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 shadow-sm transition focus-within:border-black/30 focus-within:ring-2 focus-within:ring-black/5",
  sm: "flex items-center gap-2 rounded-lg border border-black/15 bg-white/80 px-2 transition focus-within:border-black/30 focus-within:ring-1 focus-within:ring-black/5",
};
export const ICON_SHELL_DISABLED =
  "cursor-not-allowed !border-black/10 !bg-black/[0.045] !shadow-none focus-within:!border-black/10 focus-within:!ring-0";
export const ICON_CLASS: Record<FieldSize, string> = {
  md: "h-4 w-4 shrink-0 text-black/45",
  sm: "h-3.5 w-3.5 shrink-0 text-black/45",
};
export const ICON_INPUT_CLASS: Record<FieldSize, string> = {
  md: "min-w-0 flex-1 bg-transparent py-2.5 text-md text-black outline-none",
  sm: "min-w-0 flex-1 bg-transparent py-1 text-sm text-black/75 outline-none",
};
export const ICON_INPUT_DISABLED =
  "cursor-not-allowed !text-black/40 placeholder:!text-black/35";

export const CHECKBOX_CLASS: Record<FieldSize, string> = {
  md: "h-4 w-4 rounded border-black/25 accent-[#282828]",
  sm: "h-3.5 w-3.5 accent-[#282828]",
};
export const CHECKBOX_LABEL_CLASS: Record<FieldSize, string> = {
  // md mirrors create-case's checkbox label (no w-fit) so re-exporting the shared
  // component is a pure dedupe; sm mirrors the record-editor checkbox.
  md: "flex cursor-pointer select-none items-center gap-2 text-sm text-black/80",
  sm: "flex w-fit cursor-pointer select-none items-center gap-2 text-sm text-black/70",
};
