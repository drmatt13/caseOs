import { userSchema } from "@repo/database/table.schemas";
import { z } from "zod";
import { fetchWithAuthRefresh } from "#/lib/auth";

const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

type User = z.infer<typeof userSchema>;

interface GetUserResponse {
  user: User;
  idToken: string;
}

export async function getUser(): Promise<GetUserResponse> {
  const res = await fetchWithAuthRefresh(`${API_URL}/get-user`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return (await res.json()) as GetUserResponse;
}
