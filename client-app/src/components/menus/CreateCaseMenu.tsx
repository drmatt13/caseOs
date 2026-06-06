import { Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import { ArrowLeft } from "lucide-react";
import StepMenu from "#/components/menus/StepMenu";
import type { StepMenuIcon } from "#/components/menus/StepMenu";
import type { CaseIntakeWizardState } from "#/components/features/create-case/caseIntakeForm";

interface CreateCaseMenuProps {
  workspaceId: string;
  caseIntakeState: CaseIntakeWizardState;
  setCaseIntakeState: React.Dispatch<
    React.SetStateAction<CaseIntakeWizardState>
  >;
  hasUnsavedCaseIntake: boolean;
}

const createCaseStepIcons: StepMenuIcon[] = [
  "briefcase",
  "scale",
  "clock",
  "target",
  "users",
  "fileText",
  "sparkles",
];

const createCaseStepLabels = [
  { title: "Case Basics", subtitle: "Name, area, role" },
  { title: "Dispute", subtitle: "Claim & status" },
  { title: "Timeline", subtitle: "Key events" },
  { title: "Goals", subtitle: "Objectives & risks" },
  { title: "Parties & witnesses", subtitle: "Involved parties" },
  { title: "Documents", subtitle: "Upload files" },
  { title: "Review", subtitle: "Generate case records" },
];

const CreateCaseMenu = ({
  workspaceId,
  caseIntakeState,
  setCaseIntakeState,
  hasUnsavedCaseIntake,
}: CreateCaseMenuProps) => {
  const handleLeaveCreateCase = (event: MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedCaseIntake) {
      const shouldLeave = window.confirm(
        "You have unsaved case intake details or uploaded files. Leaving now will discard your changes. Continue?",
      );

      if (!shouldLeave) {
        event.preventDefault();
        return;
      }
    }
  };

  return (
    <>
      <Link
        to="/workspaces/$workspaceId"
        params={{ workspaceId }}
        onClick={handleLeaveCreateCase}
        className="text-sm flex gap-1.5 items-center"
      >
        <span className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer">
          <ArrowLeft className="w-3 h-3" />
        </span>
        <p className="truncate">Create New Case</p>
      </Link>
      <StepMenu
        steps={7}
        icons={createCaseStepIcons}
        stepState={caseIntakeState.step}
        setStepState={(step) => {
          setCaseIntakeState((prev) => ({ ...prev, step }));
        }}
        labels={createCaseStepLabels}
      />
    </>
  );
};

export default CreateCaseMenu;
