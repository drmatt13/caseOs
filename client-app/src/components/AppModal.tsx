import { useContext, useState, useEffect } from "react";

// context
import { AppModalContext } from "#/context/AppModalContext";

// modals
import EditUserModal from "./modals/EditUserModal";
import ModifySubscription from "./modals/ModifySubscription";
import ManageWorkspaces from "./modals/ManageWorkspaces";

const SettingsModal = () => {
  const { modal, setModal } = useContext(AppModalContext);
  const [prevmodal, setPrevModal] = useState(modal);
  const visibleModal = modal ?? prevmodal;

  useEffect(() => {
    if (modal) setPrevModal(modal);
  }, [modal]);

  return (
    <div
      className={`absolute inset-0 z-10 flex items-start justify-center overflow-hidden ${
        modal ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* blur layer */}
      <div
        className={`absolute inset-0 transition-[backdrop-filter] ${
          modal
            ? "duration-200 ease-out backdrop-blur-xs"
            : "duration-300 ease-in backdrop-blur-0"
        }`}
      />

      {/* tint layer */}
      <div
        className={`absolute inset-0 bg-black/10 transition-opacity ${
          modal
            ? "duration-200 ease-out opacity-100"
            : "duration-300 ease-in opacity-0"
        }`}
        onClick={() => setModal(null)}
      />

      <div
        className={`top-24 h-max w-lg max-w-full text-sm relative z-20 px-4 py-3 border rounded-xl bg-white/90 backdrop-blur-sm border-black/15 shadow-md transition-all p-2 flex flex-col gap-2 items-start ${
          modal
            ? "duration-100 ease-out scale-100 opacity-100 translate-0"
            : "duration-150 ease-in scale-95 opacity-0 translate-y-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL */}
        <div>
          {visibleModal === "edit user" && <EditUserModal />}
          {visibleModal === "manage subscription" && <ModifySubscription />}
          {visibleModal === "manage workspaces" && <ManageWorkspaces />}
        </div>
        {/* MODAL */}
      </div>
    </div>
  );
};

export default SettingsModal;
