import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "#/components/layouts/AppLayout";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import ContentShell from "#/components/layouts/ContentShell";
import UserPanel from "#/components/UserPanel";
import WorkspaceDashboard from "#/components/page_content/WorkspaceDashboard";
import LoadingSpinner from "#/components/LoadingSpinner";
import GetUserError from "#/components/errors/GetUserError";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";

// route guards
import { requireAuth } from "#/lib/auth";

// useQuery
import { useCurrentUserQuery } from "#/api/currentUser/hooks";

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

  if (getUserPending) {
    return (
      <>
        <div className="w-full h-dvh flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (getUserError || !user) {
    return <GetUserError />;
  }

  // Update later to account for account tier and workspace limits
  const canCreateWorkspace =
    user.accountTier === "PRO" || user.accountTier === "ENTERPRISE";

  // useGetWorkspaceQuery would go here to fetch workspaces for the user and set them in state
  // For example:
  // const { data: getWorkspaceResult, isPending: getWorkspacePending, error: getWorkspaceError } = useGetWorkspacesQuery();

  // if (getWorkspacePending) {
  //   return (
  //     <>
  //       <div className="w-full h-52 flex justify-center items-center">
  //         <LoadingSpinner />
  //       </div>
  //     </>
  //   );
  // }

  // return (
  //   <>
  //     <div className="w-full h-40 flex justify-center items-center">
  //       <LoadingSpinner />
  //     </div>
  //   </>
  // );

  return (
    <AppLayout>
      <NavigationPanel>
        <UserPanel user={user} settings={true} showTier={true} />
        <SelectCaseMenu workspace="Workspace 1" />
      </NavigationPanel>
      <ContentShell>
        <WorkspaceDashboard workspaceId={id} />
      </ContentShell>
    </AppLayout>
  );
}
