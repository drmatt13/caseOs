import { useContext } from "react";
import type { User } from "#/schemas/user";
import { Settings } from "lucide-react";
// import ThemeToggle from "../ThemeToggle";

// context
import { SettingsContext } from "#/context/SettingsContext";

interface UserPanelProps {
  user: User;
  settings?: boolean;
}

const UserPanel = ({ user, settings = false }: UserPanelProps) => {
  const { setShowSettingsModal } = useContext(SettingsContext);

  return (
    <>
      <div className="mb-1 flex items-center w-full justify-between gap-2 /pl-2 /pr-2">
        <div className="flex gap-2 items-center">
          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-black/15">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
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
