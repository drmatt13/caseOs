import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { useContext, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import Button from "../Button";
import logout from "#/lib/logout";
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { BriefcaseBusiness, CreditCard, UserPen, XIcon } from "lucide-react";

// context
import { PopupContext } from "#/context/PopupContext";
import { AppModalContext, type Modal } from "#/context/AppModalContext";

const SettingsPopup = () => {
  const navigate = useNavigate();
  const { setModal } = useContext(AppModalContext);
  const { activePopup, referenceElement, closePopup } =
    useContext(PopupContext);
  const isOpen = activePopup === "settings";
  const {
    data: userResult,
    isPending: userPending,
    error: userError,
  } = useCurrentUserQuery({ enabled: isOpen });
  const user = userResult?.currentUser.user;
  const manageWorkspacesDisabled =
    userPending || !!userError || user?.accountTier === "FREE";
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) {
        closePopup();
      }
    },
    placement: "right-start",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    refs.setReference(referenceElement);
  }, [refs, referenceElement]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.addEventListener("resize", closePopup);

    return () => {
      window.removeEventListener("resize", closePopup);
    };
  }, [isOpen, closePopup]);

  const handleLogout = useCallback(async () => {
    await logout();
    closePopup();
    await navigate({
      to: "/login",
      replace: true,
      search: { email: undefined, "account-verified": undefined },
    });
  }, [navigate, closePopup]);

  const toggleModal = useCallback(
    (modalName: Exclude<Modal, null>) => {
      setModal(modalName);
      closePopup();
    },
    [setModal, closePopup],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="relative text-sm pr-3 pl-3 pt-8 pb-3 z-50 flex flex-col gap-1.5 rounded-2xl border border-black/15 bg-white/80 shadow-md backdrop-blur-sm"
        {...getFloatingProps()}
      >
        <button
          type="button"
          aria-label="Close settings"
          onClick={closePopup}
          className="absolute top-0 left-0 p-1 my-1 ml-0.5 cursor-pointer"
        >
          <XIcon className="w-4 h-4" />
        </button>

        <div
          onClick={() => toggleModal("edit user")}
          className="pr-4 flex text-sm p-2 rounded-lg hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
        >
          <UserPen className="w-4 h-4 mr-2" />
          <p className="truncate">Edit User</p>
        </div>

        <div
          onClick={() => toggleModal("manage subscription")}
          className="pr-4 flex text-sm p-2 rounded-lg hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          <p className="truncate">Modify Subscription</p>
        </div>

        <div
          onClick={() => {
            if (manageWorkspacesDisabled) return;

            toggleModal("manage workspaces");
          }}
          className={`pr-4 flex text-sm p-2 rounded-lg transition-colors ease-in duration-150 hover:ease-out hover:duration-100 ${
            manageWorkspacesDisabled
              ? "cursor-not-allowed text-gray-400"
              : "hover:bg-black/10 cursor-pointer"
          }`}
        >
          <BriefcaseBusiness className="w-4 h-4 mr-2" />
          <p className="truncate">Manage Workspaces</p>
        </div>

        <Button
          text="Logout"
          style="primary"
          onClick={() => {
            void handleLogout();
          }}
        />
      </div>
    </FloatingPortal>
  );
};

export default SettingsPopup;
