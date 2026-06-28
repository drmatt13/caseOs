import type {
  MembershipRole,
  MyWorkspaceInvitationsQuery,
} from "#/api/generated/graphql";

// Normalized, UI-facing shape for an invitation addressed to the current user.
// Mirrors the operations/model/hooks split used by workspace/ and currentUser/.
export type MyInvitation = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  role: MembershipRole;
  invitedByName: string | null;
  expiresAt: string | null;
};

export type AcceptInvitationResult = {
  workspaceId: string;
  workspaceName: string;
};

function resolveInviterName(
  invitedBy: NonNullable<
    MyWorkspaceInvitationsQuery["myWorkspaceInvitations"]
  >[number]["invitedBy"],
): string | null {
  if (!invitedBy) {
    return null;
  }

  if (invitedBy.displayName) {
    return invitedBy.displayName;
  }

  const fullName = [invitedBy.firstName, invitedBy.lastName]
    .filter((part) => Boolean(part && part.trim()))
    .join(" ")
    .trim();

  return fullName || invitedBy.email || null;
}

// Keep only well-formed invitations (workspace + role present) and project to
// the UI shape.
export function normalizeMyInvitations(
  invitations: MyWorkspaceInvitationsQuery["myWorkspaceInvitations"],
): MyInvitation[] {
  return (invitations ?? [])
    .filter(
      (invitation): invitation is NonNullable<typeof invitation> & {
        id: string;
        role: MembershipRole;
        workspace: { id: string; name: string };
      } =>
        Boolean(
          invitation?.id &&
            invitation.role &&
            invitation.workspace?.id &&
            invitation.workspace.name,
        ),
    )
    .map((invitation) => ({
      id: invitation.id,
      workspaceId: invitation.workspace.id,
      workspaceName: invitation.workspace.name,
      role: invitation.role,
      invitedByName: resolveInviterName(invitation.invitedBy),
      expiresAt: invitation.expiresAt ?? null,
    }));
}
