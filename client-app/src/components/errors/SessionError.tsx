import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import logout from "#/lib/logout";

// Session/auth failure ONLY: the current-user query failed or returned no user,
// so we can't trust the session. Logs out and redirects to /login after a short
// delay. Do NOT use this for resource/data-loading failures (workspace, case,
// invitation, billing, ...) — those use PageError and must never log out.
const SessionError = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutTimer = window.setTimeout(() => {
      void (async () => {
        await logout();
        await navigate({
          to: "/login",
          replace: true,
          search: { email: undefined, "account-verified": undefined },
        });
      })();
    }, 4000);
    return () => window.clearTimeout(logoutTimer);
  }, [navigate]);

  return (
    <div className="h-dvh w-full flex justify-center items-center px-6 text-center">
      <p className="max-w-lg text-lg">
        We couldn't verify your session. You'll be logged out automatically in a
        few seconds. Logging back in may resolve the issue. If the problem
        persists, please contact support.
      </p>
    </div>
  );
};

export default SessionError;
