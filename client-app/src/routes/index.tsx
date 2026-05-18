import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "#/components/layouts/AppLayout";
import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";
import UserPanel from "#/components/UserPanel";
import Workspace from "#/components/Workspace";
import LoadingSpinner from "#/components/LoadingSpinner";

// route guards
import { requireAuth } from "#/lib/auth";

import { useCurrentUserQuery } from "#/api/currentUser/hooks";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  component: App,
});

function App() {
  const [workspaces, setWorkspaces] = useState<string[]>([
    "Workspace 1",
    // "Workspace 2",
    // "Workspace 3",
    // "Workspace 4",
    // "Workspace 5",
  ]);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(
    // "Workspace 1",
    null,
  );
  const [cases, setCases] = useState<
    {
      id: string;
      name: string;
    }[]
  >([
    {
      id: "case-faxon-commons-demo",
      name: "Faxon Commons v. Sweeney",
    },
    {
      id: "9w8ufw98wsd",
      name: "In re: Residential Tenancy Dispute – Unit 71-612-21",
    },
    { id: "98sufs98euf", name: "Smith v. Jones – 2023 LT Case No. 12345" },
  ]);

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
    return <>placeholder for error</>;
  }

  return (
    <AppLayout>
      <LeftPanelLayout>
        <UserPanel user={user} settings={true} showTier={true} />
        {workspaces.length === 0 && (
          <div className="w-full /font-sans">
            <p>No workspaces available</p>
          </div>
        )}
        {workspaces.length > 0 && (
          <>
            <div className="h-6 flex items-center">
              <p className="truncate text-xs">Select Workspace</p>
            </div>
            <div className="text-xs flex gap-1.5 mb-0.5 items-center">
              <select
                className="rounded-lg px-2 py-2.5 /mx-2 text-xs bg-gray-100 border border-black/15"
                name="Workspace"
                id="Workspace"
                value={activeWorkspace ?? ""}
                onChange={(event) =>
                  setActiveWorkspace(event.target.value || null)
                }
              >
                <option value="" disabled>
                  Choose workspace
                </option>
                {workspaces.map((workspace, index) => (
                  <option key={index} value={workspace}>
                    {workspace}
                  </option>
                ))}
              </select>
            </div>
            <SelectCaseMenu cases={cases} />
          </>
        )}
      </LeftPanelLayout>
      <Workspace workspace={activeWorkspace} />
    </AppLayout>
  );
}
