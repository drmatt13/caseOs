import { createFileRoute, Link } from "@tanstack/react-router";
import { requireAuth } from "#/lib/auth";
import AppLayout from "#/components/layouts/AppLayout";
import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";
import UserPanel from "#/components/menus/UserPanel";
import Workspace from "#/components/Workspace";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  component: App,
});

function App() {
  const { user } = Route.useRouteContext();

  return (
    <AppLayout>
      <LeftPanelLayout>
        <UserPanel user={user} settings={true} />
        <div className="text-xs flex gap-1.5 items-center">
          <p className="truncate">Select Workspace</p>
        </div>
        <div className="text-xs flex gap-1.5 items-center">
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
