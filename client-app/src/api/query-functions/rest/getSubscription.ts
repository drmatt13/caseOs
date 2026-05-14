import type {
  AccountStatus,
  AccountTier,
  SubscriptionStatus,
} from "#/api/generated/graphql";
import { fetchWithAuthRefresh } from "#/lib/auth";

type Subscription = {
  accountTier?: AccountTier | null;
  accountStatus?: AccountStatus | null;
  subscriptionStatus?: SubscriptionStatus | null;
  billingInterval?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
};

interface GetSubscriptionResponse {
  subscription: Subscription;
}

export async function getSubscription(): Promise<GetSubscriptionResponse> {
  const res = await fetchWithAuthRefresh("/get-subscription", {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return (await res.json()) as GetSubscriptionResponse;
}
