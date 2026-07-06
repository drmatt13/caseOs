import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useCallback, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import SettingsPopup from "#/components/popups/SettingsPopup";
import AppModal from "#/components/modals/AppModal";
import { appQueryClient } from "#/lib/queryClient";

// context
import { PopupContext, type PopupId } from "#/context/PopupContext";
import {
  AppModalContext,
  type Modal,
  type ModalGuardState,
} from "#/context/AppModalContext";
import { MenuContext } from "#/context/MenuContext";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [modal, setModal] = useState<Modal>(null);
  const [modalWorkspaceId, setModalWorkspaceId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalGuardState, setModalGuardState] =
    useState<ModalGuardState>("unlocked");
  const [popupState, setPopupState] = useState<{
    activePopup: PopupId | null;
    referenceElement: HTMLElement | null;
  }>({
    activePopup: null,
    referenceElement: null,
  });

  const openPopup = useCallback((popupId: PopupId, element: HTMLElement) => {
    setPopupState({
      activePopup: popupId,
      referenceElement: element,
    });
  }, []);

  const closePopup = useCallback(() => {
    setPopupState({
      activePopup: null,
      referenceElement: null,
    });
  }, []);

  const togglePopup = useCallback((popupId: PopupId, element: HTMLElement) => {
    setPopupState((currentState) => {
      const shouldClose =
        currentState.activePopup === popupId &&
        currentState.referenceElement === element;

      if (shouldClose) {
        return {
          activePopup: null,
          referenceElement: null,
        };
      }

      return {
        activePopup: popupId,
        referenceElement: element,
      };
    });
  }, []);

  const requestCloseModal = useCallback(() => {
    if (modalGuardState === "locked") return false;

    if (modalGuardState === "state-modified") {
      const shouldClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close this modal?",
      );

      if (!shouldClose) return false;
    }

    setModal(null);
    setModalGuardState("unlocked");
    return true;
  }, [modalGuardState]);

  return (
    <QueryClientProvider client={appQueryClient}>
      <AppModalContext.Provider
        value={{
          modal,
          setModal,
          modalWorkspaceId,
          setModalWorkspaceId,
          modalGuardState,
          setModalGuardState,
          requestCloseModal,
        }}
      >
        <MenuContext.Provider value={{ menuOpen, setMenuOpen }}>
          <PopupContext.Provider
            value={{
              activePopup: popupState.activePopup,
              referenceElement: popupState.referenceElement,
              openPopup,
              togglePopup,
              closePopup,
            }}
          >
            <SettingsPopup />
            <AppModal />
            <div className="min-h-dvh overflow-x-clip">
              <Outlet />
              {/* <TanStackDevtools
                  config={{
                    position: "bottom-right",
                  }}
                  plugins={[
                    {
                      name: "Tanstack Router",
                      render: <TanStackRouterDevtoolsPanel />,
                    },
                  ]}
                /> */}
            </div>
          </PopupContext.Provider>
        </MenuContext.Provider>
      </AppModalContext.Provider>
    </QueryClientProvider>
  );
}
