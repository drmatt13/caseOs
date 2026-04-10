import React from "react";

import {
  Settings,
  Bot,
  Clock,
  Target,
  SquareCheckBig,
  CheckIcon,
  CheckCircleIcon,
  Folder,
  FileText,
  PlusIcon,
  Briefcase,
  Scale,
  Users,
  FileTextIcon,
  CheckSquare,
  // Link,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { CaseIntakeWizardState } from "#/components/layouts/new_case/caseIntakeForm";

interface CreateCaseMenuProps {
  caseIntakeState: CaseIntakeWizardState;
  setCaseIntakeState: React.Dispatch<
    React.SetStateAction<CaseIntakeWizardState>
  >;
}

const CreateCaseMenu = ({
  caseIntakeState,
  setCaseIntakeState,
}: CreateCaseMenuProps) => {
  return (
    <>
      <div className="text-xs flex gap-1.5 items-center">
        <Link to="/">
          <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer">
            <ArrowLeft className="w-3 h-3" />
          </div>
        </Link>

        <p className="truncate">Create New Case</p>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 1 ? "cursor-not-allowed" : caseIntakeState.step <= 1 ? "bg-mist-300/60 cursor-pointer" : "hover:bg-mist-300/60 cursor-pointer"}`}
        onClick={() => {
          if (caseIntakeState.step >= 1) {
            setCaseIntakeState((prev) => ({ ...prev, step: 1 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 1 ? "bg-black" : "bg-green-600/60"}`}
        >
          {caseIntakeState.step <= 1 ? (
            <Briefcase className="w-4 h-4 text-white" />
          ) : (
            <CheckSquare className="w-4 h-4 text-black" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Case Basics</p>
          <p className="text-gray-700 text-xs">Name, area, role</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 2 ? "cursor-not-allowed" : caseIntakeState.step <= 2 ? "bg-mist-300/60 cursor-pointer" : "hover:bg-mist-300/60 cursor-pointer"} `}
        onClick={() => {
          if (caseIntakeState.step >= 2) {
            setCaseIntakeState((prev) => ({ ...prev, step: 2 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 2 ? "bg-black" : "bg-green-600/60"}`}
        >
          {caseIntakeState.step <= 2 ? (
            <Scale className="w-4 h-4 text-white" />
          ) : (
            <CheckSquare className="w-4 h-4 text-black" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Dispute</p>
          <p className="text-gray-700 text-xs">Claim & status</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 3 ? "cursor-not-allowed" : caseIntakeState.step <= 3 ? "bg-mist-300/60 cursor-pointer" : "hover:bg-mist-300/60 cursor-pointer"} `}
        onClick={() => {
          if (caseIntakeState.step >= 3) {
            setCaseIntakeState((prev) => ({ ...prev, step: 3 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 3 ? "bg-black" : "bg-green-600/60"}`}
        >
          {caseIntakeState.step <= 3 ? (
            <Clock className="w-4 h-4 text-white" />
          ) : (
            <CheckSquare className="w-4 h-4 text-black" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Timeline</p>
          <p className="text-gray-700 text-xs">Key events</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 4 ? "cursor-not-allowed" : caseIntakeState.step <= 4 ? "bg-mist-300/60 cursor-pointer" : "hover:bg-mist-300/60 cursor-pointer"} `}
        onClick={() => {
          if (caseIntakeState.step >= 4) {
            setCaseIntakeState((prev) => ({ ...prev, step: 4 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 4 ? "bg-black" : "bg-green-600/60"}`}
        >
          {caseIntakeState.step <= 4 ? (
            <Target className="w-4 h-4 text-white" />
          ) : (
            <CheckSquare className="w-4 h-4 text-black" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Goals</p>
          <p className="text-gray-700 text-xs">Objectives & risks</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 5 ? "cursor-not-allowed" : caseIntakeState.step <= 5 ? "bg-mist-300/60 cursor-pointer" : "hover:bg-mist-300/60 cursor-pointer"} `}
        onClick={() => {
          if (caseIntakeState.step >= 5) {
            setCaseIntakeState((prev) => ({ ...prev, step: 5 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 5 ? "bg-black" : "bg-green-600/60"}`}
        >
          {caseIntakeState.step <= 5 ? (
            <Users className="w-4 h-4 text-white" />
          ) : (
            <CheckSquare className="w-4 h-4 text-black" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Parties & witnesses</p>
          <p className="text-gray-700 text-xs">Involved parties</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 6 ? "cursor-not-allowed" : caseIntakeState.step <= 6 ? "bg-mist-300/60 cursor-pointer" : "hover:bg-mist-300/60 cursor-pointer"} `}
        onClick={() => {
          if (caseIntakeState.step >= 6) {
            setCaseIntakeState((prev) => ({ ...prev, step: 6 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 6 ? "bg-black" : "bg-green-600/60"}`}
        >
          {caseIntakeState.step <= 6 ? (
            <FileTextIcon className="w-4 h-4 text-white" />
          ) : (
            <CheckSquare className="w-4 h-4 text-black" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Documents</p>
          <p className="text-gray-700 text-xs">Upload files</p>
        </div>
      </div>
    </>
  );
};

export default CreateCaseMenu;
