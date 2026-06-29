import { cn } from "./cn";
import {
  CHECKBOX_CLASS,
  CHECKBOX_LABEL_CLASS,
  type FieldSize,
} from "./fieldStyles";

export type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  size?: FieldSize;
};

export const CheckboxField = ({
  label,
  checked,
  onChange,
  className,
  size = "md",
}: CheckboxFieldProps) => (
  <label className={cn(CHECKBOX_LABEL_CLASS[size], className)}>
    <input
      type="checkbox"
      className={CHECKBOX_CLASS[size]}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    {label}
  </label>
);
