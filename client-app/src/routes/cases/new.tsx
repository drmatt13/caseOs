import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "#/lib/auth";

import AppLayout from "#/components/layouts/AppLayout";
import CaseBasicsForm from "#/components/layouts/new_case/CaseBasicsForm";
import DisputeDetailsForm from "#/components/layouts/new_case/DisputeDetailsForm";
import DocumentsForm from "#/components/layouts/new_case/DocumentsForm";
import GoalsObjectivesAndRisksForm from "#/components/layouts/new_case/GoalsObjectivesAndRisksForm";
import PeoplePartiesAndWitnessesForm from "#/components/layouts/new_case/PeoplePartiesAndWitnessesForm";
import TimelineAndUrgencyForm from "#/components/layouts/new_case/TimelineAndUrgencyForm";
import ReviewForm from "#/components/layouts/new_case/ReviewForm";
import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
import {
  CASE_INTAKE_TOTAL_STEPS,
  initialCaseIntake,
} from "#/components/layouts/new_case/caseIntakeForm";
import WorkPanelLayout from "#/components/layouts/WorkPanelLayout";
import CreateCaseMenu from "#/components/menus/CreateCaseMenu";
import UserPanel from "#/components/menus/UserPanel";
import Button from "#/components/Button";

import type { CaseIntake } from "#/../../types/caseWorkspace.schema";
import type { CaseIntakeWizardState } from "#/components/layouts/new_case/caseIntakeForm";

// test data
import { testCaseIntake } from "#/lib/test_data";

export const Route = createFileRoute("/cases/new")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();

  const [caseIntakeState, setCaseIntakeState] = useState<CaseIntakeWizardState>(
    {
      step: 6,
      caseIntake: testCaseIntake,
    },
  );

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const hasUnsavedCaseIntake =
    uploadedFiles.length > 0 ||
    Object.entries(caseIntakeState.caseIntake).some(([key, value]) => {
      const initialValue = initialCaseIntake[key as keyof CaseIntake];

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
      <LeftPanelLayout>
        <UserPanel user={user} />
        <CreateCaseMenu
          caseIntakeState={caseIntakeState}
          setCaseIntakeState={setCaseIntakeState}
          hasUnsavedCaseIntake={hasUnsavedCaseIntake}
        />
      </LeftPanelLayout>
      <WorkPanelLayout>
        <div className="flex flex-col gap-6">
          {renderStep()}
          <div className="flex items-end justify-between gap-3 rounded-2xl /border /border-black/10 /bg-white/70 /p-4">
            <p className="text-sm text-black/55">
              {caseIntakeState.step !== CASE_INTAKE_TOTAL_STEPS &&
                `Step ${caseIntakeState.step} of ${CASE_INTAKE_TOTAL_STEPS - 1}`}
            </p>
            <div className="flex gap-2">
              {caseIntakeState.step !== 1 && (
                <Button
                  style="secondary"
                  text="Back"
                  disabled={caseIntakeState.step === 1}
                  onClick={goToPreviousStep}
                />
              )}
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
                icon={
                  caseIntakeState.step === CASE_INTAKE_TOTAL_STEPS
                    ? "sparkles"
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </WorkPanelLayout>
    </AppLayout>
  );
}
