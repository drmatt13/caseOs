import { Sparkles } from "lucide-react";
import { FormSection } from "#/components/features/create-workspace/fields";
import type { CreateWorkspaceForm } from "#/components/features/create-workspace/workspaceForm";

type CreateWorkspaceReviewFormProps = {
  workspace: CreateWorkspaceForm;
};

const CreateWorkspaceReviewForm = ({
  workspace,
}: CreateWorkspaceReviewFormProps) => {
  return (
    <FormSection
      title="Create"
      description="Review the workspace before creating it."
      icon="sparkles"
    >
      <div className="flex flex-col items-center pt-6 text-center">
        <div className="mb-4 flex aspect-square items-center justify-center rounded-full border border-black/10 bg-black/6 p-4">
          <Sparkles className="w-7 h-7 text-black/75" />
        </div>
        <h2 className="text-xl font-semibold">Create Workspace</h2>
        <p className="mt-1 max-w-lg text-sm text-gray-600">
          Review the workspace information and starter team. The real create
          action can be wired up when the backend flow is ready.
        </p>
      </div>
      <div className="grid gap-3 text-sm">
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-black/55">Name</p>
          <p className="font-medium">{workspace.name}</p>
        </div>
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-black/55">Description</p>
          <p>{workspace.description}</p>
        </div>
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-black/55">Invites</p>
          <p>
            {workspace.invites.length === 0
              ? "No initial invites"
              : `${workspace.invites.length} pending invite${workspace.invites.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
    </FormSection>
  );
};

export default CreateWorkspaceReviewForm;
