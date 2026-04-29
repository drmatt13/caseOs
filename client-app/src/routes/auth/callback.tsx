import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import LoginLayout from "#/components/layouts/LoginLayout";
import { completeOAuthSignIn, redirectIfAuthenticated } from "#/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  beforeLoad: redirectIfAuthenticated,
  validateSearch: (search) => ({
    code: typeof search.code === "string" ? search.code : "",
    error: typeof search.error === "string" ? search.error : "",
    error_description:
      typeof search.error_description === "string"
        ? search.error_description
        : "",
    state: typeof search.state === "string" ? search.state : "",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { code, error, error_description: errorDescription, state } =
    Route.useSearch();
  const [message, setMessage] = useState("Completing Google sign in...");

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      if (error) {
        setMessage(errorDescription || error);
        return;
      }

      if (!code || !state) {
        setMessage("Missing Google sign-in response. Please try again.");
        return;
      }

      try {
        const result = await completeOAuthSignIn(code, state);

        if (!active) {
          return;
        }

        if (!result.success) {
          setMessage(result.error ?? "Google sign in failed.");
          return;
        }

        await navigate({ to: "/", replace: true });
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setMessage(
          caughtError instanceof Error
            ? caughtError.message
            : "Google sign in failed.",
        );
      }
    }

    void completeSignIn();

    return () => {
      active = false;
    };
  }, [code, error, errorDescription, navigate, state]);

  return (
    <LoginLayout>
      <div className="flex flex-col w-sm">
        <div className="flex flex-col px-5 pt-8 pb-5 mb-8 border-mist-400 shadow-md rounded-2xl bg-white">
          <p className="text-[1.7rem] font-bold">Google sign in</p>
          <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {message}
          </p>
        </div>
      </div>
    </LoginLayout>
  );
}
