import { z } from "zod";

export const AwsSessionCredentialsSchema = z.object({
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  sessionToken: z.string(),
  expiration: z.string(),
});

export type AwsSessionCredentials = z.infer<
  typeof AwsSessionCredentialsSchema
>;
