import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useCallback, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SettingsPopup from "#/components/popups/SettingsPopup";
import AppModal from "#/components/AppModal";

// context
import { PopupContext, type PopupId } from "#/context/PopupContext";
import { AppModalContext, type Modal } from "#/context/AppModalContext";

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
  const [modalLocked, setModalLocked] = useState(false);
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

  return (
    <html
      lang="en"
      className="light"
      data-theme="light"
      style={{ colorScheme: "light" }}
    >
      <head>
        <HeadContent />
      </head>
      <QueryClientProvider client={queryClient}>
        <AppModalContext.Provider
          value={{ modal, setModal, modalLocked, setModalLocked }}
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
            <body className="bg-gray-100 font-geist antialiased mx-auto min-h-dvh overflow-y-scroll overflow-x-clip [scrollbar-gutter:stable] text-black text-sm">
              <SettingsPopup />
              <AppModal />
              <div className="min-h-dvh overflow-x-clip">
                {children}
                <TanStackDevtools
                  config={{
                    position: "bottom-right",
                  }}
                  plugins={[
                    {
                      name: "Tanstack Router",
                      render: <TanStackRouterDevtoolsPanel />,
                    },
                  ]}
                />
              </div>
              <Scripts />
            </body>
          </PopupContext.Provider>
        </AppModalContext.Provider>
      </QueryClientProvider>
    </html>
  );
}
