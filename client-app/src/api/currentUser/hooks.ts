import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  updateUser,
  type UpdateUserPayload,
  type UpdateUserResult,
} from "./operations";
import type { GetCurrentUserResult } from "./model";

export const currentUserQueryKey = ["user"] as const;

export function useCurrentUserQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled: options.enabled ?? true,
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateUserResult, Error, UpdateUserPayload>({
    mutationFn: updateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}

export type { GetCurrentUserResult, UpdateUserPayload, UpdateUserResult };
