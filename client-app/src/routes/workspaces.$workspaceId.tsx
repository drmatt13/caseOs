import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "#/components/layouts/AppLayout";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import ContentShell from "#/components/layouts/ContentShell";
import UserPanel from "#/components/layouts/UserPanel";
import WorkspaceDashboard from "#/components/page_content/WorkspaceDashboard";
import PageLoading from "#/components/ui/PageLoading";
import SessionError from "#/components/errors/SessionError";
import PageError from "#/components/errors/PageError";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";

// route guards
import { requireAuth } from "#/lib/auth";
import { resolveCapabilities } from "#/lib/permissions";
import { isNotFoundError } from "#/lib/errors";

// useQuery
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useWorkspaceQuery } from "#/api/workspace/hooks";

export const Route = createFileRoute("/workspaces/$workspaceId")({
  beforeLoad: requireAuth,
  component: App,
});

function App() {
  const { workspaceId } = Route.useParams();

  // Get the current user
  const {
    data: getUserResult,
    isPending: getUserPending,
    error: getUserError,
  } = useCurrentUserQuery();
  const user = getUserResult?.currentUser.user;

  // Get the workspace from the workspaceId param
  const {
    data: workspace,
    isPending: getWorkspacePending,
    error: getWorkspaceError,
    refetch: refetchWorkspace,
  } = useWorkspaceQuery(workspaceId, {
    enabled: Boolean(user), // only fetch workspace if user is available
  });

  if (getUserPending || getWorkspacePending) {
    return <PageLoading />;
  }

  // Session failure → may log out.
  if (getUserError || !user) {
    return <SessionError />;
  }

  // Workspace doesn't exist / no access → not-found page, never log out.
  if (isNotFoundError(getWorkspaceError)) {
    return (
      <PageError
        title="Workspace not found"
        message="This workspace doesn't exist or you no longer have access."
        actionLabel="Go home"
        actionTo="/"
      />
    );
  }

  // Workspace failed to load → recoverable, never log out.
  if (getWorkspaceError) {
    return (
      <PageError
        title="Couldn't load this workspace"
        message="Something went wrong loading this workspace. Please try again."
        onRetry={() => void refetchWorkspace()}
        actionLabel="Go home"
        actionTo="/"
      />
    );
  }

  // No error but no data (defensive — the query throws NotFoundError instead).
  if (!workspace) {
    return (
      <PageError
        title="Workspace not found"
        message="This workspace doesn't exist or you no longer have access."
        actionLabel="Go home"
        actionTo="/"
      />
    );
  }

  // Resolve the capabilities for the current user in this workspace
  const userCapabilities = resolveCapabilities(
    workspace.currentUserMembership.role,
  );

  return (
    <AppLayout>
      <NavigationPanel>
        <UserPanel user={user} settings={true} showTier={true} />
        <SelectCaseMenu
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          canCreateCase={userCapabilities.createCase}
        />
      </NavigationPanel>
      <ContentShell showWorkspaceSettings={userCapabilities.manageWorkspace}>
        <WorkspaceDashboard
          workspace={workspace}
          userCapabilities={userCapabilities}
        />
      </ContentShell>
    </AppLayout>
  );
}
