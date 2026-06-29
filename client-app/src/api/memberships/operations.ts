import { graphql } from "#/api/generated";
import type {
  RemoveWorkspaceMemberInput,
  RemoveWorkspaceMemberMutation,
  UpdateWorkspaceMemberRoleInput,
  UpdateWorkspaceMemberRoleMutation,
} from "#/api/generated/graphql";
import { executeGraphQL } from "#/api/graphql/client";

const UpdateWorkspaceMemberRoleDocument = graphql(`
  mutation UpdateWorkspaceMemberRole($data: UpdateWorkspaceMemberRoleInput!) {
    updateWorkspaceMemberRole(data: $data) {
      success
      membership {
        id
        role
        membershipStatus
      }
    }
  }
`);

const RemoveWorkspaceMemberDocument = graphql(`
  mutation RemoveWorkspaceMember($data: RemoveWorkspaceMemberInput!) {
    removeWorkspaceMember(data: $data) {
      success
    }
  }
`);

export async function updateWorkspaceMemberRole(
  data: UpdateWorkspaceMemberRoleInput,
): Promise<void> {
  const result: UpdateWorkspaceMemberRoleMutation = await executeGraphQL(
    UpdateWorkspaceMemberRoleDocument,
    { data },
  );

  if (!result.updateWorkspaceMemberRole?.success) {
    throw new Error("Member role could not be updated");
  }
}

export async function removeWorkspaceMember(
  data: RemoveWorkspaceMemberInput,
): Promise<void> {
  const result: RemoveWorkspaceMemberMutation = await executeGraphQL(
    RemoveWorkspaceMemberDocument,
    { data },
  );

  if (!result.removeWorkspaceMember?.success) {
    throw new Error("Member could not be removed");
  }
}
