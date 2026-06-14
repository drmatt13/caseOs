import { XIcon } from "lucide-react";
import Button from "#/components/ui/Button";
import WorkspaceRoleBadge from "#/components/ui/WorkspaceRoleBadge";
import {
  FormSection,
  SelectField,
  TextInputField,
} from "#/components/features/create-workspace/fields";
import {
  workspaceRoleOptions,
  type CreateWorkspaceForm,
} from "#/components/features/create-workspace/workspaceForm";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const pendingInviteEmail = workspace.pendingInviteEmail.trim();
  const pendingInviteEmailKey = pendingInviteEmail.toLowerCase();
  const hasDuplicateInvite = workspace.invites.some(
    (invite) => invite.email.toLowerCase() === pendingInviteEmailKey,
  );
  const canAddInvite =
    emailPattern.test(pendingInviteEmail) && !hasDuplicateInvite;

  const addInvite = () => {
    if (!canAddInvite) {
      return;
    }

    onFieldChange("invites", [
      ...workspace.invites,
      { email: pendingInviteEmail, role: workspace.pendingInviteRole },
    ]);
    onFieldChange("pendingInviteEmail", "");
  };

  const removeInvite = (inviteIndex: number) => {
    onFieldChange(
      "invites",
      workspace.invites.filter((_, index) => index !== inviteIndex),
    );
  };

  return (
    <FormSection
      title="Team Members"
      description="Invite users and assign starter roles."
      icon="users"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-end">
        <TextInputField
          label="Invite Users"
          value={workspace.pendingInviteEmail}
          type="email"
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
          className="sm:self-end"
        />
        <Button
          text="Add"
          style="secondary"
          onClick={addInvite}
          disabled={!canAddInvite}
          minWidth="sm"
        />
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
              className="flex items-center justify-between rounded-xl bg-white/50 border border-black/10 px-3 py-2 text-sm"
            >
              <span className="truncate">{invite.email}</span>
              <div className="flex shrink-0 items-center gap-2">
                <WorkspaceRoleBadge role={invite.role} />
                <button
                  type="button"
                  aria-label={`Remove ${invite.email}`}
                  title={`Remove ${invite.email}`}
                  className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
                  onClick={() => removeInvite(index)}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </FormSection>
  );
};

export default TeamMembersForm;
