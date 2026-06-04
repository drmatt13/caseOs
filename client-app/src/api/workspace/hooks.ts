import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWorkspace,
  getWorkspace,
  listWorkspaces,
  type CreateWorkspacePayloadInput,
  type CreateWorkspaceResult,
  type WorkspaceDetail,
  type WorkspaceListItem,
} from "./operations";

export const workspacesQueryKey = ["workspaces"] as const;

export function workspaceQueryKey(workspaceId: string) {
  return ["workspace", workspaceId] as const;
}

export function useWorkspacesQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: listWorkspaces,
    enabled: options.enabled ?? true,
  });
}

export function useWorkspaceQuery(
  workspaceId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: workspaceQueryKey(workspaceId),
    queryFn: () => getWorkspace(workspaceId),
    enabled: (options.enabled ?? true) && Boolean(workspaceId),
  });
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateWorkspaceResult,
    Error,
    CreateWorkspacePayloadInput
  >({
    mutationFn: createWorkspace,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKey(result.workspace.id),
        }),
      ]);
    },
  });
}

export type {
  CreateWorkspacePayloadInput,
  CreateWorkspaceResult,
  WorkspaceDetail,
  WorkspaceListItem,
};
