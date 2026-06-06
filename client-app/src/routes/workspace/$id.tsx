import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "#/components/layouts/AppLayout";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import ContentShell from "#/components/layouts/ContentShell";
import UserPanel from "#/components/UserPanel";
import WorkspaceDashboard from "#/components/page_content/WorkspaceDashboard";
import PageLoading from "#/components/PageLoading";
import GetUserError from "#/components/errors/GetUserError";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";

// route guards
import { requireAuth } from "#/lib/auth";

// useQuery
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useWorkspaceQuery } from "#/api/workspace/hooks";

export const Route = createFileRoute("/workspace/$id")({
  beforeLoad: requireAuth,
  component: App,
});

function App() {
  const { id } = Route.useParams();

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
  } = useWorkspaceQuery(id, { enabled: Boolean(user) });

  if (getUserPending || getWorkspacePending) {
    return <PageLoading />;
  }

  if (getUserError || !user || getWorkspaceError || !workspace) {
    return <GetUserError />;
  }

  // return <PageLoading />;

  return (
    <AppLayout>
      <NavigationPanel>
        <UserPanel user={user} settings={true} showTier={true} />
        <SelectCaseMenu
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />
      </NavigationPanel>
      <ContentShell>
        <WorkspaceDashboard workspace={workspace} />
      </ContentShell>
    </AppLayout>
  );
}
