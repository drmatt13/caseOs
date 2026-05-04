import { z } from "zod";
import { fetchWithAuthRefresh } from "#/lib/auth";
import { AwsSessionCredentialsSchema } from "#/schemas/awsSessionCredentials";

const GetS3PermissionsResponseSchema = z.object({
  aws: AwsSessionCredentialsSchema,
  bucketArn: z.string(),
  bucketName: z.string(),
  profilePictureKey: z.string(),
  profilePictureUrl: z.string(),
});

export async function getS3Permissions() {
  const res = await fetchWithAuthRefresh("/s3-access-broker", {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return GetS3PermissionsResponseSchema.safeParse(await res.json());
}
