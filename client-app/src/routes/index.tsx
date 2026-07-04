import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "#/components/layouts/AppLayout";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import ContentShell from "#/components/layouts/ContentShell";
import UserPanel from "#/components/layouts/UserPanel";
import PageLoading from "#/components/ui/PageLoading";
import SessionError from "#/components/errors/SessionError";
import PageError from "#/components/errors/PageError";
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
  // Get the current user
  const {
    data: getUserResult,
    isPending: getUserPending,
    error: getUserError,
  } = useCurrentUserQuery();
  const user = getUserResult?.currentUser.user;

  // Get the workspaces for the current user
  const {
    data: workspaces = [],
    isPending: getWorkspacesPending,
    error: getWorkspacesError,
    refetch: refetchWorkspaces,
  } = useWorkspacesQuery({
    enabled: Boolean(user), // only fetch workspaces if user is available
  });

  // If the user or workspaces are still loading, show a loading state
  if (getUserPending || getWorkspacesPending) {
    return <PageLoading />;
  }

  // If there was an error fetching the user, show a session error and log them out
  if (getUserError || !user) {
    return <SessionError />;
  }

  // If there was an error fetching the workspaces, show a page error with a retry button
  if (getWorkspacesError) {
    return (
      <PageError
        title="Couldn't load your workspaces"
        message="Something went wrong loading your workspaces. Please try again."
        onRetry={() => void refetchWorkspaces()}
      />
    );
  }

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
