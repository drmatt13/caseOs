import { useContext, useState } from "react";
import { XIcon } from "lucide-react";

import type { MembershipRole } from "#/api/generated/graphql";
import { AppModalContext } from "#/context/AppModalContext";
import {
  emailPattern,
  InviteEntryRow,
  InvitePendingRow,
  RoleDescriptions,
} from "#/components/features/invite-members/InviteMembersFields";
import { useWorkspaceQuery } from "#/api/workspace/hooks";
import {
  useInviteWorkspaceMemberMutation,
  useRevokeInvitationMutation,
} from "#/api/invitations/hooks";

const OnboardMembersModal = () => {
  const { modalWorkspaceId, requestCloseModal } = useContext(AppModalContext);
  const workspaceId = modalWorkspaceId ?? "";

  const { data: workspace } = useWorkspaceQuery(workspaceId, {
    enabled: Boolean(workspaceId),
  });
  const inviteMutation = useInviteWorkspaceMemberMutation(workspaceId);
  const revokeMutation = useRevokeInvitationMutation(workspaceId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("CONTRIBUTOR");

  const trimmedEmail = email.trim();
  const pendingInvitations = (workspace?.invitations ?? []).filter(
    (invitation) => invitation.status === "PENDING",
  );
  const takenEmails = new Set<string>([
    ...pendingInvitations.map((invitation) => invitation.email.toLowerCase()),
    ...(workspace?.memberships ?? [])
      .map((member) => member.user.email?.toLowerCase())
      .filter((value): value is string => Boolean(value)),
  ]);
  const isDuplicate = takenEmails.has(trimmedEmail.toLowerCase());
  const canInvite =
    emailPattern.test(trimmedEmail) &&
    !isDuplicate &&
    !inviteMutation.isPending;

  const handleInvite = async () => {
    if (!canInvite) {
      return;
    }

    await inviteMutation.mutateAsync({
      workspaceId,
      email: trimmedEmail.toLowerCase(),
      role,
    });
    setEmail("");
  };

  return (
    <div className="w-2xl max-w-[calc(100vw-3rem)] p-1 text-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-lg">Onboard Members</p>
          <p className="mt-0.5 truncate text-black/60">
            Invite people to {workspace?.name ?? "this workspace"}.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close modal"
          onClick={requestCloseModal}
          className="cursor-pointer rounded-lg p-1.5 transition-colors duration-150 ease-in hover:bg-black/15 hover:duration-100 hover:ease-out"
        >
          <XIcon className="h-5 w-5 text-black" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <RoleDescriptions size="sm" />

        <InviteEntryRow
          size="sm"
          email={email}
          role={role}
          onEmailChange={setEmail}
          onRoleChange={setRole}
          onAdd={() => {
            void handleInvite();
          }}
          canAdd={canInvite}
          addLabel="Send Invite"
          isSubmitting={inviteMutation.isPending}
        />

        {isDuplicate && trimmedEmail.length > 0 && (
          <p className="text-sm text-amber-700">
            That email is already a member or has a pending invitation.
          </p>
        )}
        {inviteMutation.error && (
          <p className="text-sm text-red-700">
            {inviteMutation.error.message}
          </p>
        )}
        {revokeMutation.error && (
          <p className="text-sm text-red-700">
            {revokeMutation.error.message}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-md font-medium">
            Pending Invitations ({pendingInvitations.length})
          </p>
          {pendingInvitations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-black/55">
              No pending invitations.
            </div>
          ) : (
            pendingInvitations.map((invitation) => (
              <InvitePendingRow
                key={invitation.id}
                size="sm"
                email={invitation.email}
                role={invitation.role}
                onRemove={() => revokeMutation.mutate(invitation.id)}
                isRemoving={
                  revokeMutation.isPending &&
                  revokeMutation.variables === invitation.id
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardMembersModal;
