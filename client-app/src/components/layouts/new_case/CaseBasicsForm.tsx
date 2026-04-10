import type { CaseIntake } from "#/../../types/caseWorkspace.schema";
import {
  clientRoleOptions,
  representationPracticeAreaOptions,
  representationRoleOptions,
} from "#/components/layouts/new_case/caseIntakeForm";
import {
  FormSection,
  SelectField,
  TextInputField,
} from "#/components/layouts/new_case/fields";

type CaseBasicsFormProps = {
  caseIntake: CaseIntake;
  onFieldChange: <K extends keyof CaseIntake>(
    field: K,
    value: CaseIntake[K],
  ) => void;
};

const CaseBasicsForm = ({ caseIntake, onFieldChange }: CaseBasicsFormProps) => {
  return (
    <FormSection
      title="Case Basics"
      description="Basic information to help structure your workspace."
      icon="briefcase"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextInputField
          label="Case name"
          description="Use the working matter name your team will recognize."
          value={caseIntake.caseName}
          onChange={(event) => onFieldChange("caseName", event.target.value)}
          placeholder="Smith v. Jones"
          className="md:col-span-2"
        />
        <TextInputField
          label="Intake provided by"
          description="Who supplied this intake information?"
          value={caseIntake.intakeProvidedBy}
          onChange={(event) =>
            onFieldChange("intakeProvidedBy", event.target.value)
          }
          placeholder="John Doe, Esq."
        />
        <TextInputField
          label="Jurisdiction or court"
          description="Court, tribunal, or governing jurisdiction."
          value={caseIntake.jurisdictionOrCourt}
          onChange={(event) =>
            onFieldChange("jurisdictionOrCourt", event.target.value)
          }
          placeholder="Superior Court of California, County of Los Angeles"
        />
        <SelectField
          label="Practice area"
          description="Primary practice area for this representation."
          value={caseIntake.representationPracticeArea}
          onChange={(value) =>
            onFieldChange("representationPracticeArea", value)
          }
          options={representationPracticeAreaOptions}
        />
        <SelectField
          label="Representation role"
          description="Counsel posture for your team in this matter."
          value={caseIntake.representationRole}
          onChange={(value) => onFieldChange("representationRole", value)}
          options={representationRoleOptions}
        />
        <SelectField
          label="Client role"
          description="The formal role of your client in the case."
          value={caseIntake.clientRole}
          onChange={(value) => onFieldChange("clientRole", value)}
          options={clientRoleOptions}
        />
      </div>
    </FormSection>
  );
};

export default CaseBasicsForm;
