import { userSchema } from "@repo/database/table.schemas";
import { z } from "zod";
import { fetchWithAuthRefresh } from "#/lib/auth";

const GetUserResponseSchema = z.object({
  user: userSchema,
  idToken: z.string(),
});

function addProfilePictureCacheVersion(
  profilePicture: string | null,
  updatedAt: Date,
) {
  if (!profilePicture) return profilePicture;

  try {
    const profilePictureUrl = new URL(profilePicture);
    profilePictureUrl.searchParams.set("v", updatedAt.toISOString());
    return profilePictureUrl.toString();
  } catch {
    return profilePicture;
  }
}

export async function getUser() {
  const res = await fetchWithAuthRefresh("/get-user", {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const parsed = GetUserResponseSchema.safeParse(await res.json());

  if (!parsed.success) return parsed;

  return {
    success: true,
    data: {
      ...parsed.data,
      user: {
        ...parsed.data.user,
        profilePicture: addProfilePictureCacheVersion(
          parsed.data.user.profilePicture,
          parsed.data.user.updatedAt,
        ),
      },
    },
  };
}
