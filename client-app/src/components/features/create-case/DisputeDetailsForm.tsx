import type { CaseIntake, CaseIntakeClaim } from "#/types/caseWorkspace";
import TextAreaField from "#/components/ui/TextAreaField";
import {
  claimHasAnchor,
  createIntakeItemId,
  getCaseStatusOptions,
  getClaimKindOptions,
  recordPartyOptions,
} from "#/components/features/create-case/caseIntakeForm";
import {
  AddRowButton,
  FormSection,
  InlineSelectField,
  InlineTextField,
  PinnedAnchorsHeader,
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
  const perspective = caseIntake.intakePerspective;
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
          placeholder="Summarize the conflict, key events, and why legal action is being considered."
          className="md:col-span-2"
        />
        <TextAreaField
          label="Claims, defenses, and allegations"
          description="Describe every claim, counterclaim, and defense in plain language. The assistant drafts a separate claim record for each one."
          value={caseIntake.claimsAndDefenses}
          onChange={(event) =>
            onFieldChange("claimsAndDefenses", event.target.value)
          }
          placeholder="Breach of contract, negligence, statutory claim; defenses of waiver, consent, or failure to mitigate."
          className="md:col-span-2"
        />
      </div>

      <div className="flex flex-col gap-3">
        <PinnedAnchorsHeader
          title="Individual claims (optional)"
          rationale="Add claims here only to lock the side and type so the assistant doesn't have to infer them. Otherwise leave this empty — claims are drafted from your description above."
        />
        {claims.map((claim) => (
          <RepeaterCard
            key={claim.id}
            onRemove={() => removeClaim(claim.id)}
            removeLabel="Remove claim"
            incomplete={!claimHasAnchor(claim)}
            incompleteHint="Add a claim or defense to keep this — empty rows aren't saved."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InlineTextField
                label="Claim or defense"
                value={claim.label}
                onChange={(value) => updateClaim(claim.id, { label: value })}
                placeholder="Breach of contract"
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
                options={getClaimKindOptions(perspective)}
              />
              <TextAreaField
                label="Notes (optional)"
                value={claim.description ?? ""}
                onChange={(event) =>
                  updateClaim(claim.id, { description: event.target.value })
                }
                placeholder="Elements at issue, affected parties, current posture, and supporting facts..."
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
          options={getCaseStatusOptions(perspective)}
        />
        <TextAreaField
          label="Known authorities (optional)"
          description="Any statutes, cases, or rules you already know are central. Seeds legal precedent records."
          value={caseIntake.knownAuthorities ?? ""}
          onChange={(event) =>
            onFieldChange("knownAuthorities", event.target.value)
          }
          placeholder="Relevant statute, rule, regulation, contract provision, or leading case..."
          className="md:col-span-2"
        />
      </div>
    </FormSection>
  );
};

export default DisputeDetailsForm;
