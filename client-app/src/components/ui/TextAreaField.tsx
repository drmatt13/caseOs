import {
  type ChangeEventHandler,
  type CSSProperties,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";

export type TextAreaFieldProps = {
  label: string;
  description?: string;
  className?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
};

const textareaShellClassName =
  "block w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition focus-within:border-black/30 focus-within:ring-2 focus-within:ring-black/5";
const textareaClassName =
  "block w-full resize-y overflow-y-auto bg-transparent px-3 py-2.5 text-md leading-6 text-black outline-none";
const textareaLineHeightRem = 1.5;
const textareaVerticalPaddingRem = 1.25;

const remToPixels = (rem: number) =>
  rem * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

const getTextareaHeightForRows = (rows: number) =>
  remToPixels(rows * textareaLineHeightRem + textareaVerticalPaddingRem);

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
  className = "",
}: TextAreaFieldProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialResizeRef = useRef(true);
  const pendingInputTypeRef = useRef<string | null>(null);
  const initialRows = Math.min(maxRows, Math.max(minRows, rows));
  const textareaStyle = {
    minHeight: `${initialRows * textareaLineHeightRem + textareaVerticalPaddingRem}rem`,
  } as CSSProperties;

  const resizeToContent = useCallback(
    (mode: "initial" | "grow" | "shrink") => {
      const textarea = textareaRef.current;

      if (!textarea) return;

      const currentHeight = textarea.getBoundingClientRect().height;
      const minHeight = getTextareaHeightForRows(initialRows);
      const maxAutoHeight = getTextareaHeightForRows(maxRows);

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
    [initialRows, maxRows],
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
    <label className={`grid self-start items-start gap-2 ${className}`.trim()}>
      <span className="flex flex-col gap-0.5 justify-end h-full">
        <span
          className={`text-md font-medium ${
            disabled ? "text-black/45" : "text-black"
          }`}
        >
          {label}
        </span>
        {description ? (
          <span
            className={`text-sm ${
              disabled ? "text-black/40" : "text-black/60"
            }`}
          >
            {description}
          </span>
        ) : null}
      </span>
      <span
        className={`${textareaShellClassName} ${
          disabled
            ? "!border-black/10 !bg-black/[0.045] !shadow-none focus-within:!border-black/10 focus-within:!ring-0"
            : ""
        }`}
      >
        <textarea
          ref={textareaRef}
          className={`${textareaClassName} ${
            disabled
              ? "cursor-not-allowed !text-black/40 placeholder:!text-black/35"
              : ""
          }`}
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
