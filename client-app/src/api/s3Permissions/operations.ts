import { z } from "zod";
import { AwsSessionCredentialsSchema } from "#/schemas/awsSessionCredentials";
import { fetchWithAuthRefresh } from "#/lib/auth";

// Typed GraphQL documents for this feature's operations.
const GetS3PermissionsResponseSchema = z.object({
  aws: AwsSessionCredentialsSchema,
  bucketArn: z.string(),
  bucketName: z.string(),
  profilePictureKey: z.string(),
  profilePictureUrl: z.string(),
});

// API operations consumed by hooks and other feature callers.
export async function getS3Permissions() {
  const res = await fetchWithAuthRefresh("/s3-access-broker", {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return GetS3PermissionsResponseSchema.safeParse(await res.json());
}
