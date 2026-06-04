import { graphql } from "#/api/generated";
import type {
  CreateWorkspaceInput,
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  GetWorkspaceQuery,
  GetWorkspaceQueryVariables,
  ListWorkspacesQuery,
  MembershipRole,
  MembershipStatus,
} from "#/api/generated/graphql";
import { executeGraphQL } from "#/api/graphql/client";

type CreateWorkspacePayload = NonNullable<
  CreateWorkspaceMutation["createWorkspace"]
>;
type CreatedWorkspace = NonNullable<CreateWorkspacePayload["workspace"]> & {
  id: string;
};

export type CreateWorkspacePayloadInput =
  CreateWorkspaceMutationVariables["data"];
export type CreateWorkspaceResult = Omit<CreateWorkspacePayload, "workspace"> & {
  success: true;
  workspace: CreatedWorkspace;
};
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
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
  };
};
export type WorkspaceDetailCurrentUserMembership = {
  id: string | null;
  role: MembershipRole;
  membershipStatus: MembershipStatus;
};
export type WorkspaceDetail = {
  id: string;
  name: string;
  description: string | null;
  currentUserMembership: WorkspaceDetailCurrentUserMembership | null;
  memberships: WorkspaceDetailMember[];
};

const ListWorkspacesDocument = graphql(`
  query ListWorkspaces {
    workspaces {
      id
      name
      updatedAt
    }
  }
`);

const GetWorkspaceDocument = graphql(`
  query GetWorkspace($id: ID!) {
    workspace(id: $id) {
      id
      name
      description
      currentUserMembership {
        id
        role
        membershipStatus
      }
      memberships {
        id
        role
        membershipStatus
        joinedAt
        updatedAt
        user {
          firstName
          displayName
          email
          id
          lastName
          profilePicture
        }
      }
    }
  }
`);

const CreateWorkspaceDocument = graphql(`
  mutation CreateWorkspace($data: CreateWorkspaceInput!) {
    createWorkspace(data: $data) {
      success
      workspace {
        id
        name
        description
        ownerUserId
        status
        createdAt
        updatedAt
        currentUserMembership {
          id
          role
          membershipStatus
        }
        invitations {
          id
          email
          role
          status
        }
      }
    }
  }
`);

export async function listWorkspaces(): Promise<WorkspaceListItem[]> {
  const data: ListWorkspacesQuery = await executeGraphQL(
    ListWorkspacesDocument,
  );

  return (data.workspaces ?? [])
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

export async function getWorkspace(
  id: GetWorkspaceQueryVariables["id"],
): Promise<WorkspaceDetail> {
  const data: GetWorkspaceQuery = await executeGraphQL(GetWorkspaceDocument, {
    id,
  });
  const workspace = data.workspace;

  if (!workspace?.id || !workspace.name) {
    throw new Error("Workspace was not found");
  }

  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description ?? null,
    currentUserMembership:
      workspace.currentUserMembership?.role &&
      workspace.currentUserMembership.membershipStatus
        ? {
            id: workspace.currentUserMembership.id ?? null,
            role: workspace.currentUserMembership.role,
            membershipStatus: workspace.currentUserMembership.membershipStatus,
          }
        : null,
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
          displayName: membership.user.displayName ?? null,
          firstName: membership.user.firstName ?? null,
          lastName: membership.user.lastName ?? null,
          profilePicture: membership.user.profilePicture ?? null,
        },
      })),
  };
}

export async function createWorkspace(
  payload: CreateWorkspaceInput,
): Promise<CreateWorkspaceResult> {
  const data = await executeGraphQL(CreateWorkspaceDocument, {
    data: payload,
  });

  if (
    !data.createWorkspace?.success ||
    !data.createWorkspace.workspace ||
    !data.createWorkspace.workspace.id
  ) {
    throw new Error("Workspace was not created");
  }

  return {
    ...data.createWorkspace,
    success: true,
    workspace: data.createWorkspace.workspace as CreatedWorkspace,
  };
}
