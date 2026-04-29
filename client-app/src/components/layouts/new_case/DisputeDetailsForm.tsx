import type { CaseIntake } from "#/types/caseWorkspace";
import { caseStatusOptions } from "#/components/layouts/new_case/caseIntakeForm";
import {
  FormSection,
  SelectField,
  TextAreaField,
  TextInputField,
} from "#/components/layouts/new_case/fields";

type DisputeDetailsFormProps = {
  caseIntake: CaseIntake;
  onFieldChange: <K extends keyof CaseIntake>(
    field: K,
    value: CaseIntake[K],
  ) => void;
};

const DisputeDetailsForm = ({
  caseIntake,
  onFieldChange,
}: DisputeDetailsFormProps) => {
  return (
    <FormSection
      title="Dispute Details"
      description="Describe the situation in your own words, and where the case currently sits procedurally."
      icon="scale"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextAreaField
          label="What is the dispute about?"
          description="Describe the dispute, conflict, or legal issue at a high level."
          value={caseIntake.whatIsTheDisputeAbout}
          onChange={(event) =>
            onFieldChange("whatIsTheDisputeAbout", event.target.value)
          }
          placeholder="Outline the underlying dispute and why the matter exists."
          className="md:col-span-2"
        />
        <TextAreaField
          label="Claims or allegations involved"
          description="List the specific claims, defenses, or allegations in play."
          value={caseIntake.whatClaimsOrAllegationsAreInvolved}
          onChange={(event) =>
            onFieldChange(
              "whatClaimsOrAllegationsAreInvolved",
              event.target.value,
            )
          }
          placeholder="Breach of contract, negligence, fraud, or similar allegations."
          className="md:col-span-2"
        />
        <TextInputField
          label="Case number"
          description="Optional docket or matter number if one exists already."
          value={caseIntake.caseNumber ?? ""}
          onChange={(event) => onFieldChange("caseNumber", event.target.value)}
          placeholder="2023-CV-12345"
        />
        <SelectField
          label="Current case status"
          description="Choose the stage that best matches the case right now."
          value={caseIntake.currentCaseStatus}
          onChange={(value) => onFieldChange("currentCaseStatus", value)}
          options={caseStatusOptions}
        />
      </div>
    </FormSection>
  );
};

export default DisputeDetailsForm;
