import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import TempLogin from "#/components/TempLogin";
import SelectCaseMenu from "#/components/SelectCaseMenu";
import CreateCaseMenu from "#/components/CreateCaseMenu";
import CaseWorkspace from "#/components/WorkspaceMenu";

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

export const Route = createFileRoute("/")({ component: App });

function App() {
  // const [workSpace, setWorkSpace] = useState<
  //   | "Agent Config"
  //   | "Case Summary"
  //   | "Timeline"
  //   | "Objectives"
  //   | "Tasks"
  //   | "Documents"
  // >("Agent Config");
  const [user, setUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [orgs, setOrgs] = useState<{
    useOrg: boolean;
    selectedOrg?: string;
    orgs: string[];
  }>({
    useOrg: false,
    selectedOrg: undefined,
    orgs: [],
  });
  const [osState, setOsState] = useState<
    "login" | "select_case" | "create_case" | "case_dashboard"
  >("login");
  const [caseState, setCaseState] = useState<{}>({});
  const [workSpace, setWorkSpace] = useState<string>("");
  const [createCaseState, setCreateCaseState] = useState<{
    step: number;
    caseId?: string;
  }>({ step: 1 });

  if (osState === "login")
    return <TempLogin setOsState={setOsState} setUser={setUser} />;

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
            {osState === "select_case" && (
              <SelectCaseMenu setOsState={setOsState} />
            )}
            {osState === "create_case" && (
              <CreateCaseMenu
                createCaseState={createCaseState}
                setCreateCaseState={setCreateCaseState}
              />
            )}

            {/* <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5 text-sm /text-white/80"></div>
            </div> */}
          </div>
        </div>
        {osState !== "select_case" && (
          <div className="flex-1 py-8 px-6 /border h-[120vh] /h-max bg-white rounded-2xl border border-black/15 shadow-md">
            {osState === "create_case" && <></>}
          </div>
        )}
      </div>
      {/* <div className="bg-white/10 flex-1">x</div>
      <div className="h-24 bg-black flex flex-col justify-between items-start">
        <input className="bg-white text-black" type="text" />
        <div className="bg-white text-black">xxxx</div>
      </div> */}
    </>
  );
}
