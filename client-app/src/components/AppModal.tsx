import { useContext, useState, useEffect } from "react";

// context
import { AppModalContext } from "#/context/AppModalContext";

// modals
import EditUserModal from "./modals/EditUserModal";
import ModifySubscriptionModal from "./modals/ModifySubscriptionModal";
import ManageWorkspacesModal from "./modals/ManageWorkspacesModal";

const SettingsModal = () => {
  const { modal, requestCloseModal } = useContext(AppModalContext);
  const [prevModal, setPrevModal] = useState(modal);
  const [modalOpenKey, setModalOpenKey] = useState(0);
  const visibleModal = modal ?? prevModal;

  const handleBackdropClick = () => {
    requestCloseModal();
  };

  useEffect(() => {
    if (modal) {
      setPrevModal(modal);
      setModalOpenKey((currentKey) => currentKey + 1);
    }
  }, [modal]);

  return (
    <div
      className={`fixed inset-0 z-10 flex items-start justify-center overflow-hidden ${
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
        onClick={handleBackdropClick}
      />

      <div
        className={`top-12 h-max max-h-[calc(100vh-6rem)] /w-lg max-w-full overflow-hidden text-sm relative z-20 border rounded-xl bg-white/90 backdrop-blur-sm border-black/15 shadow-md transition-all ${
          modal
            ? "duration-100 ease-out scale-100 opacity-100 translate-0"
            : "duration-150 ease-in scale-95 opacity-0 translate-y-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL */}
        <div
          key={`${visibleModal ?? "empty"}-${modalOpenKey}`}
          className="max-h-[calc(100vh-6rem)] overflow-x-hidden overflow-y-auto px-4 py-3"
        >
          {visibleModal === "edit user" && <EditUserModal />}
          {visibleModal === "manage subscription" && (
            <ModifySubscriptionModal />
          )}
          {visibleModal === "manage workspaces" && <ManageWorkspacesModal />}
        </div>
        {/* MODAL */}
      </div>
    </div>
  );
};

export default SettingsModal;
