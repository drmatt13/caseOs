import {
  type ChangeEventHandler,
  type CSSProperties,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";

import { cn } from "#/components/ui/form/cn";
import {
  DESC_CLASS,
  DESC_CLASS_DISABLED,
  LABEL_CLASS,
  LABEL_CLASS_DISABLED,
  type FieldSize,
} from "#/components/ui/form/fieldStyles";

export type TextAreaFieldProps = {
  label: string;
  description?: string;
  className?: string;
  size?: FieldSize;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
};

// Two tiers, matching the input/select field tokens: md for full-page forms,
// sm for fields inside modals (the record editor, agent suggestion boxes, …).
const SHELL_CLASS: Record<FieldSize, string> = {
  md: "block w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition focus-within:border-black/30 focus-within:ring-2 focus-within:ring-black/5",
  sm: "block w-full overflow-hidden rounded-lg border border-black/15 bg-white/80 transition focus-within:border-black/30 focus-within:ring-1 focus-within:ring-black/5",
};
const INNER_CLASS: Record<FieldSize, string> = {
  md: "block w-full resize-y overflow-y-auto bg-transparent px-3 py-2.5 text-md leading-6 text-black outline-none",
  sm: "block w-full resize-y overflow-y-auto bg-transparent px-2 py-1 text-sm leading-5 text-black/75 outline-none",
};
const SHELL_DISABLED =
  "!border-black/10 !bg-black/[0.045] !shadow-none focus-within:!border-black/10 focus-within:!ring-0";
const INNER_DISABLED =
  "cursor-not-allowed !text-black/40 placeholder:!text-black/35";
// Row-height math per size: line-height (leading-6 / leading-5) + total vertical
// padding (py-2.5 / py-1), in rem. Must match the INNER_CLASS values above so
// the auto-resize lands exactly on text rows.
const LINE_HEIGHT_REM: Record<FieldSize, number> = { md: 1.5, sm: 1.25 };
const V_PADDING_REM: Record<FieldSize, number> = { md: 1.25, sm: 0.5 };

const remToPixels = (rem: number) =>
  rem * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

const getTextareaHeightForRows = (
  rows: number,
  lineHeightRem: number,
  vPaddingRem: number,
) => remToPixels(rows * lineHeightRem + vPaddingRem);

const TextAreaField = ({
  label,
  description,
  value,
  onChange,
  placeholder,
  rows = 2,
  minRows = 2,
  maxRows = 5,
  disabled = false,
  size = "md",
  className = "",
}: TextAreaFieldProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialResizeRef = useRef(true);
  const pendingInputTypeRef = useRef<string | null>(null);
  const lineHeightRem = LINE_HEIGHT_REM[size];
  const vPaddingRem = V_PADDING_REM[size];
  const initialRows = Math.min(maxRows, Math.max(minRows, rows));
  const textareaStyle = {
    minHeight: `${initialRows * lineHeightRem + vPaddingRem}rem`,
  } as CSSProperties;

  const resizeToContent = useCallback(
    (mode: "initial" | "grow" | "shrink") => {
      const textarea = textareaRef.current;

      if (!textarea) return;

      const currentHeight = textarea.getBoundingClientRect().height;
      const minHeight = getTextareaHeightForRows(
        initialRows,
        lineHeightRem,
        vPaddingRem,
      );
      const maxAutoHeight = getTextareaHeightForRows(
        maxRows,
        lineHeightRem,
        vPaddingRem,
      );

      textarea.style.height = "auto";
      const contentHeight = Math.max(minHeight, textarea.scrollHeight);

      if (mode === "initial") {
        textarea.style.height = `${Math.min(contentHeight, maxAutoHeight)}px`;
        return;
      }

      if (mode === "shrink") {
        textarea.style.height = `${Math.min(currentHeight, contentHeight)}px`;
        return;
      }

      textarea.style.height = `${Math.max(
        currentHeight,
        Math.min(contentHeight, maxAutoHeight),
      )}px`;
    },
    [initialRows, maxRows, lineHeightRem, vPaddingRem],
  );

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    const nativeEvent = event.nativeEvent as InputEvent;

    pendingInputTypeRef.current = nativeEvent.inputType ?? null;
    onChange(event);
  };

  useLayoutEffect(() => {
    const pendingInputType = pendingInputTypeRef.current;

    if (isInitialResizeRef.current || pendingInputType === null) {
      resizeToContent("initial");
    } else if (pendingInputType.startsWith("delete")) {
      resizeToContent("shrink");
    } else {
      resizeToContent("grow");
    }

    isInitialResizeRef.current = false;
    pendingInputTypeRef.current = null;
  }, [resizeToContent, value]);

  return (
    <label className={cn("grid self-start items-start gap-2", className)}>
      <span className="flex flex-col gap-0.5 justify-end h-full">
        <span
          className={disabled ? LABEL_CLASS_DISABLED[size] : LABEL_CLASS[size]}
        >
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
      <span className={cn(SHELL_CLASS[size], disabled && SHELL_DISABLED)}>
        <textarea
          ref={textareaRef}
          className={cn(INNER_CLASS[size], disabled && INNER_DISABLED)}
          style={textareaStyle}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={initialRows}
          disabled={disabled}
        />
      </span>
    </label>
  );
};

export default TextAreaField;
