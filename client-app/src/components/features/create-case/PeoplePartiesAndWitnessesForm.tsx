import type { CaseIntake } from "#/types/caseWorkspace";
import TextAreaField from "#/components/ui/TextAreaField";
import { FormSection } from "#/components/features/create-case/fields";

type PeoplePartiesAndWitnessesFormProps = {
  caseIntake: CaseIntake;
  onFieldChange: <K extends keyof CaseIntake>(
    field: K,
    value: CaseIntake[K],
  ) => void;
};

const PeoplePartiesAndWitnessesForm = ({
  caseIntake,
  onFieldChange,
}: PeoplePartiesAndWitnessesFormProps) => {
  return (
    <FormSection
      title="People, Parties, and Witnesses"
      description="Track the actors in the case and call out who deserves the team’s attention right now."
      icon="users"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Parties"
          description="List the parties involved and their roles."
          value={caseIntake.parties}
          onChange={(event) => onFieldChange("parties", event.target.value)}
          placeholder="John Smith (Plaintiff), Jane Doe (Defendant)"
        />
        <TextAreaField
          className="row-span-2 grid-rows-subgrid"
          label="Attorneys"
          description="List counsel involved on all sides."
          value={caseIntake.attorneys}
          onChange={(event) => onFieldChange("attorneys", event.target.value)}
          placeholder="John Doe, Esq. (Lead Counsel for Plaintiff)..."
        />
        <TextAreaField
          label="Witnesses and anticipated testimony"
          description="Identify key witnesses and what they are expected to say."
          value={caseIntake.witnessesAndAnticipatedTestimony}
          onChange={(event) =>
            onFieldChange(
              "witnessesAndAnticipatedTestimony",
              event.target.value,
            )
          }
          placeholder="Alice Johnson (eyewitness), Bob Lee (expert on industry standards)..."
          className="md:col-span-2"
        />
        <TextAreaField
          label="Who matters most right now?"
          description="Name the people or entities most important at this stage."
          value={caseIntake.whoMattersMostRightNow}
          onChange={(event) =>
            onFieldChange("whoMattersMostRightNow", event.target.value)
          }
          placeholder="Assigned judge, opposing counsel, and the percipient witness for the upcoming hearing."
          className="md:col-span-2"
        />
      </div>
    </FormSection>
  );
};

export default PeoplePartiesAndWitnessesForm;
