import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import AppLayout from "#/components/layouts/AppLayout";
import ContentShell from "#/components/layouts/ContentShell";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import CreateWorkspaceMenu from "#/components/menus/CreateWorkspaceMenu";
import Button from "#/components/Button";
import LoadingSpinner from "#/components/LoadingSpinner";
import UserPanel from "#/components/UserPanel";
import CreateWorkspaceReviewForm from "#/components/features/create-workspace/CreateWorkspaceReviewForm";
import TeamMembersForm from "#/components/features/create-workspace/TeamMembersForm";
import WorkspaceInformationForm from "#/components/features/create-workspace/WorkspaceInformationForm";
import {
  CREATE_WORKSPACE_TOTAL_STEPS,
  initialCreateWorkspace,
  type CreateWorkspaceForm,
  type CreateWorkspaceWizardState,
} from "#/components/features/create-workspace/workspaceForm";

import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { requireAuth } from "#/lib/auth";

const createBlankWorkspace = (): CreateWorkspaceForm => ({
  ...initialCreateWorkspace,
  invites: [],
});

export const Route = createFileRoute("/create/workspace")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  const { data: userResult, isPending, error } = useCurrentUserQuery();
  const user = userResult?.currentUser.user;
  const [blankWorkspace] = useState(createBlankWorkspace);
  const [workspaceState, setWorkspaceState] =
    useState<CreateWorkspaceWizardState>({
      step: 1,
      workspace: blankWorkspace,
    });

  const hasUnsavedWorkspace = Object.entries(workspaceState.workspace).some(
    ([key, value]) => {
      const initialValue = blankWorkspace[key as keyof CreateWorkspaceForm];

      if (typeof value === "string" && typeof initialValue === "string") {
        return value.trim() !== initialValue.trim();
      }

      return JSON.stringify(value) !== JSON.stringify(initialValue);
    },
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [workspaceState.step]);

  const updateWorkspaceField = <K extends keyof CreateWorkspaceForm>(
    field: K,
    value: CreateWorkspaceForm[K],
  ) => {
    setWorkspaceState((prev) => ({
      ...prev,
      workspace: {
        ...prev.workspace,
        [field]: value,
      },
    }));
  };

  const goToNextStep = () => {
    setWorkspaceState((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, CREATE_WORKSPACE_TOTAL_STEPS),
    }));
  };

  const goToPreviousStep = () => {
    setWorkspaceState((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 1),
    }));
  };

  const isStepComplete = (step: number): boolean => {
    const workspace = workspaceState.workspace;
    const filled = (...fields: string[]) =>
      fields.every((field) => field.trim().length > 0);

    switch (step) {
      case 1:
        return filled(workspace.name, workspace.description);
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (workspaceState.step) {
      case 1:
        return (
          <WorkspaceInformationForm
            workspace={workspaceState.workspace}
            onFieldChange={updateWorkspaceField}
          />
        );
      case 2:
        return (
          <TeamMembersForm
            workspace={workspaceState.workspace}
            onFieldChange={updateWorkspaceField}
          />
        );
      case 3:
        return (
          <CreateWorkspaceReviewForm workspace={workspaceState.workspace} />
        );
      default:
        return null;
    }
  };

  if (isPending) {
    return (
      <div className="w-full h-dvh flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !user) {
    return <>placeholder for error</>;
  }

  return (
    <AppLayout>
      <NavigationPanel>
        <UserPanel user={user} settings={true} showTier={true} />
        <CreateWorkspaceMenu
          workspaceState={workspaceState}
          setWorkspaceState={setWorkspaceState}
          hasUnsavedWorkspace={hasUnsavedWorkspace}
        />
      </NavigationPanel>
      <ContentShell>
        <div className="flex flex-col gap-6 h-full justify-between">
          {renderStep()}
          <div className="grid grid-cols-3 items-end gap-3 rounded-2xl">
            <div className="justify-self-start">
              {workspaceState.step !== 1 && (
                <Button
                  style="secondary"
                  text="Back"
                  disabled={workspaceState.step === 1}
                  onClick={goToPreviousStep}
                  minWidth="md"
                />
              )}
            </div>
            <p className="justify-self-center text-md text-black/55">
              {workspaceState.step !== CREATE_WORKSPACE_TOTAL_STEPS &&
                `Step ${workspaceState.step} of ${CREATE_WORKSPACE_TOTAL_STEPS - 1}`}
            </p>
            <div className="justify-self-end">
              <Button
                style="primary"
                text={
                  workspaceState.step === CREATE_WORKSPACE_TOTAL_STEPS
                    ? "Create Workspace"
                    : "Next"
                }
                onClick={goToNextStep}
                disabled={!isStepComplete(workspaceState.step)}
                rainbow={workspaceState.step === CREATE_WORKSPACE_TOTAL_STEPS}
                minWidth={
                  workspaceState.step === CREATE_WORKSPACE_TOTAL_STEPS
                    ? "xl"
                    : "md"
                }
                icon={
                  workspaceState.step === CREATE_WORKSPACE_TOTAL_STEPS
                    ? "sparkles"
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </ContentShell>
    </AppLayout>
  );
}
