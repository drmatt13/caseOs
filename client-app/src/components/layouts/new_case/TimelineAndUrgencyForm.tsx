import type { CaseIntake } from "#/../../types/caseWorkspace.schema";
import {
  FormSection,
  TextAreaField,
} from "#/components/layouts/new_case/fields";

type TimelineAndUrgencyFormProps = {
  caseIntake: CaseIntake;
  onFieldChange: <K extends keyof CaseIntake>(
    field: K,
    value: CaseIntake[K],
  ) => void;
};

const TimelineAndUrgencyForm = ({
  caseIntake,
  onFieldChange,
}: TimelineAndUrgencyFormProps) => {
  return (
    <FormSection
      title="Timeline and Urgency"
      description="Record the procedural history, immediate deadlines, and any timing pressure shaping current work."
      icon="clock"
    >
      <div className="grid gap-4">
        <TextAreaField
          label="Key events so far"
          description="Capture the major filings, hearings, or material developments that already happened."
          value={caseIntake.keyEventsSoFar}
          onChange={(event) =>
            onFieldChange("keyEventsSoFar", event.target.value)
          }
          placeholder="Complaint filed, TRO hearing held, written discovery served..."
        />
        <TextAreaField
          label="Important filings, deadlines, and incidents"
          description="List the upcoming deadlines or recent events the team needs to track closely."
          value={caseIntake.importantFilingsDeadlinesAndIncidents}
          onChange={(event) =>
            onFieldChange(
              "importantFilingsDeadlinesAndIncidents",
              event.target.value,
            )
          }
          placeholder="Opposition due April 22, deposition noticed for May 3..."
        />
        <TextAreaField
          label="Anything urgent right now?"
          description="Note the immediate time-sensitive issues driving today’s priorities."
          value={caseIntake.anythingUrgentRightNow}
          onChange={(event) =>
            onFieldChange("anythingUrgentRightNow", event.target.value)
          }
          placeholder="Pending injunction ruling, discovery cutoff, preservation risk..."
        />
      </div>
    </FormSection>
  );
};

export default TimelineAndUrgencyForm;
