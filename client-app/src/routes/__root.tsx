import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SettingsModal from "#/components/SettingsModal";

// context
import { SettingsContext } from "#/context/SettingsContext";

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
        <SettingsContext.Provider
          value={{ showSettingsModal, setShowSettingsModal }}
        >
          <body className="bg-gray-100 font-geist antialiased mx-auto h-dvh text-black text-sm /overflow-y-scroll">
            <SettingsModal />
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
            <Scripts />
          </body>
        </SettingsContext.Provider>
      </QueryClientProvider>
    </html>
  );
}
