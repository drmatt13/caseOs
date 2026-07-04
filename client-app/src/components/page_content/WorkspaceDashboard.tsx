import { useContext } from "react";
import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness } from "lucide-react";
import UserPanel from "#/components/layouts/UserPanel";
import Button from "#/components/ui/Button";
import WorkspaceRoleBadge from "#/components/ui/WorkspaceRoleBadge";
import type { WorkspaceDetail } from "#/api/workspace/hooks";
import { AppModalContext } from "#/context/AppModalContext";
import type { WorkspaceCapabilities } from "#/lib/permissions";
import { defaultWorkspaceCases } from "#/demo/defaultWorkspaceCases";

interface WorkspaceProps {
  workspace: WorkspaceDetail;
  userCapabilities: WorkspaceCapabilities;
}

const WorkspaceDashboard = ({
  workspace,
  userCapabilities,
}: WorkspaceProps) => {
  const { setModal, setModalWorkspaceId } = useContext(AppModalContext);

  const openManageMembers = () => {
    setModalWorkspaceId(workspace.id);
    setModal("manage members");
  };

  return (
    <div className="flex h-full min-w-0 flex-col gap-4">
      <div className="flex flex-col px-2 gap-1.5">
        <p className="text-xl font-bold">{workspace.name}</p>
        {workspace.description && (
          <p className="mb-1.5 text-md leading-6">
            <span className="underline mr-2">Description:</span>
            {workspace.description}
          </p>
        )}
        <div className="mt-2 pb-1 flex justify-between items-end">
          <p className="text-md font-medium">
            Cases ({defaultWorkspaceCases.length})
          </p>
          {userCapabilities.createCase && (
            <Link
              to="/workspaces/$workspaceId/cases/new"
              params={{ workspaceId: workspace.id }}
            >
              <Button style="secondary" text="New Case" icon="plus" />
            </Link>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {defaultWorkspaceCases.map((caseItem) => (
            <Link
              key={caseItem.id}
              to="/workspaces/$workspaceId/cases/$caseId"
              params={{ workspaceId: workspace.id, caseId: caseItem.id }}
              className="group flex min-h-14 items-center gap-3 rounded-xl border border-black/10 px-3 mb-0.5 transition-colors ease-in duration-150 hover:bg-black/10 hover:ease-out hover:duration-100"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-black/70">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-md font-medium">{caseItem.name}</p>
                <p className="truncate text-sm text-black/65">
                  Default workspace case
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-2 pb-1 flex justify-between items-end">
          <p className="text-md font-medium">
            Members ({workspace.memberships.length})
          </p>
          {userCapabilities.manageWorkspace && (
            <Button
              style="secondary"
              text="Manage Members"
              icon="userPlus"
              onClick={openManageMembers}
            />
          )}
        </div>
        <div className="flex flex-col gap-1">
          {workspace.memberships.map((member) => (
            <div
              key={member.id}
              className="h-14 group flex justify-between items-center px-3 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
            >
              <UserPanel
                insetBottom={false}
                user={{
                  firstName: member.user.firstName,
                  lastName: member.user.lastName,
                  profilePicture: member.user.profilePicture,
                }}
              />
              <WorkspaceRoleBadge role={member.role} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;
