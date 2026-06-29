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
  // id of the control rendered as {children}. We associate the caption with the
  // control explicitly via htmlFor (rather than implicitly wrapping it in the
  // <label>) so `labelAdornment` can carry its own interactive button beside the
  // label without becoming the label's labeled control. SelectField/
  // TextInputField pass a useId() value here and onto their <select>/<input>.
  htmlFor?: string;
  // Optional control shown immediately to the right of the label text — e.g. an
  // info popover trigger. It lives OUTSIDE the <label>, so its button never
  // competes with the field for the accessible-name association.
  labelAdornment?: ReactNode;
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
  htmlFor,
  labelAdornment,
  children,
}: FieldShellProps & { children: ReactNode }) => (
  <div
    className={cn(
      "grid items-start gap-2",
      align === "end" && "self-end",
      className,
    )}
  >
    <span className="flex flex-col gap-0.5 justify-end h-full">
      <span className="flex items-center gap-1.5">
        <label
          htmlFor={htmlFor}
          className={disabled ? LABEL_CLASS_DISABLED[size] : LABEL_CLASS[size]}
        >
          {label}
        </label>
        {labelAdornment}
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
  </div>
);
