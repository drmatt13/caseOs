import { Settings, MessageSquare, Mail } from "lucide-react";
import UserPanel from "#/components/UserPanel";
import Button from "#/components/Button";
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
      {/* DUPLICATED LOGIC */}
      <div className="flex flex-row justify-between text-sm px-4 sm:px-0 border-b border-black/15 pb-3">
        <div className="flex gap-1.5">
          {/* ONLY IF INVITES ARE AVAILABLE */}
          <div className="text-sm p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <Mail className="w-3.5 h-3.5" />
            <div>Invites</div>
          </div>
          <div className="text-sm p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <MessageSquare className="w-3.5 h-3.5" />
            <div>Messages</div>
          </div>
        </div>
        {/* ONLY IF YOU ARE THE WORKSPACE OWNER OR ADMINISTRATOR SHOULD YOU SEE THIS */}
        {canManageWorkspace && (
          <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <Settings className="w-5 h-5 text-black" />
          </div>
        )}
      </div>
      {/* DUPLICATED LOGIC */}
      <div className="flex flex-col px-4 gap-1.5">
        <p className="text-xl font-bold">{workspace.name}</p>
        <p className="mb-1.5 text-md">
          {workspace.description || "No workspace description yet."}
        </p>
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
