import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import LoginLayout from "#/components/layouts/LoginLayout";
import { confirmSignUpUser, resendConfirmationCodeUser } from "#/lib/auth";

export const Route = createFileRoute("/verify-account")({
  component: RouteComponent,
  validateSearch: (search) => ({
    code: (search.code as string) || "",
    email: (search.email as string) || "",
    username: (search.username as string) || "",
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { code, email, username } = Route.useSearch();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your account...");
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    const signInIdentifier = username.trim() || email.trim().toLowerCase();

    if (!code || !signInIdentifier) {
      setStatus("error");
      setMessage(
        "Missing verification details. Please use the link from your email.",
      );
      return;
    }

    const verify = async () => {
      try {
        await confirmSignUpUser(signInIdentifier, String(code));
        setStatus("success");
        setMessage("Your account is verified. Redirecting to sign in...");
        setTimeout(() => {
          navigate({
            to: "/login",
            replace: true,
            search: { email, "account-verified": true },
          });
        }, 1500);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to verify your account.",
        );
      }
    };

    void verify();
  }, [code, email, navigate, username]);

  const handleResendCode = async () => {
    const signInIdentifier = username.trim() || email.trim().toLowerCase();
    if (!signInIdentifier) {
      setResendStatus(
        "Unable to resend code because account identifier is missing.",
      );
      return;
    }

    setResendStatus("Resending verification code...");
    try {
      await resendConfirmationCodeUser(signInIdentifier);
      setResendStatus(`A new verification code was sent to ${email}.`);
    } catch (error) {
      setResendStatus(
        error instanceof Error
          ? error.message
          : "Failed to resend verification code.",
      );
    }
  };

  return (
    <LoginLayout>
      <div className="flex flex-col w-sm">
        <div className="flex flex-col px-5 pt-8 pb-5 border-mist-400 shadow-md rounded-2xl bg-white">
          <p className="text-[1.7rem] font-bold">Verify your account</p>
          <p
            className={`mt-2 text-sm ${
              status === "error"
                ? "text-red-600"
                : status === "success"
                  ? "text-green-700"
                  : "text-gray-700"
            }`}
          >
            {message}
          </p>
          {status === "error" && (
            <div className="mt-4 text-sm text-gray-600">
              <button
                type="button"
                onClick={handleResendCode}
                className="mb-2 text-blue-600 hover:underline"
              >
                Resend verification code
              </button>
              {resendStatus && <p className="mb-2">{resendStatus}</p>}
              <p>
                Return to{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  register
                </Link>{" "}
                or go to{" "}
                <Link
                  to="/login"
                  search={{ email: undefined, "account-verified": undefined }}
                  className="text-blue-600 hover:underline"
                >
                  login
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </LoginLayout>
  );
}
