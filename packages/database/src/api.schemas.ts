import { z } from "zod";
// import { userSchema } from "./table.schemas";

export const SignInResponseSchema = z.object({
  success: z.boolean(),
  // user: userSchema.optional(),
  error: z.string().optional(),
});
