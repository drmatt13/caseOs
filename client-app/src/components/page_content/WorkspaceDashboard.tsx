import UserPanel from "#/components/UserPanel";
import Button from "#/components/Button";
import ContentHeaderBar from "#/components/layouts/ContentHeaderBar";
import WorkspaceRoleBadge, {
  type WorkspaceRoleBadgeRole,
} from "#/components/WorkspaceRoleBadge";
import type { MembershipRole } from "#/api/generated/graphql";
import type { WorkspaceDetail } from "#/api/workspace/hooks";

interface WorkspaceProps {
  workspace: WorkspaceDetail;
}

const membershipRoleLabels: Record<MembershipRole, WorkspaceRoleBadgeRole> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  CONTRIBUTOR: "Contributor",
  READONLY: "Read Only",
};

const WorkspaceDashboard = ({ workspace }: WorkspaceProps) => {
  const canManageWorkspace =
    workspace.currentUserMembership?.role === "OWNER" ||
    workspace.currentUserMembership?.role === "ADMIN";

  return (
    <div className="flex h-full min-w-0 flex-col gap-4">
      <ContentHeaderBar showWorkspaceSettings={canManageWorkspace} />
      <div className="flex flex-col px-2 gap-1.5">
        <p className="text-xl font-bold">{workspace.name}</p>
        {workspace.description && (
          <p className="mb-1.5 text-md">
            <span className="underline mr-2">Description:</span>
            {workspace.description}
          </p>
        )}
        <div className="mt-2 pb-1 flex justify-between items-end">
          <p className="text-md font-medium">
            Members ({workspace.memberships.length})
          </p>
          <Button style="secondary" text="Onboard Members" icon="userPlus" />
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
                  displayName: member.user.displayName,
                  firstName: member.user.firstName,
                  lastName: member.user.lastName,
                  profilePicture: member.user.profilePicture,
                }}
              />
              <WorkspaceRoleBadge role={membershipRoleLabels[member.role]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;
