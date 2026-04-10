import { createFileRoute, Link } from "@tanstack/react-router";
import { requireAuth } from "#/lib/auth";
import AppLayout from "#/components/layouts/AppLayout";
import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";
import WorkspaceMenu from "#/components/menus/WorkspaceMenu";
import UserPanel from "#/components/menus/UserPanel";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/case/$id")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  // router

  return (
    <AppLayout>
      <LeftPanelLayout>
        <UserPanel user={user} />
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
