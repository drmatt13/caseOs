import { z } from "zod";

export const SignInResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  idToken: z.string().optional(),
  accessToken: z.string().optional(),
});
