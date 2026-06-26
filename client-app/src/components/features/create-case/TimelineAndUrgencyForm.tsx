import type { CaseIntake, CaseIntakeEvent } from "#/types/caseWorkspace";
import TextAreaField from "#/components/ui/TextAreaField";
import {
  createIntakeItemId,
  datePrecisionOptions,
  eventKindOptions,
} from "#/components/features/create-case/caseIntakeForm";
import {
  AddRowButton,
  CheckboxField,
  FormSection,
  InlineSelectField,
  InlineTextField,
  RepeaterCard,
} from "#/components/features/create-case/fields";

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
  const keyEvents = caseIntake.keyEvents ?? [];

  const updateEvent = (id: string, patch: Partial<CaseIntakeEvent>) =>
    onFieldChange(
      "keyEvents",
      keyEvents.map((event) =>
        event.id === id ? { ...event, ...patch } : event,
      ),
    );

  const addEvent = () =>
    onFieldChange("keyEvents", [
      ...keyEvents,
      {
        id: createIntakeItemId("event"),
        label: "",
        date: "",
        datePrecision: "day",
        kind: "incident",
      },
    ]);

  const removeEvent = (id: string) =>
    onFieldChange(
      "keyEvents",
      keyEvents.filter((event) => event.id !== id),
    );

  return (
    <FormSection
      title="Timeline and Urgency"
      description="Tell the story of what happened. Pin the dates that have to be exact, and flag anything time-sensitive right now."
      icon="clock"
    >
      <div className="grid gap-4">
        <TextAreaField
          label="What has happened so far?"
          description="Walk through the key events in your own words. The assistant extracts individual timeline events and facts from this."
          value={caseIntake.narrativeOfEvents ?? ""}
          onChange={(event) =>
            onFieldChange("narrativeOfEvents", event.target.value)
          }
          placeholder="Tenants moved in 2021 and reported pest issues; landlord served a notice to quit on June 17, 2025; summary process filed October 14, 2025..."
          minRows={4}
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-black/60">
          Optional: pin the handful of dates that must be exact. Everything else
          the assistant will extract from your narrative.
        </p>
        {keyEvents.map((event) => (
          <RepeaterCard
            key={event.id}
            onRemove={() => removeEvent(event.id)}
            removeLabel="Remove event"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InlineTextField
                label="What happened"
                value={event.label}
                onChange={(value) => updateEvent(event.id, { label: value })}
                placeholder="Notice to quit served"
                className="md:col-span-2"
              />
              <InlineTextField
                label="Date"
                type="date"
                value={event.date ?? ""}
                onChange={(value) => updateEvent(event.id, { date: value })}
              />
              <InlineSelectField
                label="Date precision"
                value={event.datePrecision ?? "day"}
                onChange={(value) =>
                  updateEvent(event.id, { datePrecision: value })
                }
                options={datePrecisionOptions}
              />
              <InlineSelectField
                label="Kind"
                value={event.kind ?? "incident"}
                onChange={(value) => updateEvent(event.id, { kind: value })}
                options={eventKindOptions}
              />
              <div className="flex items-end">
                <CheckboxField
                  label="Time-sensitive right now"
                  checked={Boolean(event.isUrgent)}
                  onChange={(checked) =>
                    updateEvent(event.id, { isUrgent: checked })
                  }
                />
              </div>
            </div>
          </RepeaterCard>
        ))}
        <AddRowButton label="Add key date" onClick={addEvent} />
      </div>

      <div className="grid gap-4">
        <TextAreaField
          label="Anything urgent right now?"
          description="Upcoming deadlines or immediate pressure driving today’s priorities. Seeds tasks and deadline events."
          value={caseIntake.urgentDeadlines ?? ""}
          onChange={(event) =>
            onFieldChange("urgentDeadlines", event.target.value)
          }
          placeholder="Opposition due April 22; discovery cutoff May 3; preservation risk on the entry logs..."
        />
      </div>
    </FormSection>
  );
};

export default TimelineAndUrgencyForm;
