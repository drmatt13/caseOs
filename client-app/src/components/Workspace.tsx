import { useContext } from "react";
import {
  ArrowRight,
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
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { AppModalContext } from "#/context/AppModalContext";

interface WorkspaceProps {
  // Update later to be an object that includes workspace details like name, description, members, etc.
  workspace: string | null;
}

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
      {workspace && (
        <div className="flex flex-col px-4 /py-1 gap-1.5">
          <p className="text-xl font-bold">{workspace}</p>
          <p className="mb-1.5">
            This workspace is dedicated to managing residential tenancy disputes
            and housing-related legal matters. Members can collaborate on case
            files, share documents, and communicate about ongoing proceedings.
          </p>
          <div className="mt-2 pb-1 flex justify-between">
            <p className="text-md font-medium text-black/75">Members (6)</p>
            <div className="text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black border border-black/15 transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
              <UserPlus className="w-3.5 h-3.5" />
              <div>Onboard Members</div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
              <UserPanel
                user={{
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                }}
              />
              <div className="h-full bg-black/10 px-2.5 py-1 rounded-lg text-xs group-hover:bg-black/15 transition-colors ease-in duration-150 group-hover:ease-out group-hover:duration-100">
                Owner
              </div>
            </div>
            <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
              <UserPanel
                user={{
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                }}
              />
            </div>
            <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
              <UserPanel
                user={{
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                }}
              />
            </div>
            <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
              <UserPanel
                user={{
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                }}
              />
            </div>
            <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
              <UserPanel
                user={{
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* If no workspace is selected which can only happen if you are not part of any workspace */}
      {!workspace && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pt-6 pb-2 text-center">
          <div className="rounded-full aspect-square p-4 flex justify-center items-center mb-4 bg-black/10">
            <BriefcaseBusiness className="h-7 w-7 text-black" />
          </div>

          <p className="text-xl font-bold">Start with a workspace</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-black/65">
            Workspaces keep members, cases, documents, and shared context in one
            place. Create one for your practice, clinic, team, or matter group.
          </p>

          <div className="mt-7 grid w-full max-w-xl gap-2 text-left sm:grid-cols-3">
            <div className="flex items-start gap-2 rounded-lg bg-black/[0.04] p-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
              <div>
                <p className="text-xs font-medium">Invite members</p>
                <p className="mt-1 text-xs leading-5 text-black/55">
                  Bring collaborators into the same case environment.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-black/[0.04] p-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
              <div>
                <p className="text-xs font-medium">Organize cases</p>
                <p className="mt-1 text-xs leading-5 text-black/55">
                  Group active matters under a shared operating space.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-black/[0.04] p-3">
              <Scale className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
              <div>
                <p className="text-xs font-medium">Preserve context</p>
                <p className="mt-1 text-xs leading-5 text-black/55">
                  Keep legal notes and decisions visible to the team.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={openWorkspaceManager}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-transparent bg-[#282828] px-4 py-2 text-xs text-white transition-colors ease-in hover:bg-black hover:duration-100 hover:ease-out"
            >
              {canCreateWorkspace ? (
                <>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Create workspace
                </>
              ) : (
                <>
                  <ArrowRight className="h-3.5 w-3.5" />
                  Upgrade to create
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setModal("manage workspaces")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-black/15 bg-white/50 px-4 py-2 text-xs text-black transition-colors ease-in hover:bg-black/10 hover:duration-100 hover:ease-out"
            >
              <Mail className="h-3.5 w-3.5" />
              Check invites
            </button>
          </div>

          {!canCreateWorkspace && (
            <p className="mt-4 max-w-sm text-xs leading-5 text-black/55">
              Workspace creation is available on Pro and Enterprise plans. You
              can still join a workspace by accepting an invite.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Workspace;
