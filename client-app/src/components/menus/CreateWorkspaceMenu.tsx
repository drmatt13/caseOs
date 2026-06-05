import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import StepMenu from "#/components/menus/StepMenu";
import type { StepMenuIcon } from "#/components/menus/StepMenu";
import type { CreateWorkspaceWizardState } from "#/components/features/create-workspace/workspaceForm";

interface CreateWorkspaceMenuProps {
  workspaceState: CreateWorkspaceWizardState;
  setWorkspaceState: React.Dispatch<
    React.SetStateAction<CreateWorkspaceWizardState>
  >;
  hasUnsavedWorkspace: boolean;
}

const createWorkspaceStepIcons: StepMenuIcon[] = [
  "briefcase",
  "users",
  "checkSquare",
];

const createWorkspaceStepLabels = [
  { title: "Workspace Information", subtitle: "Name & optional description" },
  { title: "Team Members", subtitle: "Invite users & assign roles" },
  { title: "Review Workspace", subtitle: "Confirm name & team" },
];

const CreateWorkspaceMenu = ({
  workspaceState,
  setWorkspaceState,
  hasUnsavedWorkspace,
}: CreateWorkspaceMenuProps) => {
  const navigate = useNavigate();

  const handleLeaveCreateWorkspace = async () => {
    if (hasUnsavedWorkspace) {
      const shouldLeave = window.confirm(
        "You have unsaved workspace details. Leaving now will discard your changes. Continue?",
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
            void handleLeaveCreateWorkspace();
          }}
        >
          <ArrowLeft className="w-3 h-3" />
        </button>

        <p className="truncate">Create Workspace</p>
      </div>
      <StepMenu
        steps={3}
        icons={createWorkspaceStepIcons}
        stepState={workspaceState.step}
        setStepState={(step) => {
          setWorkspaceState((prev) => ({ ...prev, step }));
        }}
        labels={createWorkspaceStepLabels}
      />
    </>
  );
};

export default CreateWorkspaceMenu;
