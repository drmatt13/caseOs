import TextAreaField from "#/components/TextAreaField";
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
  return (
    <FormSection
      title="Workspace Information"
      description="Name and describe the workspace your team will use."
      icon="workflow"
    >
      <div className="grid gap-4">
        <TextInputField
          label="Name"
          description="Use a short, recognizable workspace name."
          value={workspace.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          placeholder="Acme Litigation Team"
        />
        <TextAreaField
          label="Description"
          description="Summarize what this workspace is for."
          value={workspace.description}
          onChange={(event) =>
            onFieldChange("description", event.target.value)
          }
          placeholder="A shared workspace for tracking case work, documents, and team communication."
        />
      </div>
    </FormSection>
  );
};

export default WorkspaceInformationForm;
