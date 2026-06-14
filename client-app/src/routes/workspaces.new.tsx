import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import AppLayout from "#/components/layouts/AppLayout";
import ContentShell from "#/components/layouts/ContentShell";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import CreateWorkspaceMenu from "#/components/menus/CreateWorkspaceMenu";
import Button from "#/components/ui/Button";
import PageLoading from "#/components/ui/PageLoading";
import GetUserError from "#/components/errors/GetUserError";
import UserPanel from "#/components/layouts/UserPanel";
import CreateWorkspaceReviewForm from "#/components/features/create-workspace/CreateWorkspaceReviewForm";
import TeamMembersForm from "#/components/features/create-workspace/TeamMembersForm";
import WorkspaceInformationForm from "#/components/features/create-workspace/WorkspaceInformationForm";
import {
  CREATE_WORKSPACE_TOTAL_STEPS,
  initialCreateWorkspace,
  type CreateWorkspaceForm,
  type WorkspaceRole,
  type CreateWorkspaceWizardState,
} from "#/components/features/create-workspace/workspaceForm";

import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useCreateWorkspaceMutation } from "#/api/workspace/hooks";
import type { CreateWorkspacePayloadInput } from "#/api/workspace/operations";
import type { MembershipRole } from "#/api/generated/graphql";
import { requireAuth } from "#/lib/auth";

const createBlankWorkspace = (): CreateWorkspaceForm => ({
  ...initialCreateWorkspace,
  invites: [],
});

const workspaceRoleToMembershipRole: Record<WorkspaceRole, MembershipRole> = {
  Admin: "ADMIN",
  Contributor: "CONTRIBUTOR",
  "Read Only": "READONLY",
};

const toCreateWorkspaceInput = (
  workspace: CreateWorkspaceForm,
): CreateWorkspacePayloadInput => ({
  name: workspace.name.trim(),
  description: workspace.includeDescription
    ? workspace.description.trim() || null
    : null,
  invitations: workspace.invites.map((invite) => ({
    email: invite.email.trim().toLowerCase(),
    role: workspaceRoleToMembershipRole[invite.role],
  })),
});

const WorkspaceCreationNotPermitted = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const homeTimer = window.setTimeout(() => {
      void navigate({ to: "/", replace: true });
    }, 3000);

    return () => window.clearTimeout(homeTimer);
  }, [navigate]);

  return (
    <div className="h-dvh w-full flex justify-center items-center px-6 text-center">
      <p className="max-w-lg text-lg">
        Not permitted. Workspace creation is not available on the free tier. You
        will be routed home in a few seconds.
      </p>
    </div>
  );
};

export const Route = createFileRoute("/workspaces/new")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: userResult, isPending, error } = useCurrentUserQuery();
  const createWorkspaceMutation = useCreateWorkspaceMutation();
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

  const handlePrimaryAction = async () => {
    if (workspaceState.step !== CREATE_WORKSPACE_TOTAL_STEPS) {
      goToNextStep();
      return;
    }

    const result = await createWorkspaceMutation.mutateAsync(
      toCreateWorkspaceInput(workspaceState.workspace),
    );

    await navigate({
      to: "/workspaces/$workspaceId",
      params: { workspaceId: result.workspace.id },
    });
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
        return (
          filled(workspace.name) &&
          (!workspace.includeDescription || filled(workspace.description))
        );
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
    return <PageLoading />;
  }

  if (error || !user) {
    return <GetUserError />;
  }

  if (user.accountTier === "FREE") {
    return <WorkspaceCreationNotPermitted />;
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
          {createWorkspaceMutation.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {createWorkspaceMutation.error.message}
            </div>
          )}
          <div className="grid grid-cols-3 items-end gap-3 rounded-2xl">
            <div className="justify-self-start">
              {workspaceState.step !== 1 && (
                <Button
                  style="secondary"
                  text="Back"
                  disabled={
                    workspaceState.step === 1 ||
                    createWorkspaceMutation.isPending
                  }
                  onClick={goToPreviousStep}
                  minWidth="md"
                />
              )}
            </div>
            <p className="justify-self-center text-md text-black/65">
              {`Step ${workspaceState.step} of ${CREATE_WORKSPACE_TOTAL_STEPS}`}
            </p>
            <div className="justify-self-end">
              <Button
                style="primary"
                text={
                  workspaceState.step === CREATE_WORKSPACE_TOTAL_STEPS
                    ? createWorkspaceMutation.isPending
                      ? "Creating Workspace"
                      : "Create Workspace"
                    : "Next"
                }
                onClick={() => {
                  void handlePrimaryAction();
                }}
                disabled={
                  !isStepComplete(workspaceState.step) ||
                  createWorkspaceMutation.isPending
                }
                minWidth={
                  workspaceState.step === CREATE_WORKSPACE_TOTAL_STEPS
                    ? "xl"
                    : "md"
                }
                icon={
                  workspaceState.step === CREATE_WORKSPACE_TOTAL_STEPS
                    ? "check"
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
