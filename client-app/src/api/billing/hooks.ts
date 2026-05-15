import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createSetupIntent,
  createSubscription,
  listBillingProducts,
  type CreateSubscriptionInput,
} from "./operations";

export const billingProductsQueryKey = ["billing-products"] as const;

export function billingSetupIntentQueryKey(tier: string) {
  return ["billing-setup-intent", tier] as const;
}

export function useBillingProductsQuery() {
  return useQuery({
    queryKey: billingProductsQueryKey,
    queryFn: listBillingProducts,
  });
}

export function useBillingSetupIntentQuery(tier: string) {
  const queryKey = billingSetupIntentQueryKey(tier);

  return useQuery({
    queryKey,
    queryFn: createSetupIntent,
    staleTime: 0,
  });
}

export function useCreateSubscriptionMutation() {
  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) => createSubscription(input),
  });
}
