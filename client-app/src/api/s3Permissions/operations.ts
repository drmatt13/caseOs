import { z } from "zod";
import { API_ROUTE } from "@repo/api-contract";
import { AwsSessionCredentialsSchema } from "#/schemas/awsSessionCredentials";
import { fetchWithAuthRefresh } from "#/lib/auth";

const GetProfilePhotoUploadCredentialsResponseSchema = z.object({
  aws: AwsSessionCredentialsSchema,
  bucketArn: z.string(),
  bucketName: z.string(),
  profilePictureKey: z.string(),
  profilePictureUrl: z.string(),
});

export async function getProfilePhotoUploadCredentials() {
  const res = await fetchWithAuthRefresh(
    API_ROUTE.profilePhotoUploadCredentialBroker,
    {
      method: "GET",
    },
  );

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return GetProfilePhotoUploadCredentialsResponseSchema.safeParse(
    await res.json(),
  );
}
