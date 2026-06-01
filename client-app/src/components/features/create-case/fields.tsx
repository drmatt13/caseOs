import {
  type ChangeEventHandler,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";

import type { SelectOption } from "#/components/features/create-case/caseIntakeForm";
import {
  Clock,
  Target,
  Briefcase,
  Scale,
  Users,
  FileTextIcon,
} from "lucide-react";

type FormSectionProps = {
  title: string;
  description: string;
  icon: "briefcase" | "scale" | "clock" | "target" | "users" | "file-text";
  children: ReactNode;
};

type FieldBaseProps = {
  label: string;
  description?: string;
  className?: string;
};

type TextInputFieldProps = FieldBaseProps & {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
};

type TextAreaFieldProps = FieldBaseProps & {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  rows?: number;
  minRows?: number;
  maxRows?: number;
};

type SelectFieldProps<T extends string> = FieldBaseProps & {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
};

const fieldClassName =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-md text-black shadow-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5";
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

const FieldShell = ({
  label,
  description,
  className = "",
  children,
}: FieldBaseProps & { children: ReactNode }) => (
  <label className={`grid self-start items-start gap-2 ${className}`.trim()}>
    <span className="flex flex-col gap-0.5 justify-end h-full">
      <span className="text-md font-medium text-black">{label}</span>
      {description ? (
        <span className="text-sm text-black/60">{description}</span>
      ) : null}
    </span>
    {children}
  </label>
);

export const FormSection = ({
  title,
  description,
  icon,
  children,
}: FormSectionProps) => (
  <section className="flex flex-col gap-6">
    <div className="flex items-center gap-2.5">
      <div className="rounded-lg bg-black/15 p-2.5">
        {icon === "briefcase" && (
          <Briefcase className="w-5 h-5 text-black/90" />
        )}
        {icon === "scale" && <Scale className="w-5 h-5 text-black/90" />}
        {icon === "clock" && <Clock className="w-5 h-5 text-black/90" />}
        {icon === "target" && <Target className="w-5 h-5 text-black/90" />}
        {icon === "users" && <Users className="w-5 h-5 text-black/90" />}
        {icon === "file-text" && (
          <FileTextIcon className="w-5 h-5 text-black/90" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <h2 className="text-xl font-semibold text-black">{title}</h2>
        <p className="-translate-y-px text-sm text-black/65 truncate">
          {description}
        </p>
      </div>
    </div>
    {children}
  </section>
);

export const TextInputField = ({
  label,
  description,
  value,
  onChange,
  placeholder,
  className,
}: TextInputFieldProps) => (
  <FieldShell label={label} description={description} className={className}>
    <input
      className={fieldClassName}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  </FieldShell>
);

export const TextAreaField = ({
  label,
  description,
  value,
  onChange,
  placeholder,
  rows = 2,
  minRows = 2,
  maxRows = 5,
  className,
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
    <FieldShell label={label} description={description} className={className}>
      <span className={textareaShellClassName}>
        <textarea
          ref={textareaRef}
          className={textareaClassName}
          style={textareaStyle}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={initialRows}
        />
      </span>
    </FieldShell>
  );
};

export const SelectField = <T extends string>({
  label,
  description,
  value,
  onChange,
  options,
  className,
}: SelectFieldProps<T>) => (
  <FieldShell label={label} description={description} className={className}>
    <select
      className={fieldClassName}
      value={value}
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
