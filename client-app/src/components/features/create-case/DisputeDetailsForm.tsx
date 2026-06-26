import type { CaseIntake, CaseIntakeClaim } from "#/types/caseWorkspace";
import TextAreaField from "#/components/ui/TextAreaField";
import {
  caseStatusOptions,
  claimKindOptions,
  createIntakeItemId,
  recordPartyOptions,
} from "#/components/features/create-case/caseIntakeForm";
import {
  AddRowButton,
  FormSection,
  InlineSelectField,
  InlineTextField,
  RepeaterCard,
  SelectField,
  TextInputField,
} from "#/components/features/create-case/fields";

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
  const claims = caseIntake.claims ?? [];

  const updateClaim = (id: string, patch: Partial<CaseIntakeClaim>) =>
    onFieldChange(
      "claims",
      claims.map((claim) => (claim.id === id ? { ...claim, ...patch } : claim)),
    );

  const addClaim = () =>
    onFieldChange("claims", [
      ...claims,
      {
        id: createIntakeItemId("claim"),
        label: "",
        side: caseIntake.clientRole === "defendant" ? "opposing" : "ours",
        kind: "affirmative",
        description: "",
      },
    ]);

  const removeClaim = (id: string) =>
    onFieldChange(
      "claims",
      claims.filter((claim) => claim.id !== id),
    );

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
          label="Claims, defenses, and allegations"
          description="Describe the claims, counterclaims, and defenses in play. The assistant will turn these into individual claim records."
          value={caseIntake.claimsAndDefenses}
          onChange={(event) =>
            onFieldChange("claimsAndDefenses", event.target.value)
          }
          placeholder="Breach of contract and negligence; defenses of waiver and failure to mitigate; a c. 93A counterclaim."
          className="md:col-span-2"
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-black/60">
          Optional: pin specific claims so each one starts as its own record with
          the right side and type. Leave this empty and the assistant will draft
          them from your description above.
        </p>
        {claims.map((claim) => (
          <RepeaterCard
            key={claim.id}
            onRemove={() => removeClaim(claim.id)}
            removeLabel="Remove claim"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InlineTextField
                label="Claim or defense"
                value={claim.label}
                onChange={(value) => updateClaim(claim.id, { label: value })}
                placeholder="Breach of the implied warranty of habitability"
                className="md:col-span-2"
              />
              <InlineSelectField
                label="Side"
                value={claim.side}
                onChange={(value) => updateClaim(claim.id, { side: value })}
                options={recordPartyOptions}
              />
              <InlineSelectField
                label="Type"
                value={claim.kind ?? "affirmative"}
                onChange={(value) => updateClaim(claim.id, { kind: value })}
                options={claimKindOptions}
              />
              <TextAreaField
                label="Notes (optional)"
                value={claim.description ?? ""}
                onChange={(event) =>
                  updateClaim(claim.id, { description: event.target.value })
                }
                placeholder="Elements at issue, who it runs against, current status..."
                className="md:col-span-2"
              />
            </div>
          </RepeaterCard>
        ))}
        <AddRowButton label="Add claim or defense" onClick={addClaim} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
        <TextAreaField
          label="Known authorities (optional)"
          description="Any statutes, cases, or rules you already know are central. Seeds legal precedent records."
          value={caseIntake.knownAuthorities ?? ""}
          onChange={(event) =>
            onFieldChange("knownAuthorities", event.target.value)
          }
          placeholder="G.L. c. 93A; G.L. c. 186 §14; Berman v. Parker..."
          className="md:col-span-2"
        />
      </div>
    </FormSection>
  );
};

export default DisputeDetailsForm;
