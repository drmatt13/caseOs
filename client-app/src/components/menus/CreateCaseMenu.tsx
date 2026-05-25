import { useNavigate } from "@tanstack/react-router";
import {
  Clock,
  Target,
  Briefcase,
  Scale,
  Users,
  FileTextIcon,
  CheckSquare,
  ArrowLeft,
} from "lucide-react";
import type { CaseIntakeWizardState } from "#/components/features/case-intake/caseIntakeForm";

interface CreateCaseMenuProps {
  caseIntakeState: CaseIntakeWizardState;
  setCaseIntakeState: React.Dispatch<
    React.SetStateAction<CaseIntakeWizardState>
  >;
  hasUnsavedCaseIntake: boolean;
}

const CreateCaseMenu = ({
  caseIntakeState,
  setCaseIntakeState,
  hasUnsavedCaseIntake,
}: CreateCaseMenuProps) => {
  const navigate = useNavigate();

  const handleLeaveCreateCase = async () => {
    if (hasUnsavedCaseIntake) {
      const shouldLeave = window.confirm(
        "You have unsaved case intake details or uploaded files. Leaving now will discard your changes. Continue?",
      );

      if (!shouldLeave) {
        return;
      }
    }

    await navigate({ to: "/" });
  };

  return (
    <>
      <div className="text-sm flex gap-1.5 items-center">
        <button
          type="button"
          className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer"
          onClick={() => {
            void handleLeaveCreateCase();
          }}
        >
          <ArrowLeft className="w-3 h-3" />
        </button>

        <p className="truncate">Create New Case</p>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 1 ? "cursor-not-allowed opacity-25" : caseIntakeState.step <= 1 ? "bg-black/10 cursor-pointer" : "hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"}`}
        onClick={() => {
          if (caseIntakeState.step >= 1) {
            setCaseIntakeState((prev) => ({ ...prev, step: 1 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 1 ? "bg-black text-white" : "bg-green-600/60 text-black"} transition-colors ease-in duration-150`}
        >
          {caseIntakeState.step <= 1 ? (
            <Briefcase className="w-4 h-4" />
          ) : (
            <CheckSquare className="w-4 h-4" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Case Basics</p>
          <p className="text-gray-700 text-sm">Name, area, role</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 2 ? "cursor-not-allowed opacity-25" : caseIntakeState.step <= 2 ? "bg-black/10 cursor-pointer" : "hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"} `}
        onClick={() => {
          if (caseIntakeState.step >= 2) {
            setCaseIntakeState((prev) => ({ ...prev, step: 2 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 2 ? "bg-black text-white" : "bg-green-600/60 text-black"} transition-colors ease-in duration-150`}
        >
          {caseIntakeState.step <= 2 ? (
            <Scale className="w-4 h-4" />
          ) : (
            <CheckSquare className="w-4 h-4" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Dispute</p>
          <p className="text-gray-700 text-sm">Claim & status</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 3 ? "cursor-not-allowed opacity-25" : caseIntakeState.step <= 3 ? "bg-black/10 cursor-pointer" : "hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"} `}
        onClick={() => {
          if (caseIntakeState.step >= 3) {
            setCaseIntakeState((prev) => ({ ...prev, step: 3 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 3 ? "bg-black text-white" : "bg-green-600/60 text-black"} transition-colors ease-in duration-150`}
        >
          {caseIntakeState.step <= 3 ? (
            <Clock className="w-4 h-4" />
          ) : (
            <CheckSquare className="w-4 h-4" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Timeline</p>
          <p className="text-gray-700 text-sm">Key events</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 4 ? "cursor-not-allowed opacity-25" : caseIntakeState.step <= 4 ? "bg-black/10 cursor-pointer" : "hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"} `}
        onClick={() => {
          if (caseIntakeState.step >= 4) {
            setCaseIntakeState((prev) => ({ ...prev, step: 4 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 4 ? "bg-black text-white" : "bg-green-600/60 text-black"} transition-colors ease-in duration-150`}
        >
          {caseIntakeState.step <= 4 ? (
            <Target className="w-4 h-4" />
          ) : (
            <CheckSquare className="w-4 h-4" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Goals</p>
          <p className="text-gray-700 text-sm">Objectives & risks</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 5 ? "cursor-not-allowed opacity-25" : caseIntakeState.step <= 5 ? "bg-black/10 cursor-pointer" : "hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"} `}
        onClick={() => {
          if (caseIntakeState.step >= 5) {
            setCaseIntakeState((prev) => ({ ...prev, step: 5 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 5 ? "bg-black text-white" : "bg-green-600/60 text-black"} transition-colors ease-in duration-150`}
        >
          {caseIntakeState.step <= 5 ? (
            <Users className="w-4 h-4" />
          ) : (
            <CheckSquare className="w-4 h-4" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Parties & witnesses</p>
          <p className="text-gray-700 text-sm">Involved parties</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem] ${caseIntakeState.step < 6 ? "cursor-not-allowed opacity-25" : caseIntakeState.step <= 6 ? "bg-black/10 cursor-pointer" : "hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"} `}
        onClick={() => {
          if (caseIntakeState.step >= 6) {
            setCaseIntakeState((prev) => ({ ...prev, step: 6 }));
          }
        }}
      >
        <div
          className={`rounded-full p-2 ${caseIntakeState.step <= 6 ? "bg-black text-white" : "bg-green-600/60 text-black"} transition-colors ease-in duration-150`}
        >
          {caseIntakeState.step <= 6 ? (
            <FileTextIcon className="w-4 h-4" />
          ) : (
            <CheckSquare className="w-4 h-4" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Documents</p>
          <p className="text-gray-700 text-sm">Upload files</p>
        </div>
      </div>
    </>
  );
};

export default CreateCaseMenu;
