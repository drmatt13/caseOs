import { Link, createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: DefaultNotFound,
  });

  return router;
}

function DefaultNotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <p className="font-serif text-2xl">Not found</p>
        <p className="mt-2 text-sm text-gray-600">
          This page does not exist or is no longer available.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-md border border-black/15 bg-white px-3 py-2 text-sm transition hover:bg-black/5"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
