import React from "react";
import { PlusIcon, Settings, MessageSquare, Mail } from "lucide-react";
import UserPanel from "./menus/UserPanel";

import Button from "./Button";

const Workspace = () => {
  return (
    <div className="flex-1 min-w-0 max-w-full flex flex-col gap-4 py-3 /px-4 /border /h-[80vh] h-max bg-white rounded-2xl border border-black/15 shadow-md">
      <div className="flex flex-row justify-between text-xs px-4 border-b border-black/15 pb-3">
        <div className="flex gap-1.5">
          <div className="text-xs p-2 rounded-lg hover:bg-mist-300/60 cursor-pointer flex items-center gap-1.5 text-black border border-black/15">
            <PlusIcon className="w-3.5 h-3.5" />
            <div>New Workspace</div>
          </div>
          <div className="text-xs p-2 rounded-lg hover:bg-mist-300/60 cursor-pointer flex items-center gap-1.5 text-black">
            <MessageSquare className="w-3.5 h-3.5" />
            <div>Messages</div>
          </div>
          <div className="text-xs p-2 rounded-lg hover:bg-mist-300/60 cursor-pointer flex items-center gap-1.5 text-black">
            <Mail className="w-3.5 h-3.5" />
            <div>Invites</div>
          </div>
        </div>
        <div className="p-1.5 hover:bg-mist-300/60 rounded-lg cursor-pointer">
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
        <p className="text-md font-medium text-black/70 pb-1">
          Workspace Owner
        </p>
        <div className="pl-2">
          <UserPanel
            user={{
              firstName: "John",
              lastName: "Doe",
              id: "1",
              userName: "johndoe",
              email: "john.doe@example.com",
            }}
          />
        </div>
        <div className="mt-2.5 pb-1 flex justify-between">
          <p className="text-md font-medium text-black/70">Members (6)</p>
          <div className="text-xs p-2 rounded-lg hover:bg-mist-300/60 cursor-pointer flex items-center gap-1.5 text-black border border-black/15">
            <PlusIcon className="w-3.5 h-3.5" />
            <div>Onboard Members</div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-mist-300/60 rounded-xl">
            <UserPanel
              user={{
                firstName: "John",
                lastName: "Doe",
                id: "1",
                userName: "johndoe",
                email: "john.doe@example.com",
              }}
            />
            <div className="h-full bg-black/10 px-2.5 py-1 rounded-lg text-xs">
              Owner
            </div>
          </div>
          <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-mist-300/60 rounded-xl">
            <UserPanel
              user={{
                firstName: "John",
                lastName: "Doe",
                id: "1",
                userName: "johndoe",
                email: "john.doe@example.com",
              }}
            />
          </div>
          <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-mist-300/60 rounded-xl">
            <UserPanel
              user={{
                firstName: "John",
                lastName: "Doe",
                id: "1",
                userName: "johndoe",
                email: "john.doe@example.com",
              }}
            />
          </div>
          <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-mist-300/60 rounded-xl">
            <UserPanel
              user={{
                firstName: "John",
                lastName: "Doe",
                id: "1",
                userName: "johndoe",
                email: "john.doe@example.com",
              }}
            />
          </div>
          <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-mist-300/60 rounded-xl">
            <UserPanel
              user={{
                firstName: "John",
                lastName: "Doe",
                id: "1",
                userName: "johndoe",
                email: "john.doe@example.com",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
