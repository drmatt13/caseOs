import type { CaseIntake } from "#/../../types/caseWorkspace";
import {
  FormSection,
  TextAreaField,
} from "#/components/layouts/new_case/fields";

type GoalsObjectivesAndRisksFormProps = {
  caseIntake: CaseIntake;
  onFieldChange: <K extends keyof CaseIntake>(
    field: K,
    value: CaseIntake[K],
  ) => void;
};

const GoalsObjectivesAndRisksForm = ({
  caseIntake,
  onFieldChange,
}: GoalsObjectivesAndRisksFormProps) => {
  return (
    <FormSection
      title="Goals, Objectives, and Risks"
      description="Clarify what success looks like, what the other side likely wants, and the main exposure shaping strategy."
      icon="target"
    >
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Your objective"
          description="Describe the principal goal for this matter."
          value={caseIntake.yourObjective}
          onChange={(event) =>
            onFieldChange("yourObjective", event.target.value)
          }
          placeholder="Dismiss claims, narrow discovery burden, obtain early settlement leverage..."
        />
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Other side’s likely objective"
          description="Capture your best current read on the opponent’s goals."
          value={caseIntake.otherSidesLikelyObjective}
          onChange={(event) =>
            onFieldChange("otherSidesLikelyObjective", event.target.value)
          }
          placeholder="Maximize damages, force business change, delay production..."
        />
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Desired outcome"
          description="State the ideal end state for the client."
          value={caseIntake.desiredOutcome}
          onChange={(event) =>
            onFieldChange("desiredOutcome", event.target.value)
          }
          placeholder="Defense verdict, favorable settlement, injunction denied..."
        />
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Biggest current risk"
          description="Identify the fact, motion, witness, or timeline risk that matters most now."
          value={caseIntake.biggestCurrentRisk}
          onChange={(event) =>
            onFieldChange("biggestCurrentRisk", event.target.value)
          }
          placeholder="Adverse email chain, unprepared witness, discovery sanctions exposure..."
        />
      </div>
    </FormSection>
  );
};

export default GoalsObjectivesAndRisksForm;
