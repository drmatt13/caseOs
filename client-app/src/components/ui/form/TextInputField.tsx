import type { ChangeEventHandler } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "./cn";
import { FieldShell } from "./FieldShell";
import {
  fieldClass,
  fieldDisabledClass,
  ICON_CLASS,
  ICON_INPUT_CLASS,
  ICON_INPUT_DISABLED,
  ICON_SHELL_CLASS,
  ICON_SHELL_DISABLED,
  type FieldAlign,
  type FieldSize,
} from "./fieldStyles";

export type TextInputFieldProps = {
  label: string;
  description?: string;
  className?: string;
  size?: FieldSize;
  disabled?: boolean;
  align?: FieldAlign;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  icon?: LucideIcon;
  error?: string;
};

export const TextInputField = ({
  label,
  description,
  className,
  size = "md",
  disabled = false,
  align = "start",
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  error,
}: TextInputFieldProps) => (
  <FieldShell
    label={label}
    description={description}
    className={className}
    size={size}
    disabled={disabled}
    align={align}
  >
    {Icon ? (
      <span className={cn(ICON_SHELL_CLASS[size], disabled && ICON_SHELL_DISABLED)}>
        <Icon className={ICON_CLASS[size]} />
        <input
          className={cn(ICON_INPUT_CLASS[size], disabled && ICON_INPUT_DISABLED)}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      </span>
    ) : (
      <input
        className={cn(fieldClass(size), disabled && fieldDisabledClass)}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    )}
    {error ? <span className="text-xs text-red-600">{error}</span> : null}
  </FieldShell>
);
