import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import LoginLayout from "#/components/layouts/LoginLayout";
import { confirmSignUpUser } from "#/lib/auth";

export const Route = createFileRoute("/verify-account")({
  component: RouteComponent,
  validateSearch: (search) => ({
    code: (search.code as string) || "",
    email: (search.email as string) || "",
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { code, email } = Route.useSearch();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your account...");

  useEffect(() => {
    if (!code || !email) {
      setStatus("error");
      setMessage(
        "Missing verification details. Please use the link from your email.",
      );
      return;
    }

    const verify = async () => {
      console.log("CODE", String(code));
      console.log("EMAIL", email);

      try {
        await confirmSignUpUser(email, String(code));
        setStatus("success");
        setMessage("Your account is verified. Redirecting to sign in...");
        setTimeout(() => {
          navigate({ to: "/login" });
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
  }, [code, email, navigate]);

  return (
    <LoginLayout>
      <div className="flex flex-col w-md">
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
              <p>
                Return to{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  register
                </Link>{" "}
                or go to{" "}
                <Link to="/login" className="text-blue-600 hover:underline">
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
