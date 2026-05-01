import { userSchema } from "@repo/database/table.schemas";
import { z } from "zod";
import { fetchWithAuthRefresh } from "#/lib/auth";

const GetUserResponseSchema = z.object({
  user: userSchema,
  idToken: z.string(),
});

export async function getUser() {
  const res = await fetchWithAuthRefresh("/get-user", {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return GetUserResponseSchema.safeParse(await res.json());
}
