import type { CaseIntake } from "#/types/caseWorkspace";
import TextAreaField from "#/components/ui/TextAreaField";
import { FormSection } from "#/components/features/create-case/fields";

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
      title="Goals and Strategy"
      description="Clarify what success looks like and your theory of the case. Anything you leave blank, the assistant will draft for you to review."
      icon="target"
    >
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Your objective"
          description="The principal goal for this matter."
          value={caseIntake.objective}
          onChange={(event) => onFieldChange("objective", event.target.value)}
          placeholder="Dismiss claims, narrow discovery burden, obtain early settlement leverage..."
        />
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Desired outcome (optional)"
          description="The ideal end state for the client."
          value={caseIntake.desiredOutcome ?? ""}
          onChange={(event) =>
            onFieldChange("desiredOutcome", event.target.value)
          }
          placeholder="Defense verdict, favorable settlement, injunction denied..."
        />
        <TextAreaField
          className="md:col-span-2"
          label="Theory of the case (optional)"
          description="In a sentence or two: your story of what happened and why you should win. Seeds the case theory."
          value={caseIntake.theoryOfTheCase ?? ""}
          onChange={(event) =>
            onFieldChange("theoryOfTheCase", event.target.value)
          }
          placeholder="This was never a simple nonpayment case — the landlord's own delay and unauthorized entry drove the damages they now claim."
        />
        <TextAreaField
          className="md:col-span-2"
          label="Key disputed issues (optional)"
          description="The questions the case will turn on. Seeds individual issue records."
          value={caseIntake.keyDisputedIssues ?? ""}
          onChange={(event) =>
            onFieldChange("keyDisputedIssues", event.target.value)
          }
          placeholder="Whether entry was authorized; whether habitability notice was given; whether damages were mitigated..."
        />
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Other side’s likely objective (optional)"
          description="Your best current read on the opponent’s goals."
          value={caseIntake.opposingObjective ?? ""}
          onChange={(event) =>
            onFieldChange("opposingObjective", event.target.value)
          }
          placeholder="Maximize damages, force business change, delay production..."
        />
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Biggest current risk (optional)"
          description="The fact, motion, witness, or timeline risk that matters most now."
          value={caseIntake.biggestRisk ?? ""}
          onChange={(event) => onFieldChange("biggestRisk", event.target.value)}
          placeholder="Adverse email chain, unprepared witness, discovery sanctions exposure..."
        />
        <TextAreaField
          className="md:col-span-2"
          label="What should the assistant focus on first? (optional)"
          description="Sets the assistant’s initial priorities as it builds the workspace."
          value={caseIntake.focusFirst ?? ""}
          onChange={(event) => onFieldChange("focusFirst", event.target.value)}
          placeholder="Reconstruct the entry timeline and flag every record missing documentary support."
        />
        <TextAreaField
          className="md:col-span-2"
          label="Anything else we should know? (optional)"
          description="Context that doesn’t fit elsewhere. Captured as a note."
          value={caseIntake.additionalContext ?? ""}
          onChange={(event) =>
            onFieldChange("additionalContext", event.target.value)
          }
          placeholder="Background, sensitivities, related matters, or anything you weren’t asked about."
        />
      </div>
    </FormSection>
  );
};

export default GoalsObjectivesAndRisksForm;
