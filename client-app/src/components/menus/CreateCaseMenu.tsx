import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import StepMenu from "#/components/menus/StepMenu";
import type { StepMenuIcon } from "#/components/menus/StepMenu";
import type { CaseIntakeWizardState } from "#/components/features/create-case/caseIntakeForm";

interface CreateCaseMenuProps {
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

    await navigate({ to: "/workspace/workspace_id" });
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
