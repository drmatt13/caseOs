import { useContext } from "react";
import { useNavigate } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";
import logout from "#/lib/logout";

// context
import { SettingsContext } from "#/context/SettingsContext";

const SettingsModal = () => {
  const navigate = useNavigate();
  const { showSettingsModal, setShowSettingsModal } =
    useContext(SettingsContext);

  const handleLogout = async () => {
    logout();
    setShowSettingsModal(false);
    await navigate({
      to: "/login",
      replace: true,
      search: { email: undefined, "account-verified": undefined },
    });
  };

  return (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden ${
        showSettingsModal ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* blur layer */}
      <div
        className={`absolute inset-0 transition-[backdrop-filter] ${
          showSettingsModal
            ? "duration-200 ease-out backdrop-blur-xs"
            : "duration-300 ease-in backdrop-blur-0"
        }`}
      />

      {/* tint layer */}
      <div
        className={`absolute inset-0 bg-black/10 transition-opacity ${
          showSettingsModal
            ? "duration-200 ease-out opacity-100"
            : "duration-300 ease-in opacity-0"
        }`}
        onClick={() => setShowSettingsModal(false)}
      />

      {/* modal */}
      <div
        className={`relative z-20 h-2/3 w-2xl rounded-2xl bg-white transition-all border border-black/15 shadow-md p-2 flex flex-col gap-2 items-start ${
          showSettingsModal
            ? "duration-100 ease-out scale-100 opacity-100 translate-0"
            : "duration-150 ease-in scale-95 opacity-0 translate-y-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p>Settings Modal:</p>
        <ThemeToggle />
        <p>Account Settings</p>
        <p>Manage Orgs</p>
        <button
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
          onClick={() => {
            void handleLogout();
          }}
          type="button"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
