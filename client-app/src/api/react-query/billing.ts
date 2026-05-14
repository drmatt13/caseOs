import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createSetupIntent,
  createSubscription,
  listBillingProducts,
  type CreateSubscriptionInput,
} from "#/api/query-functions/rest/billing";
import { logMutationInvocation, logQueryCacheMiss } from "#/api/logging";

export const billingProductsQueryKey = ["billing-products"] as const;

export function billingSetupIntentQueryKey(tier: string) {
  return ["billing-setup-intent", tier] as const;
}

export function useBillingProductsQuery() {
  return useQuery({
    queryKey: billingProductsQueryKey,
    queryFn: () => {
      logQueryCacheMiss("useBillingProductsQuery", {
        queryKey: billingProductsQueryKey,
      });
      return listBillingProducts();
    },
  });
}

export function useBillingSetupIntentQuery(tier: string) {
  const queryKey = billingSetupIntentQueryKey(tier);

  return useQuery({
    queryKey,
    queryFn: () => {
      logQueryCacheMiss("useBillingSetupIntentQuery", { queryKey, tier });
      return createSetupIntent();
    },
    staleTime: 0,
  });
}

export function useCreateSubscriptionMutation() {
  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) => {
      logMutationInvocation("useCreateSubscriptionMutation", input);
      return createSubscription(input);
    },
  });
}
