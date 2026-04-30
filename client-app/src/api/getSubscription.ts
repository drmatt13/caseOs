import { userSchema } from "@repo/database/table.schemas";
import { z } from "zod";
import { fetchWithAuthRefresh } from "#/lib/auth";

const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

type Subscription = z.infer<typeof userSchema>;

interface GetSubscriptionResponse {
  subscription: Subscription;
}

export async function getSubscription(): Promise<GetSubscriptionResponse> {
  const res = await fetchWithAuthRefresh(`${API_URL}/get-subscription`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return (await res.json()) as GetSubscriptionResponse;
}
