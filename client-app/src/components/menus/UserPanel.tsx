import { useContext, useEffect, useState } from "react";
import { Settings } from "lucide-react";

import { userSchema } from "@repo/database/table.schemas";
import z from "zod";

// context
import { SettingsContext } from "#/context/SettingsContext";

interface UserPanelProps {
  user: z.infer<typeof userSchema>;
  settings?: boolean;
}

const UserPanel = ({ user, settings = false }: UserPanelProps) => {
  const { setShowSettingsModal } = useContext(SettingsContext);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [user?.profilePicture]);

  if (!user) return <>loading...</>;

  return (
    <>
      <div className="mb-1 flex items-center w-full justify-between gap-2 /pl-2 /pr-2">
        <div className="flex gap-2 items-center">
          {user.profilePicture && !imageFailed ? (
            <img
              src={user.profilePicture}
              alt={`${user.firstName} ${user.lastName}`}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/15">
              {user.firstName?.[0] ? user.firstName[0] : ""}
              {user.lastName?.[0] ? user.lastName[0] : ""}
            </div>
          )}
          <p className="text-sm truncate">
            {user.firstName} {user.lastName}
          </p>
        </div>
        {settings && (
          <div
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer"
          >
            <Settings className="w-5 h-5 text-black" />
          </div>
        )}
      </div>
    </>
  );
};

export default UserPanel;
