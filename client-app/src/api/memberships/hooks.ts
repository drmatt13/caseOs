import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  RemoveWorkspaceMemberInput,
  UpdateWorkspaceMemberRoleInput,
} from "#/api/generated/graphql";
import { workspaceQueryKey } from "#/api/workspace/hooks";
import {
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "./operations";

// Changes an accepted member's role; refreshes the workspace so the members list
// in the Manage Members modal reflects the new role.
export function useUpdateWorkspaceMemberRoleMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateWorkspaceMemberRoleInput>({
    mutationFn: updateWorkspaceMemberRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKey(workspaceId),
      });
    },
  });
}

// Removes an accepted member (soft-delete on the server); refreshes the
// workspace so the removed member drops out of the members list.
export function useRemoveWorkspaceMemberMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RemoveWorkspaceMemberInput>({
    mutationFn: removeWorkspaceMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKey(workspaceId),
      });
    },
  });
}
