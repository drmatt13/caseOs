import { useContext } from "react";
import {
  BriefcaseBusiness,
  FileText,
  PlusIcon,
  Settings,
  MessageSquare,
  Mail,
  Scale,
  UserPlus,
  Users,
} from "lucide-react";
import UserPanel from "./UserPanel";
import Button from "./Button";
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { AppModalContext } from "#/context/AppModalContext";

interface WorkspaceProps {
  // Update later to be an object that includes workspace details like name, description, members, etc.
  workspace: string | null;
}

interface EmptyWorkspaceStateProps {
  canCreateWorkspace: boolean;
  onCreateWorkspace: () => void;
  onCheckInvites: () => void;
}

interface ActiveWorkspaceStateProps {
  workspace: string;
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

const ActiveWorkspaceState = ({ workspace }: ActiveWorkspaceStateProps) => {
  return (
    <div className="flex flex-col px-4 /py-1 gap-1.5">
      <p className="text-xl font-bold">{workspace}</p>
      <p className="mb-1.5">
        This workspace is dedicated to managing residential tenancy disputes and
        housing-related legal matters. Members can collaborate on case files,
        share documents, and communicate about ongoing proceedings.
      </p>
      <div className="mt-2 pb-1 flex justify-between">
        <p className="text-md font-medium text-black/75">
          Members ({demoWorkspaceMembers.length})
        </p>
        <div className="text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black border border-black/15 transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
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
              <div className="h-full bg-black/10 px-2.5 py-1 rounded-lg text-xs group-hover:bg-black/15 transition-colors ease-in duration-150 group-hover:ease-out group-hover:duration-100">
                {member.role}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const EmptyWorkspaceState = ({
  canCreateWorkspace,
  onCreateWorkspace,
  onCheckInvites,
}: EmptyWorkspaceStateProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pt-6 pb-2 text-center">
      <div className="mb-4 flex aspect-square items-center justify-center rounded-full border border-black/10 bg-black/6 p-4">
        <BriefcaseBusiness className="h-7 w-7 text-black/75" />
      </div>

      <p className="text-xl font-bold">
        {canCreateWorkspace
          ? "Create your first workspace"
          : "No workspace access yet"}
      </p>
      <p className="mt-2 max-w-md text-sm leading-6 text-black/65">
        {canCreateWorkspace
          ? "Set up a shared space for cases, members, documents, and workspace-level decisions."
          : "Ask a workspace owner for an invite, or upgrade your account to create one."}
      </p>

      <div className="mt-7 grid w-full max-w-xl gap-2 text-left sm:grid-cols-3">
        <div className="flex items-start gap-2 rounded-lg bg-black/[0.03] p-3">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
          <div>
            <p className="text-xs font-medium">No members yet</p>
            <p className="mt-1 text-xs leading-5 text-black/55">
              Invite collaborators once your workspace is ready.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-black/[0.03] p-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
          <div>
            <p className="text-xs font-medium">No shared cases yet</p>
            <p className="mt-1 text-xs leading-5 text-black/55">
              Cases can be grouped under one operating space.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-black/[0.03] p-3">
          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
          <div>
            <p className="text-xs font-medium">No workspace context</p>
            <p className="mt-1 text-xs leading-5 text-black/55">
              Team notes and decisions will live here.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Button
          text={canCreateWorkspace ? "Create workspace" : "Upgrade to create"}
          icon={canCreateWorkspace ? "plus" : "continue"}
          onClick={onCreateWorkspace}
        />
        <Button
          text="Check invites"
          icon="mail"
          style="secondary"
          onClick={onCheckInvites}
        />
      </div>

      {!canCreateWorkspace && (
        <p className="mt-4 max-w-sm text-xs leading-5 text-black/55">
          Workspace creation is available on Pro and Enterprise plans. You can
          still join a workspace by accepting an invite.
        </p>
      )}
    </div>
  );
};

const Workspace = ({ workspace }: WorkspaceProps) => {
  const { setModal } = useContext(AppModalContext);
  const {
    data: userResult,
    isPending: userPending,
    error: userError,
  } = useCurrentUserQuery();

  if (userPending) {
    return (
      <>
        <div className="w-full h-dvh flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  const user = userResult?.currentUser.user;

  if (userError || !user) {
    return (
      <div className="flex-1 min-w-0 max-w-full flex flex-col gap-4 py-3 h-max border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
        <div className="px-4 py-8 text-sm text-black/70">
          Could not load your workspace access.
        </div>
      </div>
    );
  }

  // Update later to account for account tier and workspace limits
  const canCreateWorkspace =
    user.accountTier === "PRO" || user.accountTier === "ENTERPRISE";

  const openWorkspaceManager = () => {
    if (canCreateWorkspace) {
      setModal("manage workspaces");
      return;
    }

    setModal("manage subscription");
  };

  return (
    <div className="flex-1 min-w-0 max-w-full flex flex-col gap-4 py-3 /px-4 /border /h-[80vh] h-max border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
      <div className="flex flex-row justify-between text-xs px-4 border-b border-black/15 pb-3">
        <div className="flex gap-1.5">
          {canCreateWorkspace && (
            <button
              type="button"
              onClick={openWorkspaceManager}
              className="text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black border border-mist-400/75 hover:border-black/15 transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <div>New Workspace</div>
            </button>
          )}
          <div className="text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <MessageSquare className="w-3.5 h-3.5" />
            <div>Messages</div>
          </div>
          <div className="text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <Mail className="w-3.5 h-3.5" />
            <div>Invites</div>
          </div>
        </div>
        {/* ONLY IF YOU ARE THE WORKSPACE OWNER SHOULD YOU SEE THIS */}
        {workspace && (
          <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <Settings className="w-5 h-5 text-black" />
          </div>
        )}
      </div>
      {/* Workspace Details */}
      {workspace && <ActiveWorkspaceState workspace={workspace} />}
      {/* If no workspace is selected which can only happen if you are not part of any workspace */}
      {!workspace && (
        <EmptyWorkspaceState
          canCreateWorkspace={canCreateWorkspace}
          onCreateWorkspace={openWorkspaceManager}
          onCheckInvites={() => setModal("manage workspaces")}
        />
      )}
    </div>
  );
};

export default Workspace;
