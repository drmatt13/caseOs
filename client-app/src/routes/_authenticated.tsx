import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import AppLayout from "#/components/layouts/AppLayout";
import ContentShell from "#/components/layouts/ContentShell";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import UserPanel from "#/components/layouts/UserPanel";
import PageLoading from "#/components/ui/PageLoading";
import SessionError from "#/components/errors/SessionError";
import {
  AuthenticatedLayoutProvider,
  defaultAuthenticatedLayoutState,
  type AuthenticatedLayoutOptions,
  type AuthenticatedLayoutState,
} from "#/components/layouts/AuthenticatedLayoutContext";
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { requireAuth } from "#/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: requireAuth,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: userResult, isPending, error } = useCurrentUserQuery();
  const user = userResult?.currentUser.user;
  const [layoutState, setLayoutState] = useState<AuthenticatedLayoutState>(
    defaultAuthenticatedLayoutState,
  );

  const setLayoutOptions = useCallback(
    (options: AuthenticatedLayoutOptions) => {
      setLayoutState({
        ...defaultAuthenticatedLayoutState,
        ...options,
        navigationContent: options.navigationContent ?? null,
      });
    },
    [],
  );

  const resetLayoutOptions = useCallback(() => {
    setLayoutState(defaultAuthenticatedLayoutState);
  }, []);

  const contextValue = useMemo(() => {
    if (!user) return null;

    return {
      user,
      setLayoutOptions,
      resetLayoutOptions,
    };
  }, [resetLayoutOptions, setLayoutOptions, user]);

  if (isPending) {
    return <PageLoading />;
  }

  if (error || !user || !contextValue) {
    return <SessionError />;
  }

  return (
    <AuthenticatedLayoutProvider value={contextValue}>
      <AppLayout>
        <NavigationPanel activeItemKey={layoutState.navigationActiveItemKey}>
          <UserPanel user={user} settings={true} showTier={true} />
          {layoutState.navigationContent}
        </NavigationPanel>
        <ContentShell
          showHeaderBar={layoutState.showHeaderBar}
          showWorkspaceSettings={layoutState.showWorkspaceSettings}
        >
          <Outlet />
        </ContentShell>
      </AppLayout>
    </AuthenticatedLayoutProvider>
  );
}
