import { useQuery } from "@tanstack/react-query";
import { getProfilePhotoUploadCredentials } from "./operations";

export const profilePhotoUploadCredentialsQueryKey = [
  "profilePhotoUploadCredentials",
] as const;

export function useProfilePhotoUploadCredentialsQuery() {
  return useQuery({
    queryKey: profilePhotoUploadCredentialsQueryKey,
    queryFn: getProfilePhotoUploadCredentials,
  });
}
