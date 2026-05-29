import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import logout from "#/lib/logout";

const GetUserError = () => {
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
    <div className="h-dvh w-full flex justify-center items-center">
      <p className="max-w-lg text-lg">
        Error fetching user information. You will be logged out automatically in
        a few seconds. Logging back in may resolve the issue. If the problem
        persists, please contact support.
      </p>
    </div>
  );
};

export default GetUserError;
