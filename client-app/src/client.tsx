import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

const app = <StartClient />;

startTransition(() => {
  hydrateRoot(
    document,
    import.meta.env.DEV ? app : <StrictMode>{app}</StrictMode>,
  );
});
