import type { ReactNode } from "react";
import {
  Briefcase,
  CheckSquare2,
  Clock,
  FileTextIcon,
  ListChecks,
  Scale,
  Target,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

// Superset of the icon names the two old fields.tsx accepted, so every existing
// call site keeps compiling. A raw LucideIcon is also accepted (mirrors
// Button's `icon` prop) so future sections need no union edit.
export type FormSectionIcon =
  | "briefcase"
  | "scale"
  | "clock"
  | "target"
  | "users"
  | "file-text"
  | "list-checks"
  | "workflow"
  | "checkSquare";

const FORM_SECTION_ICONS: Record<FormSectionIcon, LucideIcon> = {
  briefcase: Briefcase,
  scale: Scale,
  clock: Clock,
  target: Target,
  users: Users,
  "file-text": FileTextIcon,
  "list-checks": ListChecks,
  workflow: Workflow,
  checkSquare: CheckSquare2,
};

export type FormSectionProps = {
  title: string;
  description: string;
  icon: FormSectionIcon | LucideIcon;
  children: ReactNode;
};

export const FormSection = ({
  title,
  description,
  icon,
  children,
}: FormSectionProps) => {
  const Icon = typeof icon === "string" ? FORM_SECTION_ICONS[icon] : icon;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-black/15 p-2.5">
          <Icon className="w-5 h-5 text-black/90" />
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
};
