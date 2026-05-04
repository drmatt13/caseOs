import { userSchema } from "@repo/database/table.schemas";
import { z } from "zod";
import { fetchWithAuthRefresh } from "#/lib/auth";

export const updateUserResponseSchema = z.object({
  success: z.literal(true),
  user: userSchema,
});

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  profilePicture?: string | null;
};

export async function updateUser(payload: UpdateUserPayload) {
  const res = await fetchWithAuthRefresh("/update-user", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return updateUserResponseSchema.safeParse(await res.json());
}
