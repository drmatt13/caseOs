import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import AppLayout from "#/components/layouts/AppLayout";
import CaseBasicsForm from "#/components/features/create-case/CaseBasicsForm";
import DisputeDetailsForm from "#/components/features/create-case/DisputeDetailsForm";
import DocumentsForm from "#/components/features/create-case/DocumentsForm";
import GoalsObjectivesAndRisksForm from "#/components/features/create-case/GoalsObjectivesAndRisksForm";
import PeoplePartiesAndWitnessesForm from "#/components/features/create-case/PeoplePartiesAndWitnessesForm";
import TimelineForm from "#/components/features/create-case/TimelineForm";
import TasksAndDeadlinesForm from "#/components/features/create-case/TasksAndDeadlinesForm";
import ReviewForm from "#/components/features/create-case/ReviewForm";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import {
  CASE_INTAKE_TOTAL_STEPS,
  claimHasAnchor,
  initialCaseIntake,
  pruneCaseIntake,
  stepHasInvalidRows,
} from "#/components/features/create-case/caseIntakeForm";
import ContentShell from "#/components/layouts/ContentShell";
import CreateCaseMenu from "#/components/menus/CreateCaseMenu";
import UserPanel from "#/components/layouts/UserPanel";
import Button from "#/components/ui/Button";

import type { CaseIntake } from "#/types/caseWorkspace";
import type { CaseIntakeWizardState } from "#/components/features/create-case/caseIntakeForm";
import PageLoading from "#/components/ui/PageLoading";
import GetUserError from "#/components/errors/GetUserError";

// route guards
import { requireAuth } from "#/lib/auth";

// useQuery
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useWorkspaceQuery } from "#/api/workspace/hooks";

// test data
import testIntakeData from "#/test_data/intake/oj/caseIntake";

void testIntakeData; // to prevent "declared but never used" error while developing with test data

const createBlankCaseIntake = (): CaseIntake => ({
  ...initialCaseIntake,
  id: `create-case-${Date.now()}`,
  documents: {},
});

export const Route = createFileRoute("/workspaces/$workspaceId_/cases/new")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  const { workspaceId } = Route.useParams();

  const {
    data: getUserResult,
    isPending: getUserPending,
    error: getUserError,
  } = useCurrentUserQuery();
  const user = getUserResult?.currentUser.user;
  const {
    data: workspace,
    isPending: getWorkspacePending,
    error: getWorkspaceError,
  } = useWorkspaceQuery(workspaceId, { enabled: Boolean(user) });

  const [blankCaseIntake] = useState(createBlankCaseIntake);

  const [caseIntakeState, setCaseIntakeState] = useState<CaseIntakeWizardState>(
    {
      step: 1,
      // caseIntake: testIntakeData,
      caseIntake: blankCaseIntake,
    },
  );

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [devSkipGating, setDevSkipGating] = useState(false);
  // High-water mark: the furthest step the user has ever navigated to (by Next or
  // menu). Both unlocking and check marks key off visitation, not raw validity,
  // so optional steps don't cascade-unlock or pre-check before they're visited.
  const [maxStepReached, setMaxStepReached] = useState(1);

  const hasUnsavedCaseIntake =
    uploadedFiles.length > 0 ||
    Object.entries(caseIntakeState.caseIntake).some(([key, value]) => {
      const initialValue = blankCaseIntake[key as keyof CaseIntake];

      if (typeof value === "string" && typeof initialValue === "string") {
        return value.trim() !== initialValue.trim();
      }

      return JSON.stringify(value) !== JSON.stringify(initialValue);
    });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    // Record any new high-water step reached (covers Next, Back, and menu jumps).
    setMaxStepReached((prev) => Math.max(prev, caseIntakeState.step));
  }, [caseIntakeState.step]);

  if (getUserPending || getWorkspacePending) {
    return <PageLoading />;
  }

  if (getUserError || !user || getWorkspaceError || !workspace) {
    return <GetUserError />;
  }

  const canManageWorkspace =
    workspace.currentUserMembership?.role === "OWNER" ||
    workspace.currentUserMembership?.role === "ADMIN";

  const updateCaseIntakeField = <K extends keyof CaseIntake>(
    field: K,
    value: CaseIntake[K],
  ) => {
    setCaseIntakeState((prev) => ({
      ...prev,
      caseIntake: {
        ...prev.caseIntake,
        [field]: value,
      },
    }));
  };

  const goToNextStep = () => {
    // Prune anchorless repeater rows on advance so the agent only ever receives
    // rows the user actually filled in (this also covers the final "Generate
    // Workspace" press, which caps the step but still runs the prune).
    setCaseIntakeState((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, CASE_INTAKE_TOTAL_STEPS),
      caseIntake: pruneCaseIntake(prev.caseIntake),
    }));
  };

  const goToPreviousStep = () => {
    setCaseIntakeState((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 1),
    }));
  };

  const isStepComplete = (step: number): boolean => {
    const c = caseIntakeState.caseIntake;
    const filled = (...fields: string[]) =>
      fields.every((f) => f.trim().length > 0);

    // Only the structured spine + the core narrative are hard-required. The rest
    // is encouraged-but-optional: blank fields become the agent's first task
    // (it proposes records to fill the gaps, which the user reviews).
    if (devSkipGating) return true;

    // A partial repeater row (started but missing its anchor) blocks advance on
    // any step until it's finished or removed.
    if (stepHasInvalidRows(step, c)) return false;

    switch (step) {
      case 1:
        return filled(c.caseName, c.intakeProvidedBy, c.representedPartyName);
      case 2:
        // Claims are "captured" by either the prose field or at least one
        // anchored pinned claim — so pinning a claim without re-typing it as
        // prose still satisfies the step.
        return (
          filled(c.whatIsTheDisputeAbout) &&
          (filled(c.claimsAndDefenses) ||
            (c.claims ?? []).some(claimHasAnchor)) &&
          (c.currentCaseStatus === "pre_filing" || filled(c.caseNumber ?? ""))
        );
      case 3: // Timeline — optional
        return true;
      case 4: // Tasks & deadlines — optional
        return true;
      case 5: // Goals & strategy
        return filled(c.objective);
      case 6: // People — optional
        return true;
      case 7: // Documents — optional
        return true;
      case 8: // Review
        return true;
      default:
        return false;
    }
  };

  // The furthest step the user has actually navigated to. Using the live cursor
  // here too avoids a one-render lag when this render is the one that moved.
  const reachedStep = Math.max(maxStepReached, caseIntakeState.step);

  // The leading run of *visited AND valid* steps. Gating on visitation is what
  // stops trivially-valid optional steps (Timeline, Tasks) from cascade-unlocking
  // before they're opened: the frontier only ever advances one visited step at a
  // time. Editing an earlier step back to invalid shrinks this run, so later
  // steps gray out; fixing it re-extends the run.
  let clearedThroughStep = 0;
  for (let s = 1; s <= CASE_INTAKE_TOTAL_STEPS; s++) {
    if (s > reachedStep || !isStepComplete(s)) break;
    clearedThroughStep = s;
  }
  // You can reach any cleared step, plus the first uncleared one (the frontier),
  // plus wherever the cursor currently is (never lock the visible screen).
  const maxUnlockedStep = Math.min(
    CASE_INTAKE_TOTAL_STEPS,
    Math.max(clearedThroughStep + 1, caseIntakeState.step),
  );
  // A step is checked once it's been *moved past* (a later step was reached) and
  // is still cleared — so the furthest step you're sitting on isn't checked until
  // you proceed, and navigating back keeps every earned check.
  const completedThroughStep = Math.min(clearedThroughStep, reachedStep - 1);

  const renderStep = () => {
    switch (caseIntakeState.step) {
      case 1:
        return (
          <CaseBasicsForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
            defaultUserName={
              [user.firstName, user.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() || undefined
            }
          />
        );
      case 2:
        return (
          <DisputeDetailsForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
          />
        );
      case 3:
        return (
          <TimelineForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
          />
        );
      case 4:
        return (
          <TasksAndDeadlinesForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
          />
        );
      case 5:
        return (
          <GoalsObjectivesAndRisksForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
          />
        );
      case 6:
        return (
          <PeoplePartiesAndWitnessesForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
          />
        );
      case 7:
        return (
          <DocumentsForm
            caseIntake={caseIntakeState.caseIntake}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
          />
        );
      case 8:
        return (
          <ReviewForm
            caseIntake={caseIntakeState.caseIntake}
            onEditStep={(step) =>
              setCaseIntakeState((prev) => ({ ...prev, step }))
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <NavigationPanel>
        <UserPanel user={user} settings={true} showTier={true} />
        <CreateCaseMenu
          workspaceId={workspaceId}
          caseIntakeState={caseIntakeState}
          setCaseIntakeState={setCaseIntakeState}
          hasUnsavedCaseIntake={hasUnsavedCaseIntake}
          maxUnlockedStep={maxUnlockedStep}
          completedThroughStep={completedThroughStep}
        />
      </NavigationPanel>
      <ContentShell showWorkspaceSettings={canManageWorkspace}>
        <div className="flex flex-col gap-6 h-full justify-between">
          {renderStep()}
          <div className="grid grid-cols-3 items-end gap-3 rounded-2xl">
            <div className="justify-self-start">
              {caseIntakeState.step !== 1 && (
                <Button
                  style="secondary"
                  text="Back"
                  disabled={caseIntakeState.step === 1}
                  onClick={goToPreviousStep}
                  minWidth="md"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setDevSkipGating((v) => !v)}
              className={`justify-self-center text-sm px-2 py-1 rounded font-mono transition-colors ${
                devSkipGating
                  ? "bg-amber-400/30 text-amber-800"
                  : "text-black/25 hover:text-black/50"
              }`}
            >
              {devSkipGating
                ? `⚡ skip on — step ${caseIntakeState.step}/${CASE_INTAKE_TOTAL_STEPS}`
                : `step ${caseIntakeState.step}/${CASE_INTAKE_TOTAL_STEPS}`}
            </button>
            <div className="justify-self-end">
              <Button
                style="primary"
                text={
                  caseIntakeState.step === CASE_INTAKE_TOTAL_STEPS
                    ? "Generate Workspace"
                    : "Next"
                }
                onClick={goToNextStep}
                disabled={!isStepComplete(caseIntakeState.step)}
                rainbow={caseIntakeState.step === CASE_INTAKE_TOTAL_STEPS}
                minWidth={
                  caseIntakeState.step === CASE_INTAKE_TOTAL_STEPS ? "xl" : "md"
                }
                icon={
                  caseIntakeState.step === CASE_INTAKE_TOTAL_STEPS
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
