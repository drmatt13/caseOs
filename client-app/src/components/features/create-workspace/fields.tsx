// These form primitives now live in the shared module at #/components/ui/form
// (single source of truth for field styling). This file is kept as a thin
// re-export so existing create-workspace imports keep working unchanged.
export {
  FormSection,
  TextInputField,
  SelectField,
  CheckboxField,
  fieldClassName,
} from "#/components/ui/form";
