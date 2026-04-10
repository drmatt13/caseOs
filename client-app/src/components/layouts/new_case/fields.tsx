import type { ChangeEventHandler, ReactNode } from "react";

import type { SelectOption } from "#/components/layouts/new_case/caseIntakeForm";
import {
  Settings,
  Bot,
  Clock,
  Target,
  SquareCheckBig,
  CheckIcon,
  CheckCircleIcon,
  Folder,
  FileText,
  PlusIcon,
  Briefcase,
  Scale,
  Users,
  FileTextIcon,
  CheckSquare,
  // Link,
  ArrowLeft,
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
};

type SelectFieldProps<T extends string> = FieldBaseProps & {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
};

const fieldClassName =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-black shadow-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5";

const FieldShell = ({
  label,
  description,
  className = "",
  children,
}: FieldBaseProps & { children: ReactNode }) => (
  <label className={`flex flex-col gap-2 ${className}`.trim()}>
    <span className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-black">{label}</span>
      {description ? (
        <span className="text-xs text-black/60">{description}</span>
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
        <h2 className="text-[1.1rem] font-semibold text-black">{title}</h2>
        <p className="-translate-y-0.5 text-xs text-black/65 truncate">
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
  rows = 5,
  className,
}: TextAreaFieldProps) => (
  <FieldShell label={label} description={description} className={className}>
    <textarea
      className={`${fieldClassName} min-h-14 h-24 resize-y`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  </FieldShell>
);

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
