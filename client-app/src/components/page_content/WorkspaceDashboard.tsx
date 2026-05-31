import { Settings, MessageSquare, Mail, UserPlus } from "lucide-react";
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
  role?: string;
}

const demoWorkspaceMembers: DemoWorkspaceMember[] = [
  {
    displayName: "caseos-user",
    firstName: "Jane",
    lastName: "Doe",
    role: "Owner",
  },
  {
    displayName: "caseos-user",
    firstName: "Jane",
    lastName: "Doe",
  },
  {
    displayName: "caseos-user",
    firstName: "Jane",
    lastName: "Doe",
  },
  {
    displayName: "caseos-user",
    firstName: "Jane",
    lastName: "Doe",
  },
  {
    displayName: "caseos-user",
    firstName: "Jane",
    lastName: "Doe",
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
      <div className="flex flex-col px-4 gap-1.5">
        <p className="text-xl font-bold">Workspace name</p>
        <p className="mb-1.5 text-md">
          This workspace is dedicated to managing residential tenancy disputes
          and housing-related legal matters. Members can collaborate on case
          files, share documents, and communicate about ongoing proceedings.
        </p>
        <div className="mt-2 pb-1 flex justify-between">
          <p className="text-md font-medium">
            Members ({demoWorkspaceMembers.length})
          </p>
          <div className="text-sm p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black border border-black/15 transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <UserPlus className="w-3.5 h-3.5" />
            <div>Onboard Members</div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {demoWorkspaceMembers.map((member, index) => (
            <div
              key={`${member.displayName}-${index}`}
              className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
            >
              <UserPanel
                user={{
                  displayName: member.displayName,
                  firstName: member.firstName,
                  lastName: member.lastName,
                }}
              />
              {member.role && (
                <div className="inline-flex w-fit shrink-0 items-center bg-black/10 px-2.5 py-1 rounded-lg text-sm group-hover:bg-black/15 transition-colors ease-in duration-150 group-hover:ease-out group-hover:duration-100">
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
