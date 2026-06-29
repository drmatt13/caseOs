import type { ReactNode } from "react";

import { cn } from "./cn";
import {
  DESC_CLASS,
  DESC_CLASS_DISABLED,
  LABEL_CLASS,
  LABEL_CLASS_DISABLED,
  type FieldAlign,
  type FieldSize,
} from "./fieldStyles";

export type FieldShellProps = {
  label: string;
  description?: string;
  className?: string;
  size?: FieldSize;
  disabled?: boolean;
  align?: FieldAlign;
};

// Label (+ optional description) wrapper shared by TextInputField/SelectField.
// `align="end"` bottom-aligns the control across a multi-column row where
// sibling descriptions differ in height (used throughout case intake).
export const FieldShell = ({
  label,
  description,
  className,
  size = "md",
  disabled = false,
  align = "start",
  children,
}: FieldShellProps & { children: ReactNode }) => (
  <label
    className={cn(
      "grid items-start gap-2",
      align === "end" && "self-end",
      className,
    )}
  >
    <span className="flex flex-col gap-0.5 justify-end h-full">
      <span className={disabled ? LABEL_CLASS_DISABLED[size] : LABEL_CLASS[size]}>
        {label}
      </span>
      {description ? (
        <span
          className={disabled ? DESC_CLASS_DISABLED[size] : DESC_CLASS[size]}
        >
          {description}
        </span>
      ) : null}
    </span>
    {children}
  </label>
);
