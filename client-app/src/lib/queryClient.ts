import { QueryClient } from "@tanstack/react-query";

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export async function clearReactQueryState(): Promise<void> {
  await appQueryClient.cancelQueries();
  await appQueryClient.invalidateQueries({ refetchType: "none" });
  appQueryClient.clear();
}
