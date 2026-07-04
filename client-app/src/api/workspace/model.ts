import type {
  GetWorkspaceQuery,
  ListWorkspacesQuery,
  MembershipRole,
  MembershipStatus,
} from "#/api/generated/graphql";

// Normalized, UI-facing shapes for the workspace queries. Codegen produces
// deeply nullable nested types; these flatten them to exactly the fields the app
// consumes, with the nullability the UI expects. The normalizers below reshape
// raw query data into these types. Mirrors the operations/model/hooks split used
// by currentUser/ (see agents/typed-contract-propagation-agent.md).

export type WorkspaceListItem = {
  id: string;
  name: string;
  updatedAt: string | null;
};

export type WorkspaceDetailMember = {
  id: string;
  role: NonNullable<
    NonNullable<
      NonNullable<GetWorkspaceQuery["workspace"]>["memberships"]
    >[number]["role"]
  >;
  membershipStatus: NonNullable<
    NonNullable<
      NonNullable<GetWorkspaceQuery["workspace"]>["memberships"]
    >[number]["membershipStatus"]
  >;
  joinedAt: string | null;
  updatedAt: string | null;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
  };
};

export type WorkspaceDetailCurrentUserMembership = {
  id: string;
  role: MembershipRole;
  membershipStatus: MembershipStatus;
};

export type WorkspaceDetailInvitation = {
  id: string;
  email: string;
  role: MembershipRole;
  status: NonNullable<
    NonNullable<
      NonNullable<GetWorkspaceQuery["workspace"]>["invitations"]
    >[number]["status"]
  >;
  createdAt: string | null;
};

export type WorkspaceDetail = {
  id: string;
  name: string;
  description: string | null;
  currentUserMembership: WorkspaceDetailCurrentUserMembership;
  memberships: WorkspaceDetailMember[];
  invitations: WorkspaceDetailInvitation[];
};

// Keep only well-formed workspaces, project to the UI shape, and sort most
// recently updated first.
export function normalizeWorkspaceList(
  workspaces: ListWorkspacesQuery["workspaces"],
): WorkspaceListItem[] {
  return (workspaces ?? [])
    .filter(
      (workspace): workspace is NonNullable<typeof workspace> & {
        id: string;
        name: string;
      } => Boolean(workspace?.id && workspace.name),
    )
    .map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      updatedAt: workspace.updatedAt ?? null,
    }))
    .sort((a, b) => {
      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;

      return bTime - aTime;
    });
}

// Reshape a validated workspace (id + name already confirmed present by the
// caller) into the UI detail model, dropping malformed memberships.
export function normalizeWorkspaceDetail(
  workspace: NonNullable<GetWorkspaceQuery["workspace"]> & {
    id: string;
    name: string;
  },
): WorkspaceDetail {
  const currentUserMembership = workspace.currentUserMembership;

  if (
    !currentUserMembership?.id ||
    !currentUserMembership.role ||
    !currentUserMembership.membershipStatus
  ) {
    throw new Error("Current user workspace membership was not found");
  }

  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description ?? null,
    currentUserMembership: {
      id: currentUserMembership.id,
      role: currentUserMembership.role,
      membershipStatus: currentUserMembership.membershipStatus,
    },
    memberships: (workspace.memberships ?? [])
      .filter(
        (membership): membership is NonNullable<typeof membership> & {
          id: string;
          role: WorkspaceDetailMember["role"];
          membershipStatus: WorkspaceDetailMember["membershipStatus"];
          user: NonNullable<typeof membership.user> & { id: string };
        } =>
          Boolean(
            membership?.id &&
              membership.role &&
              membership.membershipStatus &&
              membership.user?.id,
          ),
      )
      .map((membership) => ({
        id: membership.id,
        role: membership.role,
        membershipStatus: membership.membershipStatus,
        joinedAt: membership.joinedAt ?? null,
        updatedAt: membership.updatedAt ?? null,
        user: {
          id: membership.user.id,
          email: membership.user.email ?? null,
          firstName: membership.user.firstName ?? null,
          lastName: membership.user.lastName ?? null,
          profilePicture: membership.user.profilePicture ?? null,
        },
      })),
    invitations: (workspace.invitations ?? [])
      .filter(
        (invitation): invitation is NonNullable<typeof invitation> & {
          id: string;
          email: string;
          role: WorkspaceDetailInvitation["role"];
          status: WorkspaceDetailInvitation["status"];
        } =>
          Boolean(
            invitation?.id &&
              invitation.email &&
              invitation.role &&
              invitation.status,
          ),
      )
      .map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt ?? null,
      })),
  };
}
