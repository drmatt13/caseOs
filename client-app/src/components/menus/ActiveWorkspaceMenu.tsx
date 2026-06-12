import {
  Bot,
  Clock,
  Target,
  SquareCheckBig,
  Folder,
  FileText,
  Scale,
  Gavel,
  NotebookPen,
  Lightbulb,
  AlertCircle,
  Mic,
  Compass,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { ViewTypes } from "#/types/caseWorkspace";

interface ActiveWorkspaceMenuProps {
  activeView: ViewTypes;
  onSelectView: (view: ViewTypes) => void;
  counts?: Partial<Record<ViewTypes, number>>;
}

const viewMenuItems: Array<{
  value: ViewTypes;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "case_agent", label: "Case Agent", icon: Bot },
  { value: "case_summary", label: "Overview", icon: FileText },
  { value: "arguments", label: "Arguments", icon: Gavel },
  { value: "case_notes", label: "Notes", icon: NotebookPen },
  { value: "facts", label: "Facts", icon: Lightbulb },
  { value: "issues", label: "Issues", icon: AlertCircle },
  { value: "legal_precedent", label: "Legal Precedent", icon: Scale },
  { value: "objectives", label: "Objectives", icon: Target },
  { value: "posture", label: "Posture", icon: Compass },
  { value: "tasks", label: "Tasks", icon: SquareCheckBig },
  { value: "testimony", label: "Testimony", icon: Mic },
  { value: "timeline", label: "Timeline", icon: Clock },
  { value: "documents_index", label: "Documents", icon: Folder },
];

const ActiveWorkspaceMenu = ({
  activeView,
  onSelectView,
  counts = {},
}: ActiveWorkspaceMenuProps) => {
  return (
    <>
      {viewMenuItems.map(({ value, label, icon: Icon }) => (
        <div
          key={value}
          className={`p-2 h-8 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100 ${
            activeView === value ? "bg-black/10" : "hover:bg-black/10"
          }`}
          onClick={() => onSelectView(value)}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="w-4 h-4 shrink-0" />
            <div className="truncate">{label}</div>
          </div>
          {counts[value] != null && (
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-xs text-black/60">
              {counts[value]}
            </span>
          )}
        </div>
      ))}
    </>
  );
};

export default ActiveWorkspaceMenu;
