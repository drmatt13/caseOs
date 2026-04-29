import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "#/components/layouts/AppLayout";
import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";
import UserPanel from "#/components/menus/UserPanel";
import Workspace from "#/components/Workspace";
import LoadingSpinner from "#/components/LoadingSpinner";

// route guards
import { requireAuth } from "#/lib/auth";

// query functions
import { getUser } from "#/api/getUser";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  component: App,
});

function App() {
  const {
    data: { user } = {},
    isPending,
    error,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  useEffect(() => {
    console.log("User data:", user);
  }, [user]);

  if (isPending) {
    return (
      <>
        <div className="w-full h-full flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (error) {
    return <>placeholder for error</>;
  }

  return (
    <AppLayout>
      <LeftPanelLayout>
        <UserPanel user={user!} settings={true} />
        <div className="text-xs">
          <p className="truncate">Select Workspace</p>
        </div>
        <div className="text-xs flex gap-1.5 mb-0.5 items-center">
          <select
            className="rounded-lg px-2 py-2.5 /mx-2 text-xs bg-gray-100 border border-black/15"
            name="Workspace"
            id="Workspace"
          >
            <option value="">Workspace 1</option>
            <option value="">Workspace 2</option>
            <option value="">Workspace 3</option>
          </select>
        </div>
        <SelectCaseMenu />
      </LeftPanelLayout>
      <Workspace />
    </AppLayout>
  );
}
