import { graphql } from "#/api/generated";
import type {
  CreateWorkspaceInput,
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  GetWorkspaceQuery,
  GetWorkspaceQueryVariables,
  ListWorkspacesQuery,
} from "#/api/generated/graphql";
import { executeGraphQL } from "#/api/graphql/client";
import {
  normalizeWorkspaceDetail,
  normalizeWorkspaceList,
  type WorkspaceDetail,
  type WorkspaceListItem,
} from "./model";

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

// Entity types and their normalizers live in ./model (the operations/model/hooks
// split). Re-exported here so existing `./operations` importers keep working.
export type { WorkspaceDetail, WorkspaceListItem };

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

  return normalizeWorkspaceList(data.workspaces);
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

  return normalizeWorkspaceDetail(workspace);
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
