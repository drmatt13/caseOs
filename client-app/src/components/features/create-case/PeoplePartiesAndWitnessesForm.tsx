import type {
  CaseIntake,
  CaseIntakePerson,
  PersonRole,
} from "#/types/caseWorkspace";
import TextAreaField from "#/components/ui/TextAreaField";
import {
  createIntakeItemId,
  personHasAnchor,
  personRoleOptions,
  recordPartyOptions,
} from "#/components/features/create-case/caseIntakeForm";
import {
  AddRowButton,
  CheckboxField,
  FormSection,
  InlineSelectField,
  InlineTextField,
  PinnedAnchorsHeader,
  RepeaterCard,
} from "#/components/features/create-case/fields";

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
  const people = caseIntake.people;

  const updatePerson = (id: string, patch: Partial<CaseIntakePerson>) =>
    onFieldChange(
      "people",
      people.map((person) =>
        person.id === id ? { ...person, ...patch } : person,
      ),
    );

  const addPerson = () =>
    onFieldChange("people", [
      ...people,
      {
        id: createIntakeItemId("person"),
        name: "",
        roles: ["UNKNOWN"],
        side: "neutral",
      },
    ]);

  const removePerson = (id: string) =>
    onFieldChange(
      "people",
      people.filter((person) => person.id !== id),
    );

  return (
    <FormSection
      title="People, Parties, and Witnesses"
      description="Add the key people and which side each is on. Capturing the side here means the assistant never has to guess it — the costliest thing to get wrong."
      icon="users"
    >
      <div className="flex flex-col gap-3">
        <PinnedAnchorsHeader
          title="Add the key people (recommended)"
          rationale="Locking each person's side here is the single highest-value input on the form — it's the costliest thing for the assistant to get wrong."
        />
        {people.map((person) => (
          <RepeaterCard
            key={person.id}
            onRemove={() => removePerson(person.id)}
            removeLabel="Remove person"
            incomplete={!personHasAnchor(person)}
            incompleteHint="Add a name to keep this — empty rows aren't saved."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InlineTextField
                label="Name"
                value={person.name}
                onChange={(value) => updatePerson(person.id, { name: value })}
                placeholder="Jordan Lee"
              />
              <InlineTextField
                label="Organization (optional)"
                value={person.organization ?? ""}
                onChange={(value) =>
                  updatePerson(person.id, { organization: value })
                }
                placeholder="Acme Corporation"
              />
              <InlineSelectField
                label="Role"
                value={person.roles[0] ?? "UNKNOWN"}
                onChange={(value: PersonRole) =>
                  updatePerson(person.id, { roles: [value] })
                }
                options={personRoleOptions}
              />
              <InlineSelectField
                label="Side"
                value={person.side}
                onChange={(value) => updatePerson(person.id, { side: value })}
                options={recordPartyOptions}
              />
              <TextAreaField
                label="Notes (optional)"
                value={person.notes ?? ""}
                onChange={(event) =>
                  updatePerson(person.id, { notes: event.target.value })
                }
                placeholder="What they know, why they matter, how they connect to the case..."
                className="md:col-span-2"
              />
              <TextAreaField
                label="Anticipated testimony (optional)"
                description="If this person is a witness, what are they expected to say? Seeds a testimony record."
                value={person.anticipatedTestimony ?? ""}
                onChange={(event) =>
                  updatePerson(person.id, {
                    anticipatedTestimony: event.target.value,
                  })
                }
                placeholder="Will explain the key communications, decision process, and timeline."
                className="md:col-span-2"
              />
              <CheckboxField
                label="Key player right now"
                checked={Boolean(person.isKeyPlayer)}
                onChange={(checked) =>
                  updatePerson(person.id, { isKeyPlayer: checked })
                }
                className="md:col-span-2"
              />
            </div>
          </RepeaterCard>
        ))}
        <AddRowButton label="Add person" onClick={addPerson} />
      </div>

      <TextAreaField
        label="Anything else about the people involved? (optional)"
        description="A free-text fallback the assistant also mines for people you didn’t list above."
        value={caseIntake.peopleNarrative ?? ""}
        onChange={(event) =>
          onFieldChange("peopleNarrative", event.target.value)
        }
        placeholder="The opposing party may call records custodians; a former employee may have firsthand knowledge."
        className="w-full"
      />
    </FormSection>
  );
};

export default PeoplePartiesAndWitnessesForm;
