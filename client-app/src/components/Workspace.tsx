// import React from "react";
import {
  PlusIcon,
  Settings,
  MessageSquare,
  Mail,
  UserPlus,
} from "lucide-react";
import UserPanel from "./UserPanel";
import { useCurrentUserQuery } from "#/api/currentUser/hooks";

interface WorkspaceProps {
  // Update later to be an object that includes workspace details like name, description, members, etc.
  workspace: string | null;
}

const Workspace = ({ workspace }: WorkspaceProps) => {
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

  // Update later to account for account tier and workspace limits
  const canCreateWorkspace =
    userResult?.currentUser.user.accountTier === "PRO" ||
    userResult?.currentUser.user.accountTier === "ENTERPRISE";

  return (
    <div className="flex-1 min-w-0 max-w-full flex flex-col gap-4 py-3 /px-4 /border /h-[80vh] h-max border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
      <div className="flex flex-row justify-between text-xs px-4 border-b border-black/15 pb-3">
        <div className="flex gap-1.5">
          {canCreateWorkspace && (
            <div className="text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black border border-mist-400/75 hover:border-black/15 transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
              <PlusIcon className="w-3.5 h-3.5" />
              <div>New Workspace</div>
            </div>
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
      {!workspace && <></>}
    </div>
  );
};

export default Workspace;
