import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  type GetCurrentUserResult,
} from "#/api/query-functions/graphql/getCurrentUser";
import {
  updateUser,
  type UpdateUserPayload,
  type UpdateUserResult,
} from "#/api/query-functions/graphql/updateUser";
import { logMutationInvocation, logQueryCacheMiss } from "#/api/logging";

export const currentUserQueryKey = ["user"] as const;

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: () => {
      logQueryCacheMiss("useCurrentUserQuery", {
        queryKey: currentUserQueryKey,
      });
      return getCurrentUser();
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateUserResult, Error, UpdateUserPayload>({
    mutationFn: (payload) => {
      logMutationInvocation("useUpdateUserMutation", payload);
      return updateUser(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}

export type { GetCurrentUserResult, UpdateUserPayload, UpdateUserResult };
