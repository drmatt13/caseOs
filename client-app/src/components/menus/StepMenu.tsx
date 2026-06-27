import {
  Briefcase,
  CheckSquare,
  CheckSquare2,
  Clock,
  FileTextIcon,
  Scale,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StepMenuIcon =
  | "briefcase"
  | "scale"
  | "clock"
  | "target"
  | "users"
  | "fileText"
  | "checkSquare"
  | "sparkles";

export interface StepMenuLabel {
  title: string;
  subtitle?: string;
}

export interface StepMenuProps {
  steps: number;
  icons: StepMenuIcon[];
  stepState: number;
  setStepState: (step: number) => void;
  maxUnlockedStep?: number;
  // Steps 1..completedThroughStep render as checked — independent of which step is
  // currently active, so checks persist when navigating back. A step earns its
  // check only once it's been moved past (visited + valid), not merely because
  // it's valid, so trivially-valid optional steps don't pre-check.
  completedThroughStep?: number;
  labels?: StepMenuLabel[];
}

const preapprovedStepMenuIcons: Record<StepMenuIcon, LucideIcon> = {
  briefcase: Briefcase,
  scale: Scale,
  clock: Clock,
  target: Target,
  users: Users,
  fileText: FileTextIcon,
  checkSquare: CheckSquare2,
  sparkles: Sparkles,
};

const StepMenu = ({
  steps,
  icons,
  stepState,
  setStepState,
  maxUnlockedStep = stepState,
  completedThroughStep = stepState - 1,
  labels = [],
}: StepMenuProps) => {
  return (
    <>
      {Array.from({ length: steps }, (_, index) => {
        const step = index + 1;
        const Icon = preapprovedStepMenuIcons[icons[index] ?? "briefcase"];
        const isLocked = maxUnlockedStep < step;
        const isActive = stepState === step;
        // Validity-driven, not cursor-driven: a step stays checked while you
        // navigate back, and un-checks the moment its prefix is broken.
        const isComplete = step <= completedThroughStep;
        const label = labels[index] ?? {
          title: `Step ${step}`,
          subtitle: "",
        };

        // The icon disc carries completeness (green check wins over everything);
        // the row carries "where you are" (the active highlight). So landing back
        // on a finished step shows a checked disc inside a highlighted row.
        const discClassName = isComplete
          ? "bg-green-600/70 text-white"
          : isActive
            ? "bg-black text-white"
            : "bg-black/10 text-black/55";

        return (
          <button
            key={step}
            type="button"
            disabled={isLocked}
            aria-current={isActive ? "step" : undefined}
            className={`group p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-left text-[.8rem] transition-all duration-200 ${
              isLocked
                ? "cursor-not-allowed opacity-30"
                : isActive
                  ? "bg-black/10 cursor-pointer ring-1 ring-black/10"
                  : "hover:bg-black/10 cursor-pointer"
            }`}
            onClick={() => {
              if (!isLocked) {
                setStepState(step);
              }
            }}
          >
            <div
              className={`rounded-full p-2 transition-all duration-200 ${discClassName}`}
            >
              {isComplete ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            <div className="flex flex-col">
              <p className="translate-y-[.075rem]">{label.title}</p>
              {label.subtitle && (
                <p className="text-gray-700 text-sm">{label.subtitle}</p>
              )}
            </div>
          </button>
        );
      })}
    </>
  );
};

export default StepMenu;
