import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InviteWorkspaceMemberInput } from "#/api/generated/graphql";
import {
  workspaceQueryKey,
  workspacesQueryKey,
} from "#/api/workspace/hooks";
import {
  acceptInvitation,
  declineInvitation,
  getMyInvitations,
  inviteWorkspaceMember,
  revokeInvitation,
  type MyInvitation,
} from "./operations";
import type { AcceptInvitationResult } from "./model";

export const myInvitationsQueryKey = ["my-invitations"] as const;

export function useMyInvitationsQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: myInvitationsQueryKey,
    queryFn: getMyInvitations,
    enabled: options.enabled ?? true,
  });
}

// Invites a member into an existing workspace; refreshes that workspace's
// pending-invitation list shown in the Onboard Members modal.
export function useInviteWorkspaceMemberMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, InviteWorkspaceMemberInput>({
    mutationFn: inviteWorkspaceMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKey(workspaceId),
      });
    },
  });
}

// Revokes a pending invitation; refreshes that workspace's pending-invitation
// list shown in the Onboard Members modal.
export function useRevokeInvitationMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: revokeInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKey(workspaceId),
      });
    },
  });
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation<AcceptInvitationResult, Error, string>({
    mutationFn: acceptInvitation,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: myInvitationsQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKey(result.workspaceId),
        }),
      ]);
    },
  });
}

export function useDeclineInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: declineInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myInvitationsQueryKey });
    },
  });
}

export type { MyInvitation };
