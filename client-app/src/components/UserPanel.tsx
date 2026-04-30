import { useContext, useEffect, useState } from "react";
import { Settings } from "lucide-react";

import { userSchema } from "@repo/database/table.schemas";
import z from "zod";

// context
import { PopupContext } from "#/context/PopupContext";

interface UserPanelProps {
  user: z.infer<typeof userSchema>;
  settings?: boolean;
}

const accountTierLabels = {
  FREE: "Free",
  TRIAL: "Trial",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
} as const;

const UserPanel = ({ user, settings = false }: UserPanelProps) => {
  const { togglePopup } = useContext(PopupContext);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [user?.profilePicture]);

  if (!user) return <>loading...</>;

  return (
    <>
      <div className="mb-1 flex min-w-0 items-center w-full justify-between gap-2 /pl-2 /pr-2">
        <div className="flex min-w-0 flex-1 gap-2 items-center">
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
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-sm truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              Tier: {accountTierLabels[user.accountTier]}
            </p>
          </div>
        </div>
        {settings && (
          <button
            type="button"
            aria-label="Open settings"
            onClick={(e) => {
              togglePopup("settings", e.currentTarget);
            }}
            className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
          >
            <Settings className="w-5 h-5 text-black" />
          </button>
        )}
      </div>
    </>
  );
};

export default UserPanel;
