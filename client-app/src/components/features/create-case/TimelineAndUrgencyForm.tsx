import type { CaseIntake, CaseIntakeEvent } from "#/types/caseWorkspace";
import { coerceDateToPrecision } from "#/lib/datePrecision";
import PrecisionDateField, {
  OptionalEndDateField,
} from "#/components/ui/PrecisionDateField";
import TextAreaField from "#/components/ui/TextAreaField";
import {
  createIntakeItemId,
  datePrecisionOptions,
  eventHasAnchor,
  eventKindOptions,
} from "#/components/features/create-case/caseIntakeForm";
import {
  AddRowButton,
  CheckboxField,
  fieldClassName,
  FormSection,
  InlineSelectField,
  InlineTextField,
  PinnedAnchorsHeader,
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
          placeholder="Agreement signed in March 2025; performance issue surfaced in June; demand letter sent October 14, 2025..."
          minRows={4}
        />
      </div>

      <div className="flex flex-col gap-3">
        <PinnedAnchorsHeader
          title="Exact dates (optional)"
          rationale="Add only the dates that must be precise. Everything else is extracted from your story above."
        />
        {keyEvents.map((event) => {
          const precision = event.datePrecision ?? "day";
          return (
            <RepeaterCard
              key={event.id}
              onRemove={() => removeEvent(event.id)}
              removeLabel="Remove event"
              incomplete={!eventHasAnchor(event)}
              incompleteHint="Add what happened or a date to keep this — empty rows aren't saved."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <InlineTextField
                  label="What happened"
                  value={event.label}
                  onChange={(value) => updateEvent(event.id, { label: value })}
                  placeholder="Demand letter sent"
                  className="md:col-span-2"
                />
                <PrecisionDateField
                  label="Date"
                  value={event.date}
                  precision={precision}
                  onChange={(value) => updateEvent(event.id, { date: value })}
                  className="grid gap-1.5"
                  labelClassName="text-sm font-medium text-black/80"
                  inputClassName={fieldClassName}
                />
                <OptionalEndDateField
                  value={event.endDate}
                  precision={precision}
                  onChange={(value) => updateEvent(event.id, { endDate: value })}
                  min={event.date}
                  className="grid gap-1.5"
                  labelClassName="text-sm font-medium text-black/80"
                  inputClassName={fieldClassName}
                />
                <InlineSelectField
                  label="Date precision"
                  value={precision}
                  onChange={(value) =>
                    // Re-fit the pinned date(s) to the new grain so a fuzzy
                    // "month" date and a precise "minute" timestamp round-trip
                    // cleanly into the timeline event.
                    updateEvent(event.id, {
                      datePrecision: value,
                      date: coerceDateToPrecision(event.date, value),
                      ...(event.endDate
                        ? { endDate: coerceDateToPrecision(event.endDate, value) }
                        : {}),
                    })
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
          );
        })}
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
          placeholder="Response due April 22; discovery cutoff May 3; preservation risk for key records..."
        />
      </div>
    </FormSection>
  );
};

export default TimelineAndUrgencyForm;
