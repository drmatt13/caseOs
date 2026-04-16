import { useState } from "react";

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

import type { ViewTypes } from "#/../../types/caseWorkspace";

// interface WorkspaceMenuProps {
//   workSpace: string;
//   setWorkSpace: React.Dispatch<React.SetStateAction<string>>;
// }

const viewMenuItems: Array<{
  value: ViewTypes;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "agent_config", label: "Agent Config", icon: Bot },
  { value: "case_summary", label: "Case Summary", icon: FileText },
  { value: "arguments", label: "Arguments", icon: Gavel },
  { value: "case_notes", label: "Case Notes", icon: NotebookPen },
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

const WorkspaceMenu = () => {
  const [workSpace, setWorkSpace] = useState<ViewTypes | null>(null);

  return (
    <>
      {viewMenuItems.map(({ value, label, icon: Icon }) => (
        <div
          key={value}
          className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer ${
            workSpace === value ? "bg-mist-300/60" : "hover:bg-mist-300/60"
          }`}
          onClick={() => setWorkSpace(value)}
        >
          <Icon className="w-4 h-4" />
          <div>{label}</div>
        </div>
      ))}
    </>
  );
};

export default WorkspaceMenu;
