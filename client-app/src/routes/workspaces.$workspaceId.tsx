import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "#/components/layouts/AppLayout";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import ContentShell from "#/components/layouts/ContentShell";
import UserPanel from "#/components/layouts/UserPanel";
import WorkspaceDashboard from "#/components/page_content/WorkspaceDashboard";
import PageLoading from "#/components/ui/PageLoading";
import GetUserError from "#/components/errors/GetUserError";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";

// route guards
import { requireAuth } from "#/lib/auth";
import { can } from "#/lib/permissions";

// useQuery
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useWorkspaceQuery } from "#/api/workspace/hooks";

export const Route = createFileRoute("/workspaces/$workspaceId")({
  beforeLoad: requireAuth,
  component: App,
});

function App() {
  const { workspaceId } = Route.useParams();

  const {
    data: getUserResult,
    isPending: getUserPending,
    error: getUserError,
  } = useCurrentUserQuery();
  const user = getUserResult?.currentUser.user;
  const {
    data: workspace,
    isPending: getWorkspacePending,
    error: getWorkspaceError,
  } = useWorkspaceQuery(workspaceId, { enabled: Boolean(user) });

  if (getUserPending || getWorkspacePending) {
    return <PageLoading />;
  }

  if (getUserError || !user || getWorkspaceError || !workspace) {
    return <GetUserError />;
  }

  const role = workspace.currentUserMembership?.role;
  const canManageWorkspace = can(role, "manageWorkspace");
  const canCreateCase = can(role, "createCase");

  // return <PageLoading />;

  return (
    <AppLayout>
      <NavigationPanel>
        <UserPanel user={user} settings={true} showTier={true} />
        <SelectCaseMenu
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          canCreateCase={canCreateCase}
        />
      </NavigationPanel>
      <ContentShell showWorkspaceSettings={canManageWorkspace}>
        <WorkspaceDashboard workspace={workspace} />
      </ContentShell>
    </AppLayout>
  );
}
