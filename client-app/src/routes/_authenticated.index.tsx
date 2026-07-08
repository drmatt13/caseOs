import { createFileRoute } from "@tanstack/react-router";
import PageError from "#/components/errors/PageError";
import SelectWorkspaceMenu from "#/components/menus/SelectWorkspaceMenu";
import WorkspaceOverview from "#/components/page_content/WorkspaceOverview";
import PageContentLoading from "#/components/ui/PageContentLoading";
import {
  useAuthenticatedLayout,
  useAuthenticatedLayoutEffect,
} from "#/components/layouts/AuthenticatedLayoutContext";

// useQuery
import { useWorkspacesQuery } from "#/api/workspace/hooks";

export const Route = createFileRoute("/_authenticated/")({
  component: App,
});

function App() {
  const { user } = useAuthenticatedLayout();

  // Get the workspaces for the current user
  const {
    data: workspaces = [],
    isPending: getWorkspacesPending,
    error: getWorkspacesError,
    refetch: refetchWorkspaces,
  } = useWorkspacesQuery();

  useAuthenticatedLayoutEffect(
    () => ({
      navigationContent:
        getWorkspacesPending || getWorkspacesError ? null : (
          <SelectWorkspaceMenu
            accountTier={user.accountTier}
            workspaces={workspaces}
          />
        ),
      navigationLoading: getWorkspacesPending,
    }),
    [
      getWorkspacesPending,
      Boolean(getWorkspacesError),
      user.accountTier,
      workspaces,
    ],
  );

  // If the workspaces are still loading, show a loading state inside the shell.
  if (getWorkspacesPending) {
    return <PageContentLoading />;
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
    <WorkspaceOverview accountTier={user.accountTier} workspaces={workspaces} />
  );
}
