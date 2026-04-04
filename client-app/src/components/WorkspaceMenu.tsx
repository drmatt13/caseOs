import React from "react";

import {
  Settings,
  Bot,
  Clock,
  Target,
  SquareCheckBig,
  Folder,
  FileText,
  PlusIcon,
} from "lucide-react";

interface WorkspaceMenuProps {
  workSpace: string;
  setWorkSpace: React.Dispatch<React.SetStateAction<string>>;
}

const WorkspaceMenu = ({ workSpace, setWorkSpace }: WorkspaceMenuProps) => {
  return (
    <>
      <div
        className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer ${
          workSpace === "Agent Config" ? "bg-sky-500/60" : "hover:bg-white/15"
        }`}
        onClick={() => setWorkSpace("Agent Config")}
      >
        <Bot className="w-4 h-4" />
        <div>Agent Config</div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer ${
          workSpace === "Case Summary" ? "bg-sky-500/60" : "hover:bg-white/15"
        }`}
        onClick={() => setWorkSpace("Case Summary")}
      >
        <FileText className="w-4 h-4" />
        <div>Case Summary</div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer ${
          workSpace === "Timeline" ? "bg-sky-500/60" : "hover:bg-white/15"
        }`}
        onClick={() => setWorkSpace("Timeline")}
      >
        <Clock className="w-4 h-4" />
        <div>Timeline</div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer ${
          workSpace === "Objectives" ? "bg-sky-500/60" : "hover:bg-white/15"
        }`}
        onClick={() => setWorkSpace("Objectives")}
      >
        <Target className="w-4 h-4" />
        <div>Objectives</div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer ${
          workSpace === "Tasks" ? "bg-sky-500/60" : "hover:bg-white/15"
        }`}
        onClick={() => setWorkSpace("Tasks")}
      >
        <SquareCheckBig className="w-4 h-4" />
        <div>Tasks</div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer ${
          workSpace === "Documents" ? "bg-sky-500/60" : "hover:bg-white/15"
        }`}
        onClick={() => setWorkSpace("Documents")}
      >
        <Folder className="w-4 h-4" />
        <div>Documents</div>
      </div>
    </>
  );
};

export default WorkspaceMenu;
