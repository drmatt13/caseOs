import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useCallback, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SettingsPopup from "#/components/popups/SettingsPopup";
import AppModal from "#/components/AppModal";
import ClearQueriesButton from "#/components/ClearQueriesButton";

// context
import { PopupContext, type PopupId } from "#/context/PopupContext";
import {
  AppModalContext,
  type Modal,
  type ModalGuardState,
} from "#/context/AppModalContext";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "CaseOS",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<Modal>(null);
  const [modalGuardState, setModalGuardState] =
    useState<ModalGuardState>("unlocked");
  const [modalClearKey, setModalClearKey] = useState(0);
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

  const clearModal = useCallback(() => {
    setModal(null);
    setModalGuardState("unlocked");
    setModalClearKey((currentKey) => currentKey + 1);
  }, []);

  return (
    <html
      lang="en"
      className="light"
      data-theme="light"
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <QueryClientProvider client={queryClient}>
        <AppModalContext.Provider
          value={{
            modal,
            setModal,
            modalGuardState,
            setModalGuardState,
            requestCloseModal,
            clearModal,
            modalClearKey,
          }}
        >
          <PopupContext.Provider
            value={{
              activePopup: popupState.activePopup,
              referenceElement: popupState.referenceElement,
              openPopup,
              togglePopup,
              closePopup,
            }}
          >
            <body
              className="bg-gray-100 font-geist antialiased mx-auto min-h-dvh /overflow-y-scroll overflow-x-clip [scrollbar-gutter:stable] text-black text-sm"
              suppressHydrationWarning
            >
              <SettingsPopup />
              <AppModal />
              <div className="min-h-dvh overflow-x-clip">
                {children}
                <ClearQueriesButton />
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
              <Scripts />
            </body>
          </PopupContext.Provider>
        </AppModalContext.Provider>
      </QueryClientProvider>
    </html>
  );
}
