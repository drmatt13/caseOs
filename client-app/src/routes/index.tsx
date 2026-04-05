import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  Settings,
  Bot,
  Clock,
  Target,
  SquareCheckBig,
  Folder,
  FileText,
  PlusIcon,
} from "lucide-react";

import TempLogin from "#/components/TempLogin";
import SelectCaseMenu from "#/components/SelectCaseMenu";
import CreateCaseMenu from "#/components/CreateCaseMenu";
import CaseWorkspace from "#/components/WorkspaceMenu";
import { verifyBearerCookie } from "#/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Perform any necessary checks or data fetching here
    const { user } = await verifyBearerCookie();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: App,
});

function App() {
  const { user } = Route.useRouteContext();

  // const [workSpace, setWorkSpace] = useState<
  //   | "Agent Config"
  //   | "Case Summary"
  //   | "Timeline"
  //   | "Objectives"
  //   | "Tasks"
  //   | "Documents"
  // >("Agent Config");
  // const [user, setUser] = useState<{ //   name: string; //   email: string; // } | null>(null); const [orgs, setOrgs] = useState<{ useOrg: boolean; selectedOrg?: string; orgs: string[];
  // }>({
  //   useOrg: false,
  //   selectedOrg: undefined,
  //   orgs: [],
  // });

  const [caseState, setCaseState] = useState<{}>({});
  const [workSpace, setWorkSpace] = useState<string>("");
  const [createCaseState, setCreateCaseState] = useState<{
    step: number;
    caseId?: string;
  }>({ step: 1 });

  // if (osState === "login")
  // return <TempLogin setOsState={setOsState} setUser={setUser} />;

  return (
    <>
      <div className="flex gap-6 pb-16 px-8">
        <div className="w-64 flex flex-col /border gap-4">
          <div className="flex flex-col gap-1 h-14">
            <p className="text-3xl /font-noto-serif-jp font-bj-cree">CaseOS</p>
            <p className="text-xs font-inconsolata">
              AI-Powered Case Intelligence Workspace
            </p>
          </div>
          <div className="sticky top-4 bg-white rounded-2xl py-6 px-4 border border-black/15 shadow-md flex flex-col h-max max-h-[calc(100dvh-9.5rem)] gap-2">
            <SelectCaseMenu />
          </div>
        </div>
        {/* {osState !== "select_case" && (
          <div className="flex-1 py-8 px-6 /border h-[120vh] /h-max bg-white rounded-2xl border border-black/15 shadow-md">
            {osState === "create_case" && <></>}
          </div>
        )} */}
      </div>
    </>
  );
}
