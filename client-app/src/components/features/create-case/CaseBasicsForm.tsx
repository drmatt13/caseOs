import { useEffect, useRef } from "react";

import type { CaseIntake, IntakePerspective } from "#/types/caseWorkspace";
import {
  clientRoleOptions,
  clientRoleToProSeStance,
  proSeStanceOptions,
  proSeStanceToClientRole,
  representationPracticeAreaOptions,
  representationRoleOptions,
} from "#/components/features/create-case/caseIntakeForm";
import {
  FormSection,
  SelectField,
  TextInputField,
} from "#/components/features/create-case/fields";
import PerspectiveSelector from "#/components/features/create-case/PerspectiveSelector";

type CaseBasicsFormProps = {
  caseIntake: CaseIntake;
  onFieldChange: <K extends keyof CaseIntake>(
    field: K,
    value: CaseIntake[K],
  ) => void;
  // The signed-in user's name, used to prefill the intake author and, in
  // self-represented mode, the litigant's own name.
  defaultUserName?: string;
};

const CaseBasicsForm = ({
  caseIntake,
  onFieldChange,
  defaultUserName,
}: CaseBasicsFormProps) => {
  const isProSe = caseIntake.intakePerspective === "self";
  const defaultName = defaultUserName?.trim();
  const hasPrefilledPreparedBy = useRef(false);

  useEffect(() => {
    if (
      hasPrefilledPreparedBy.current ||
      isProSe ||
      !defaultName ||
      caseIntake.intakeProvidedBy.trim()
    ) {
      return;
    }

    hasPrefilledPreparedBy.current = true;
    onFieldChange("intakeProvidedBy", defaultName);
  }, [caseIntake.intakeProvidedBy, defaultName, isProSe, onFieldChange]);

  const handlePerspectiveChange = (next: IntakePerspective) => {
    if (next === caseIntake.intakePerspective) {
      return;
    }

    onFieldChange("intakePerspective", next);
    if (next === "self") {
      // A self-represented litigant has no separate counsel role.
      if (caseIntake.representationRole !== "pro_se") {
        onFieldChange("representationRole", "pro_se");
      }
      // Mirror the litigant's own name into both name fields if not set yet.
      const name = defaultName || caseIntake.representedPartyName.trim();
      if (name) {
        onFieldChange("representedPartyName", name);
        onFieldChange("intakeProvidedBy", name);
      }
    } else if (caseIntake.representationRole === "pro_se") {
      onFieldChange("representationRole", "lead_counsel");
      if (
        caseIntake.representedPartyName.trim() &&
        caseIntake.representedPartyName.trim() ===
          caseIntake.intakeProvidedBy.trim()
      ) {
        onFieldChange("representedPartyName", "");
      }
      if (defaultName) {
        onFieldChange("intakeProvidedBy", defaultName);
      } else if (!caseIntake.intakeProvidedBy.trim()) {
        onFieldChange("intakeProvidedBy", caseIntake.representedPartyName);
      }
    }
  };

  // In self mode a single "Your name" field stands in for both the represented
  // party and the intake author.
  const handleSelfNameChange = (value: string) => {
    onFieldChange("representedPartyName", value);
    onFieldChange("intakeProvidedBy", value);
  };

  return (
    <FormSection
      title="Case Basics"
      description="Basic information to help structure your workspace."
      icon="briefcase"
    >
      <PerspectiveSelector
        value={caseIntake.intakePerspective}
        onChange={handlePerspectiveChange}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextInputField
          label="Case name"
          description={
            isProSe
              ? "A name you'll recognize for this case."
              : "Use the working matter name your team will recognize."
          }
          value={caseIntake.caseName}
          onChange={(event) => onFieldChange("caseName", event.target.value)}
          placeholder={isProSe ? "My eviction case" : "Client v. Counterparty"}
          className="md:col-span-2"
        />

        {isProSe ? (
          <>
            <TextInputField
              label="Your name"
              description="The name you're using in this case. Drives the “your side” labels throughout the workspace."
              value={caseIntake.representedPartyName}
              onChange={(event) => handleSelfNameChange(event.target.value)}
              placeholder="Your full name"
              className="md:col-span-2"
            />
            <SelectField
              className="row-span-2 grid-rows-subgrid"
              label="Are you bringing this case, or responding to it?"
              description="Whether you started this case or are responding to one filed against you."
              value={clientRoleToProSeStance(caseIntake.clientRole)}
              onChange={(stance) =>
                onFieldChange("clientRole", proSeStanceToClientRole[stance])
              }
              options={proSeStanceOptions}
            />
            <SelectField
              className="row-span-2 grid-rows-subgrid"
              label="What kind of case is this?"
              description="The general area of law your case falls under."
              value={caseIntake.representationPracticeArea}
              onChange={(value) =>
                onFieldChange("representationPracticeArea", value)
              }
              options={representationPracticeAreaOptions}
            />
            <TextInputField
              label="Which court? (if you know)"
              description="The court or agency handling your case. Leave blank if you're not sure yet."
              value={caseIntake.jurisdictionOrCourt}
              onChange={(event) =>
                onFieldChange("jurisdictionOrCourt", event.target.value)
              }
              placeholder="County, court, or agency"
              className="md:col-span-2"
            />
          </>
        ) : (
          <>
            <TextInputField
              className="row-span-2 grid-rows-subgrid"
              label="Prepared by"
              description="Who is filling out this intake — yourself, a case lead, or an intake attorney."
              value={caseIntake.intakeProvidedBy}
              onChange={(event) =>
                onFieldChange("intakeProvidedBy", event.target.value)
              }
              placeholder="Your name or the intake attorney"
            />
            <TextInputField
              className="row-span-2 grid-rows-subgrid"
              label="Party you represent"
              description={"Drives the “our side” labels throughout the workspace."}
              value={caseIntake.representedPartyName}
              onChange={(event) =>
                onFieldChange("representedPartyName", event.target.value)
              }
              placeholder="Client name or represented entity"
            />
            <TextInputField
              label="Jurisdiction or court (optional)"
              description="Court, tribunal, or governing jurisdiction. Leave blank if not yet determined."
              value={caseIntake.jurisdictionOrCourt}
              onChange={(event) =>
                onFieldChange("jurisdictionOrCourt", event.target.value)
              }
              placeholder="Court, agency, arbitral forum, or governing jurisdiction"
              className="md:col-span-2"
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
          </>
        )}
      </div>
    </FormSection>
  );
};

export default CaseBasicsForm;
