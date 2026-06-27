import { useState } from "react";

import type { CaseIntake, CaseIntakeTask } from "#/types/caseWorkspace";
import PrecisionDateField from "#/components/ui/PrecisionDateField";
import TextAreaField from "#/components/ui/TextAreaField";
import {
  createIntakeItemId,
  taskRowIsInvalid,
} from "#/components/features/create-case/caseIntakeForm";
import {
  AddRowButton,
  CheckboxField,
  fieldClassName,
  FormSection,
  InlineTextField,
  PinnedAnchorsHeader,
  RepeaterCard,
} from "#/components/features/create-case/fields";

type TasksAndDeadlinesFormProps = {
  caseIntake: CaseIntake;
  onFieldChange: <K extends keyof CaseIntake>(
    field: K,
    value: CaseIntake[K],
  ) => void;
};

const TasksAndDeadlinesForm = ({
  caseIntake,
  onFieldChange,
}: TasksAndDeadlinesFormProps) => {
  const tasks = caseIntake.tasks ?? [];

  // Rows the user started then clicked away from while still missing a title.
  // Tracked so a row only turns red on blur, never mid-typing.
  const [flaggedIds, setFlaggedIds] = useState<ReadonlySet<string>>(new Set());

  const flagOnBlur = (task: CaseIntakeTask) =>
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (taskRowIsInvalid(task)) next.add(task.id);
      else next.delete(task.id);
      return next;
    });

  const updateTask = (id: string, patch: Partial<CaseIntakeTask>) =>
    onFieldChange(
      "tasks",
      tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );

  const addTask = () =>
    onFieldChange("tasks", [
      ...tasks,
      {
        id: createIntakeItemId("task"),
        title: "",
        detail: "",
        dueDate: "",
        datePrecision: "day",
      },
    ]);

  const removeTask = (id: string) =>
    onFieldChange(
      "tasks",
      tasks.filter((task) => task.id !== id),
    );

  return (
    <FormSection
      title="Tasks and Deadlines"
      description="Capture what needs doing and by when. Flag anything time-sensitive so the assistant prioritizes it from day one."
      icon="list-checks"
    >
      <div className="flex flex-col gap-3">
        <PinnedAnchorsHeader
          title="Tasks & deadlines (optional)"
          rationale="Add discrete next actions or hard deadlines here. Anything you describe in prose below is also turned into tasks for you."
        />
        {tasks.map((task) => (
          <RepeaterCard
            key={task.id}
            onRemove={() => removeTask(task.id)}
            removeLabel="Remove task"
            invalid={flaggedIds.has(task.id) && taskRowIsInvalid(task)}
            invalidHint="Add a title, or remove this row."
            onBlurLeave={() => flagOnBlur(task)}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InlineTextField
                label="Task"
                value={task.title}
                onChange={(value) => updateTask(task.id, { title: value })}
                placeholder="File answer to the complaint"
                className="md:col-span-2"
              />
              <TextAreaField
                label="Detail (optional)"
                value={task.detail ?? ""}
                onChange={(event) =>
                  updateTask(task.id, { detail: event.target.value })
                }
                placeholder="What needs to happen, and why it matters..."
                className="md:col-span-2"
              />
              <PrecisionDateField
                label="Due date (optional)"
                value={task.dueDate}
                precision={task.datePrecision ?? "day"}
                onChange={(value) => updateTask(task.id, { dueDate: value })}
                className="grid gap-1.5"
                labelClassName="text-sm font-medium text-black/80"
                inputClassName={fieldClassName}
              />
              <div className="flex items-end">
                <CheckboxField
                  label="Time-sensitive"
                  checked={Boolean(task.isTimeSensitive)}
                  onChange={(checked) =>
                    updateTask(task.id, { isTimeSensitive: checked })
                  }
                />
              </div>
            </div>
          </RepeaterCard>
        ))}
        <AddRowButton label="Add task" onClick={addTask} />
      </div>

      <TextAreaField
        label="Anything else time-sensitive? (optional)"
        description="Upcoming deadlines or immediate pressure driving today’s priorities. The assistant mines this for more tasks and deadline events."
        value={caseIntake.urgentDeadlines ?? ""}
        onChange={(event) =>
          onFieldChange("urgentDeadlines", event.target.value)
        }
        placeholder="Response due April 22; discovery cutoff May 3; preservation risk for key records..."
      />
    </FormSection>
  );
};

export default TasksAndDeadlinesForm;
