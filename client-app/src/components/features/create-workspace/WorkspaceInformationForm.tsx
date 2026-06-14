import { type ChangeEvent } from "react";
import TextAreaField from "#/components/ui/TextAreaField";
import {
  FormSection,
  TextInputField,
} from "#/components/features/create-workspace/fields";
import type { CreateWorkspaceForm } from "#/components/features/create-workspace/workspaceForm";

type WorkspaceInformationFormProps = {
  workspace: CreateWorkspaceForm;
  onFieldChange: <K extends keyof CreateWorkspaceForm>(
    field: K,
    value: CreateWorkspaceForm[K],
  ) => void;
};

const WorkspaceInformationForm = ({
  workspace,
  onFieldChange,
}: WorkspaceInformationFormProps) => {
  const handleIncludeDescriptionChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const shouldIncludeDescription = event.target.checked;

    onFieldChange("includeDescription", shouldIncludeDescription);

    if (!shouldIncludeDescription) {
      onFieldChange("description", "");
    }
  };

  return (
    <FormSection
      title="Workspace Information"
      description="Name the workspace your team will use."
      icon="briefcase"
    >
      <div className="grid gap-4">
        <TextInputField
          label="Name"
          description="Use a short, recognizable workspace name."
          value={workspace.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          placeholder="Acme Litigation Team"
        />
        <div className="flex items-start gap-2 rounded-xl border border-black/10 bg-black/5 p-3 text-sm text-black/75">
          <input
            type="checkbox"
            aria-label="Add a description"
            checked={workspace.includeDescription}
            onChange={handleIncludeDescriptionChange}
            className="mt-0.5 h-4 w-4 accent-black"
          />
          <span>
            <span className="block font-medium text-black">
              Add a description
            </span>
            <span className="mt-0.5 block text-black/60">
              Optional context for what this workspace is for.
            </span>
          </span>
        </div>
        {workspace.includeDescription && (
          <TextAreaField
            label="Description"
            description="Summarize what this workspace is for."
            value={workspace.description}
            onChange={(event) =>
              onFieldChange("description", event.target.value)
            }
            placeholder="A shared workspace for tracking case work, documents, and team communication."
          />
        )}
      </div>
    </FormSection>
  );
};

export default WorkspaceInformationForm;
