import { useId, type ReactNode } from "react";

import { cn } from "./cn";
import { FieldShell } from "./FieldShell";
import {
  fieldClass,
  fieldDisabledClass,
  type FieldAlign,
  type FieldSize,
  type SelectOption,
} from "./fieldStyles";

export type SelectFieldProps<T extends string> = {
  label: string;
  description?: string;
  className?: string;
  size?: FieldSize;
  disabled?: boolean;
  align?: FieldAlign;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  // Rendered beside the label text (e.g. an info popover trigger). Forwarded to
  // FieldShell, which keeps it outside the <label> association.
  labelAdornment?: ReactNode;
};

export const SelectField = <T extends string>({
  label,
  description,
  className,
  size = "md",
  disabled = false,
  align = "start",
  value,
  onChange,
  options,
  labelAdornment,
}: SelectFieldProps<T>) => {
  const id = useId();

  return (
    <FieldShell
      label={label}
      description={description}
      className={className}
      size={size}
      disabled={disabled}
      align={align}
      htmlFor={id}
      labelAdornment={labelAdornment}
    >
      <select
        id={id}
        className={cn(fieldClass(size), disabled && fieldDisabledClass)}
        value={value}
        disabled={disabled}
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
};
