import { ArrowLeft, PlusIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { defaultWorkspaceCases } from "#/demo/defaultWorkspaceCases";

interface SelectCaseMenuProps {
  workspaceId: string;
  workspaceName: string;
  // Only owners/admins may create cases (createCase capability). When false the
  // "New Case" entry is hidden; the route itself also guards against direct
  // navigation.
  canCreateCase: boolean;
}

const SelectCaseMenu = ({
  workspaceId,
  workspaceName,
  canCreateCase,
}: SelectCaseMenuProps) => {
  return (
    <>
      <div className="text-sm flex gap-1.5 items-center">
        <Link to="/">
          <button
            type="button"
            className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
        </Link>
        <p className="truncate">{workspaceName}</p>
      </div>
      {canCreateCase && (
        <Link
          to="/workspaces/$workspaceId/cases/new"
          params={{ workspaceId }}
        >
          <div className="text-sm h-8 p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <PlusIcon className="w-4 h-4" />
            <div>New Case</div>
          </div>
        </Link>
      )}
      {defaultWorkspaceCases.map((caseItem) => (
        <Link
          key={caseItem.id}
          to="/workspaces/$workspaceId/cases/$caseId"
          params={{ workspaceId, caseId: caseItem.id }}
        >
          <div className="text-sm h-8 p-2 rounded-lg hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <p className="truncate">{caseItem.name}</p>
          </div>
        </Link>
      ))}
    </>
  );
};

export default SelectCaseMenu;
