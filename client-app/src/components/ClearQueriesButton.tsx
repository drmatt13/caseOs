import { useCallback, useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppModalContext } from "#/context/AppModalContext";

export default function ClearQueriesButton() {
  const providerQueryClient = useQueryClient();
  const { clearModal } = useContext(AppModalContext);

  const clearQueriesAndReload = useCallback(async () => {
    clearModal();

    await providerQueryClient.cancelQueries();
    providerQueryClient.removeQueries();
    providerQueryClient.clear();

    console.debug("Cleared all queries from QueryClient.\n");
  }, [clearModal, providerQueryClient]);

  return (
    <button
      type="button"
      onClick={clearQueriesAndReload}
      className="fixed bottom-4 right-4 z-99999 rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs text-neutral-800 shadow-lg transition hover:bg-neutral-50 active:translate-y-px"
    >
      {"ueryClient.clear()"}
    </button>
  );
}
