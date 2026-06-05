import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import type { AccountTier } from "#/api/generated/graphql";
import type { WorkspaceListItem } from "#/api/workspace/hooks";

interface SelectWorkspaceMenuProps {
  accountTier: AccountTier;
  workspaces: WorkspaceListItem[];
}

const SelectWorkspaceMenu = ({
  accountTier,
  workspaces,
}: SelectWorkspaceMenuProps) => {
  const canCreateWorkspace = accountTier !== "FREE";

  return (
    <>
      <div className="text-sm flex pl-1.5 h-6 items-center">
        <p className="truncate underline">Select Workspace</p>
      </div>
      {canCreateWorkspace ? (
        <Link to="/create/workspace">
          <div className="text-sm h-8 p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <PlusIcon className="w-4 h-4" />
            <div>New Workspace</div>
          </div>
        </Link>
      ) : (
        <div
          aria-disabled="true"
          className="text-sm h-8 p-2 rounded-lg flex items-center gap-1.5 text-black/35 cursor-not-allowed select-none"
        >
          <PlusIcon className="w-4 h-4" />
          <div>New Workspace</div>
        </div>
      )}
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
