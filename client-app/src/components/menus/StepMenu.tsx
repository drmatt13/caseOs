import {
  Briefcase,
  CheckSquare2,
  CheckSquare,
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
  labels = [],
}: StepMenuProps) => {
  return (
    <>
      {Array.from({ length: steps }, (_, index) => {
        const step = index + 1;
        const Icon = preapprovedStepMenuIcons[icons[index] ?? "briefcase"];
        const isLocked = maxUnlockedStep < step;
        const isActive = stepState === step;
        const isComplete = stepState > step;
        const label = labels[index] ?? {
          title: `Step ${step}`,
          subtitle: "",
        };

        return (
          <button
            key={step}
            type="button"
            disabled={isLocked}
            className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-left text-[.8rem] ${isLocked ? "cursor-not-allowed opacity-25" : isActive ? "bg-black/10 cursor-pointer" : "hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"}`}
            onClick={() => {
              if (!isLocked) {
                setStepState(step);
              }
            }}
          >
            <div
              className={`rounded-full p-2 ${
                isActive
                  ? "bg-black text-white"
                  : isComplete
                    ? "bg-green-600/60 text-black"
                    : "bg-black/10 text-black/60"
              } transition-colors ease-in duration-150`}
            >
              {isActive ? (
                <Icon className="w-4 h-4" />
              ) : isComplete ? (
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
