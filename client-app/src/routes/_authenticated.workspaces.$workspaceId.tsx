import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import WorkspaceDashboard from "#/components/page_content/WorkspaceDashboard";
import PageError from "#/components/errors/PageError";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";
import PageContentLoading from "#/components/ui/PageContentLoading";
import { useAuthenticatedLayoutEffect } from "#/components/layouts/AuthenticatedLayoutContext";

import { resolveCapabilities } from "#/lib/permissions";
import { isNotFoundError } from "#/lib/errors";

// useQuery
import { useWorkspaceQuery } from "#/api/workspace/hooks";

export const Route = createFileRoute("/_authenticated/workspaces/$workspaceId")({
  component: App,
});

function App() {
  const { workspaceId } = Route.useParams();

  // Get the workspace from the workspaceId param
  const {
    data: workspace,
    isPending: getWorkspacePending,
    error: getWorkspaceError,
    refetch: refetchWorkspace,
  } = useWorkspaceQuery(workspaceId);

  const userCapabilities = useMemo(
    () =>
      workspace
        ? resolveCapabilities(workspace.currentUserMembership.role)
        : null,
    [workspace],
  );

  useAuthenticatedLayoutEffect(
    () => ({
      navigationContent:
        workspace && userCapabilities ? (
          <SelectCaseMenu
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            canCreateCase={userCapabilities.createCase}
          />
        ) : null,
      navigationLoading: getWorkspacePending,
      showWorkspaceSettings: userCapabilities?.manageWorkspace ?? false,
    }),
    // getWorkspacePending must be a dep: on a query error, pending flips false
    // with workspace still undefined — without it the effect wouldn't re-fire
    // and the nav skeleton would be stuck on.
    [
      workspace,
      getWorkspacePending,
      userCapabilities?.createCase,
      userCapabilities?.manageWorkspace,
    ],
  );

  if (getWorkspacePending) {
    return <PageContentLoading />;
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

  if (!userCapabilities) {
    return null;
  }

  return (
    <WorkspaceDashboard
      workspace={workspace}
      userCapabilities={userCapabilities}
    />
  );
}
