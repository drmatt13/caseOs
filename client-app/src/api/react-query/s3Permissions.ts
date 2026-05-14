import { useQuery } from "@tanstack/react-query";
import { getS3Permissions } from "#/api/query-functions/rest/getS3Permissions";
import { logQueryCacheMiss } from "#/api/logging";

export const s3PermissionsQueryKey = ["s3Permissions"] as const;

export function useS3PermissionsQuery() {
  return useQuery({
    queryKey: s3PermissionsQueryKey,
    queryFn: () => {
      logQueryCacheMiss("useS3PermissionsQuery", {
        queryKey: s3PermissionsQueryKey,
      });
      return getS3Permissions();
    },
  });
}
