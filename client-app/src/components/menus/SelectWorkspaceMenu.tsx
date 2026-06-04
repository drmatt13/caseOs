import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import type { WorkspaceListItem } from "#/api/workspace/hooks";

interface SelectWorkspaceMenuProps {
  workspaces: WorkspaceListItem[];
}

const SelectWorkspaceMenu = ({ workspaces }: SelectWorkspaceMenuProps) => {
  return (
    <>
      <div className="text-sm flex pl-1.5 h-6 items-center">
        <p className="truncate underline">Select Workspace</p>
      </div>
      <Link to="/create/workspace">
        <div className="text-sm h-8 p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
          <PlusIcon className="w-4 h-4" />
          <div>New Workspace</div>
        </div>
      </Link>
      {workspaces.map((workspace) => (
        <Link
          key={workspace.id}
          to="/workspace/$id"
          params={{ id: workspace.id }}
        >
          <div className="text-sm h-8 p-2 rounded-lg hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <p className="truncate">{workspace.name}</p>
          </div>
        </Link>
      ))}
    </>
  );
};

export default SelectWorkspaceMenu;
