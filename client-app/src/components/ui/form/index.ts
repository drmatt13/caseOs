// Shared form-field primitives — the single source of truth for input/select/
// checkbox/label styling across the client app. See fieldStyles.ts for the two
// size tiers (md = full-page forms, sm = fields inside modals).

export { cn, type ClassValue } from "./cn";
export {
  FIELD_CLASS_MD,
  FIELD_CLASS_SM,
  fieldClassName,
  fieldClass,
  fieldDisabledClass,
  LABEL_CLASS,
  LABEL_CLASS_DISABLED,
  DESC_CLASS,
  DESC_CLASS_DISABLED,
  CHECKBOX_CLASS,
  type FieldSize,
  type FieldAlign,
  type SelectOption,
} from "./fieldStyles";
export { FieldShell, type FieldShellProps } from "./FieldShell";
export { TextInputField, type TextInputFieldProps } from "./TextInputField";
export { SelectField, type SelectFieldProps } from "./SelectField";
export { CheckboxField, type CheckboxFieldProps } from "./CheckboxField";
export {
  FormSection,
  type FormSectionProps,
  type FormSectionIcon,
} from "./FormSection";
