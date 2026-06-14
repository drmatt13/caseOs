import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "#/components/layouts/AppLayout";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import ContentShell from "#/components/layouts/ContentShell";
import UserPanel from "#/components/layouts/UserPanel";
import PageLoading from "#/components/ui/PageLoading";
import GetUserError from "#/components/errors/GetUserError";
import SelectWorkspaceMenu from "#/components/menus/SelectWorkspaceMenu";
import WorkspaceOverview from "#/components/page_content/WorkspaceOverview";

// route guards
import { requireAuth } from "#/lib/auth";

// useQuery
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useWorkspacesQuery } from "#/api/workspace/hooks";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  component: App,
});

function App() {
  const {
    data: getUserResult,
    isPending: getUserPending,
    error: getUserError,
  } = useCurrentUserQuery();
  const user = getUserResult?.currentUser.user;
  const {
    data: workspaces = [],
    isPending: getWorkspacesPending,
    error: getWorkspacesError,
  } = useWorkspacesQuery({ enabled: Boolean(user) });

  // return <PageLoading />;

  // UPDATE if user or workspace data is missing or errors out
  if (getUserPending || getWorkspacesPending) {
    return <PageLoading />;
  }

  if (getUserError || !user || getWorkspacesError) {
    return <GetUserError />;
  }

  // return <PageLoading />;

  return (
    <AppLayout>
      <NavigationPanel>
        <UserPanel user={user} settings={true} showTier={true} />
        <SelectWorkspaceMenu
          accountTier={user.accountTier}
          workspaces={workspaces}
        />
      </NavigationPanel>
      <ContentShell>
        <WorkspaceOverview
          accountTier={user.accountTier}
          workspaces={workspaces}
        />
      </ContentShell>
    </AppLayout>
  );
}
