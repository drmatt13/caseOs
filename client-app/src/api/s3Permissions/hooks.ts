import { useQuery } from "@tanstack/react-query";
import { getS3Permissions } from "./operations";

export const s3PermissionsQueryKey = ["s3Permissions"] as const;

export function useS3PermissionsQuery() {
  return useQuery({
    queryKey: s3PermissionsQueryKey,
    queryFn: getS3Permissions,
  });
}
