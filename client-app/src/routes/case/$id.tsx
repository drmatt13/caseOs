import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "#/components/layouts/AppLayout";
// import SelectCaseMenu from "#/components/menus/SelectCaseMenu";
import WorkspaceMenu from "#/components/menus/WorkspaceMenu";

import { ArrowLeft } from "lucide-react";

import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
import UserPanel from "#/components/menus/UserPanel";
import LoadingSpinner from "#/components/LoadingSpinner";

// route guards
import { requireAuth } from "#/lib/auth";

// query functions
import { getUser } from "#/api/getUser";

export const Route = createFileRoute("/case/$id")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  // const { id } = Route.useParams();

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
        <div className="text-xs flex gap-1.5 items-center">
          <Link to="/">
            <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer">
              <ArrowLeft className="w-3 h-3" />
            </div>
          </Link>

          <p className="truncate">
            Sweeney et al. v. Corcoran Management Co., Inc.
          </p>
        </div>
        <input
          className="rounded-lg px-2 py-2.5 /mx-2 text-xs bg-black/5 text-black/60 border border-gray-200"
          placeholder="Search"
        />
        <WorkspaceMenu />
      </LeftPanelLayout>
    </AppLayout>
  );
}
