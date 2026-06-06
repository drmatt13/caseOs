import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import AppLayout from "#/components/layouts/AppLayout";
import CaseBasicsForm from "#/components/features/create-case/CaseBasicsForm";
import DisputeDetailsForm from "#/components/features/create-case/DisputeDetailsForm";
import DocumentsForm from "#/components/features/create-case/DocumentsForm";
import GoalsObjectivesAndRisksForm from "#/components/features/create-case/GoalsObjectivesAndRisksForm";
import PeoplePartiesAndWitnessesForm from "#/components/features/create-case/PeoplePartiesAndWitnessesForm";
import TimelineAndUrgencyForm from "#/components/features/create-case/TimelineAndUrgencyForm";
import ReviewForm from "#/components/features/create-case/ReviewForm";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import {
  CASE_INTAKE_TOTAL_STEPS,
  initialCaseIntake,
} from "#/components/features/create-case/caseIntakeForm";
import ContentShell from "#/components/layouts/ContentShell";
import CreateCaseMenu from "#/components/menus/CreateCaseMenu";
import UserPanel from "#/components/UserPanel";
import Button from "#/components/Button";

import type { CaseIntake } from "#/types/caseWorkspace";
import type { CaseIntakeWizardState } from "#/components/features/create-case/caseIntakeForm";
import PageLoading from "#/components/PageLoading";
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

  if (getUserPending || getWorkspacePending) {
    return <PageLoading />;
  }

  if (getUserError || !user || getWorkspaceError || !workspace) {
    return <GetUserError />;
  }

  const [blankCaseIntake] = useState(createBlankCaseIntake);

  const [caseIntakeState, setCaseIntakeState] = useState<CaseIntakeWizardState>(
    {
      step: 6,
      // caseIntake: testIntakeData,
      caseIntake: blankCaseIntake,
    },
  );

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

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
  }, [caseIntakeState.step]);

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
    setCaseIntakeState((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, CASE_INTAKE_TOTAL_STEPS),
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

    switch (step) {
      case 1:
        return filled(c.caseName, c.intakeProvidedBy, c.jurisdictionOrCourt);
      case 2:
        return (
          filled(
            c.whatIsTheDisputeAbout,
            c.whatClaimsOrAllegationsAreInvolved,
          ) &&
          (c.currentCaseStatus === "pre_filing" || filled(c.caseNumber ?? ""))
        );
      case 3:
        return filled(
          c.keyEventsSoFar,
          c.importantFilingsDeadlinesAndIncidents,
          c.anythingUrgentRightNow,
        );
      case 4:
        return filled(
          c.yourObjective,
          c.otherSidesLikelyObjective,
          c.desiredOutcome,
          c.biggestCurrentRisk,
        );
      case 5:
        return filled(
          c.parties,
          c.attorneys,
          c.witnessesAndAnticipatedTestimony,
          c.whoMattersMostRightNow,
        );
      case 6:
        return true;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (caseIntakeState.step) {
      case 1:
        return (
          <CaseBasicsForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
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
          <TimelineAndUrgencyForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
          />
        );
      case 4:
        return (
          <GoalsObjectivesAndRisksForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
          />
        );
      case 5:
        return (
          <PeoplePartiesAndWitnessesForm
            caseIntake={caseIntakeState.caseIntake}
            onFieldChange={updateCaseIntakeField}
          />
        );
      case 6:
        return (
          <DocumentsForm
            caseIntake={caseIntakeState.caseIntake}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
          />
        );
      case 7:
        return <ReviewForm />;
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
        />
      </NavigationPanel>
      <ContentShell>
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
            <p className="justify-self-center text-md text-black/55">
              {`Step ${caseIntakeState.step} of ${CASE_INTAKE_TOTAL_STEPS}`}
            </p>
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
