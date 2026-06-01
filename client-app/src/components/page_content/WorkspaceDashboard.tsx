import { Settings, MessageSquare, Mail } from "lucide-react";
import UserPanel from "#/components/UserPanel";
import Button from "#/components/Button";

import { useCurrentUserQuery } from "#/api/currentUser/hooks";

interface WorkspaceProps {
  workspaceId: string;
}

interface DemoWorkspaceMember {
  displayName: string;
  firstName: string;
  lastName: string;
  role: "Owner" | "Admin" | "Contributor" | "Read Only";
}

const roleBadgeColors: Record<DemoWorkspaceMember["role"], string> = {
  Owner:
    "border-purple-200 bg-purple-50 text-purple-800/80 group-hover:text-purple-900/70 group-hover:border-purple-900/25",
  Admin:
    "border-emerald-300/40 bg-green-50 text-green-800/85 group-hover:text-green-900/65 group-hover:border-green-900/25",
  Contributor:
    "border-blue-200 bg-blue-50 text-blue-800/85 group-hover:text-blue-900/70 group-hover:border-blue-900/25",
  "Read Only":
    "border-black/10 bg-black/5 text-black/65 group-hover:bg-gray-200/82.5 group-hover:text-black/60 group-hover:border-black/20",
};

const demoWorkspaceMembers: DemoWorkspaceMember[] = [
  {
    displayName: "Sarah Mitchell",
    firstName: "Sarah",
    lastName: "Mitchell",
    role: "Owner",
  },
  {
    displayName: "Michael Chen",
    firstName: "Michael",
    lastName: "Chen",
    role: "Admin",
  },
  {
    displayName: "Emily Rodriguez",
    firstName: "Emily",
    lastName: "Rodriguez",
    role: "Contributor",
  },
  {
    displayName: "David Patel",
    firstName: "David",
    lastName: "Patel",
    role: "Contributor",
  },
  {
    displayName: "Olivia Thompson",
    firstName: "Olivia",
    lastName: "Thompson",
    role: "Read Only",
  },
];

const WorkspaceDashboard = ({ workspaceId }: WorkspaceProps) => {
  // const {
  // data: userResult,
  // isPending: userPending,
  // error: userError,
  // } = useCurrentUserQuery();

  // useGetWorkspaceQuery would go here to fetch workspaces for the user and set them in state
  // For example:
  // const { data: getWorkspaceResult, isPending: getWorkspacePending, error: getWorkspaceError } = useGetWorkspacesQuery();

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
        {/* ONLY IF YOU ARE THE WORKSPACE OWNER SHOULD YOU SEE THIS */}
        {workspaceId && (
          <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <Settings className="w-5 h-5 text-black" />
          </div>
        )}
      </div>
      {/* DUPLICATED LOGIC */}
      <div className="flex flex-col px-4 gap-1.5">
        <p className="text-xl font-bold">Workspace name</p>
        <p className="mb-1.5 text-md">
          This workspace is dedicated to managing residential tenancy disputes
          and housing-related legal matters. Members can collaborate on case
          files, share documents, and communicate about ongoing proceedings.
        </p>
        <div className="mt-2 pb-1 flex justify-between items-end">
          <p className="text-md font-medium">
            Members ({demoWorkspaceMembers.length})
          </p>
          <Button style="secondary" text="Onboard Members" icon="userPlus" />
        </div>
        <div className="flex flex-col gap-1">
          {demoWorkspaceMembers.map((member, index) => (
            <div
              key={`${member.displayName}-${index}`}
              className="group flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
            >
              <UserPanel
                user={{
                  displayName: member.displayName,
                  firstName: member.firstName,
                  lastName: member.lastName,
                }}
              />
              {member.role && (
                <div
                  className={`${roleBadgeColors[member.role]} border inline-flex w-fit shrink-0 items-center px-2 py-0.5 rounded-full text-xs transition-colors ease-in duration-150 group-hover:ease-out group-hover:duration-100`}
                >
                  {member.role}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;
