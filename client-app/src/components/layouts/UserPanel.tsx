import { useContext, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import type { AccountTier } from "#/api/generated/graphql";

// context
import { PopupContext } from "#/context/PopupContext";

const accountTierLabels = {
  FREE: "Free",
  TRIAL: "Trial",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
} satisfies Record<AccountTier, string>;

export type UserPanelUser = {
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
  accountTier?: AccountTier | null;
};

interface UserPanelProps {
  user: UserPanelUser;
  settings?: boolean;
  showTier?: boolean;
  insetBottom?: boolean;
}

const UserPanel = ({
  user,
  settings = false,
  showTier = false,
  insetBottom = true,
}: UserPanelProps) => {
  const { togglePopup } = useContext(PopupContext);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [user?.profilePicture]);

  if (!user) return <>loading...</>;

  return (
    <>
      <div
        className={`${insetBottom ? "mb-1" : ""} flex min-w-0 items-center w-full justify-between gap-2`}
      >
        <div className="flex min-w-0 flex-1 gap-2 items-center">
          {user.profilePicture && !imageFailed ? (
            <img
              src={user.profilePicture}
              alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="h-10 w-10 shrink-0 rounded-full object-cover ring ring-black/30"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/20">
              {user.firstName?.[0] ? user.firstName[0] : ""}
              {user.lastName?.[0] ? user.lastName[0] : ""}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-md truncate">
              {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()}
            </p>
            {showTier && (
              <p className="text-sm text-gray-500 truncate">
                Tier:{" "}
                {user.accountTier
                  ? accountTierLabels[user.accountTier]
                  : "Unknown"}
              </p>
            )}
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
