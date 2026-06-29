import { FormSection } from "#/components/features/create-workspace/fields";
import type { CreateWorkspaceForm } from "#/components/features/create-workspace/workspaceForm";
import {
  emailPattern,
  InviteEntryRow,
  InvitePendingRow,
} from "#/components/features/invite-members/InviteMembersFields";

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
      <InviteEntryRow
        email={workspace.pendingInviteEmail}
        role={workspace.pendingInviteRole}
        onEmailChange={(value) => onFieldChange("pendingInviteEmail", value)}
        onRoleChange={(value) => onFieldChange("pendingInviteRole", value)}
        onAdd={addInvite}
        canAdd={canAddInvite}
      />
      <div className="flex flex-col gap-2">
        {workspace.invites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-black/55">
            No team members added yet. You can skip this and invite people
            later.
          </div>
        ) : (
          workspace.invites.map((invite, index) => (
            <InvitePendingRow
              key={`${invite.email}-${index}`}
              email={invite.email}
              role={invite.role}
              onRemove={() => removeInvite(index)}
            />
          ))
        )}
      </div>
    </FormSection>
  );
};

export default TeamMembersForm;
