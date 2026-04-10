import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "#/lib/auth";

import AppLayout from "#/components/layouts/AppLayout";
import CaseBasicsForm from "#/components/layouts/new_case/CaseBasicsForm";
import DisputeDetailsForm from "#/components/layouts/new_case/DisputeDetailsForm";
import DocumentsForm from "#/components/layouts/new_case/DocumentsForm";
import GoalsObjectivesAndRisksForm from "#/components/layouts/new_case/GoalsObjectivesAndRisksForm";
import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
import {
  CASE_INTAKE_TOTAL_STEPS,
  initialCaseIntake,
} from "#/components/layouts/new_case/caseIntakeForm";
import PeoplePartiesAndWitnessesForm from "#/components/layouts/new_case/PeoplePartiesAndWitnessesForm";
import TimelineAndUrgencyForm from "#/components/layouts/new_case/TimelineAndUrgencyForm";
import WorkPanelLayout from "#/components/layouts/WorkPanelLayout";
import CreateCaseMenu from "#/components/menus/CreateCaseMenu";
import UserPanel from "#/components/menus/UserPanel";
import Button from "#/components/Button";

import type { CaseIntake } from "#/../../types/caseWorkspace.schema";
import type { CaseIntakeWizardState } from "#/components/layouts/new_case/caseIntakeForm";

export const Route = createFileRoute("/cases/new")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();

  const [caseIntakeState, setCaseIntakeState] = useState<CaseIntakeWizardState>(
    {
      step: 1,
      caseIntake: initialCaseIntake,
    },
  );

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
        return <DocumentsForm caseIntake={caseIntakeState.caseIntake} />;
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
        />
      </LeftPanelLayout>
      <WorkPanelLayout>
        <div className="flex flex-col gap-6">
          {renderStep()}
          <div className="flex items-end justify-between gap-3 rounded-2xl /border /border-black/10 /bg-white/70 /p-4">
            <p className="text-sm text-black/55">
              Step {caseIntakeState.step} of {CASE_INTAKE_TOTAL_STEPS}
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
                    ? "Review"
                    : "Next"
                }
                disabled={caseIntakeState.step === CASE_INTAKE_TOTAL_STEPS}
                onClick={goToNextStep}
              />
            </div>
          </div>
        </div>
      </WorkPanelLayout>
    </AppLayout>
  );
}
