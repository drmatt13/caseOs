// import React from "react";
import {
  PlusIcon,
  Settings,
  MessageSquare,
  Mail,
  UserPlus,
} from "lucide-react";
import UserPanel from "./UserPanel";

import { userSchema } from "@repo/database/table.schemas";
import z from "zod";

const Workspace = () => {
  return (
    <div className="flex-1 min-w-0 max-w-full flex flex-col gap-4 py-3 /px-4 /border /h-[80vh] h-max border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
      <div className="flex flex-row justify-between text-xs px-4 border-b border-black/15 pb-3">
        <div className="flex gap-1.5">
          <div className="text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black border border-mist-400/75 hover:border-black/15 transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <PlusIcon className="w-3.5 h-3.5" />
            <div>New Workspace</div>
          </div>
          <div className="text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <MessageSquare className="w-3.5 h-3.5" />
            <div>Messages</div>
          </div>
          <div className="text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <Mail className="w-3.5 h-3.5" />
            <div>Invites</div>
          </div>
        </div>
        <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
          {/* ONLY IF YOU ARE THE WORKSPACE OWNER SHOULD YOU SEE THIS */}
          <Settings className="w-5 h-5 text-black" />
        </div>
      </div>
      <div className="flex flex-col px-4 /py-1 gap-1.5">
        <p className="text-xl font-bold">Workspace 1</p>
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
              user={
                {
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                } as z.infer<typeof userSchema>
              }
            />
            <div className="h-full bg-black/10 px-2.5 py-1 rounded-lg text-xs group-hover:bg-black/15 transition-colors ease-in duration-150 group-hover:ease-out group-hover:duration-100">
              Owner
            </div>
          </div>
          <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <UserPanel
              user={
                {
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                } as z.infer<typeof userSchema>
              }
            />
          </div>
          <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <UserPanel
              user={
                {
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                } as z.infer<typeof userSchema>
              }
            />
          </div>
          <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <UserPanel
              user={
                {
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                } as z.infer<typeof userSchema>
              }
            />
          </div>
          <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10 rounded-xl group transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <UserPanel
              user={
                {
                  displayName: "caseos-user",
                  firstName: "Jane",
                  lastName: "Doe",
                } as z.infer<typeof userSchema>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
