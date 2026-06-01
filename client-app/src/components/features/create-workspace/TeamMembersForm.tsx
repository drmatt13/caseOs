import Button from "#/components/Button";
import {
  FormSection,
  SelectField,
  TextInputField,
} from "#/components/features/create-workspace/fields";
import {
  workspaceRoleOptions,
  type CreateWorkspaceForm,
} from "#/components/features/create-workspace/workspaceForm";

type TeamMembersFormProps = {
  workspace: CreateWorkspaceForm;
  onFieldChange: <K extends keyof CreateWorkspaceForm>(
    field: K,
    value: CreateWorkspaceForm[K],
  ) => void;
};

const TeamMembersForm = ({
  workspace,
  onFieldChange,
}: TeamMembersFormProps) => {
  const addInvite = () => {
    const email = workspace.pendingInviteEmail.trim();

    if (!email) {
      return;
    }

    onFieldChange("invites", [
      ...workspace.invites,
      { email, role: workspace.pendingInviteRole },
    ]);
    onFieldChange("pendingInviteEmail", "");
  };

  return (
    <FormSection
      title="Team Members"
      description="Invite users and assign starter roles."
      icon="users"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end">
        <TextInputField
          label="Invite Users"
          description="Fake invite list for now."
          value={workspace.pendingInviteEmail}
          onChange={(event) =>
            onFieldChange("pendingInviteEmail", event.target.value)
          }
          placeholder="teammate@example.com"
        />
        <SelectField
          label="Assign Roles"
          value={workspace.pendingInviteRole}
          onChange={(value) => onFieldChange("pendingInviteRole", value)}
          options={workspaceRoleOptions}
        />
        <Button text="Add" style="secondary" onClick={addInvite} />
      </div>
      <div className="flex flex-col gap-2">
        {workspace.invites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-black/55">
            No team members added yet. You can skip this and invite people
            later.
          </div>
        ) : (
          workspace.invites.map((invite, index) => (
            <div
              key={`${invite.email}-${index}`}
              className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2 text-sm"
            >
              <span className="truncate">{invite.email}</span>
              <span className="shrink-0 rounded-lg bg-black/10 px-2.5 py-1 text-black/70">
                {invite.role}
              </span>
            </div>
          ))
        )}
      </div>
    </FormSection>
  );
};

export default TeamMembersForm;
