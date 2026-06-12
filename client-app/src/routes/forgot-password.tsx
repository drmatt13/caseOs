import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import Button from "#/components/Button";
import LoginLayout from "#/components/layouts/LoginLayout";

import {
  redirectIfAuthenticated,
  forgotPasswordUser,
  confirmForgotPasswordUser,
} from "#/lib/auth";

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number.";

export const Route = createFileRoute("/forgot-password")({
  beforeLoad: redirectIfAuthenticated,
  validateSearch: (search) => ({
    email: (search.email as string) || "",
    code: (search.code as string) || "",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { email: emailFromUrl, code: codeFromUrl } = Route.useSearch();

  const [step, setStep] = useState<"request" | "reset">(
    codeFromUrl ? "reset" : "request",
  );
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState(codeFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    setSuccessMessage(null);

    try {
      await forgotPasswordUser(email.trim());
      setSuccessMessage(
        `If an account exists for ${email.trim()}, a reset code has been sent.`,
      );
      setStep("reset");
    } catch (error) {
      // For security, don't reveal if user exists
      setSuccessMessage(
        `If an account exists for ${email.trim()}, a reset code has been sent.`,
      );
      setStep("reset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSuccessMessage(null);

    if (!code.trim()) {
      setStatus("Please enter the reset code.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      setStatus(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmForgotPasswordUser(email.trim(), code.trim(), newPassword);
      setSuccessMessage(
        "Password reset successfully. Redirecting to sign in...",
      );
      setStatus(null);
      setTimeout(() => {
        navigate({
          to: "/login",
          search: {
            email: email.trim().toLowerCase(),
            "account-verified": undefined,
          },
        });
      }, 1500);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to reset password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginLayout>
      <div className="flex flex-col w-full max-w-84">
        <div className="flex flex-col px-5 pt-8 pb-5 rounded-2xl bg-white/40 backdrop-blur-sm border border-black/15 shadow-md">
          <p className="text-[1.7rem] font-bold">Reset your password</p>
          <p className="mt-0.5 text-md text-gray-600">
            {step === "request"
              ? "Enter your email and we'll send you a reset code"
              : "Enter the code and your new password"}
          </p>

          {successMessage && (
            <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-md text-green-800">
              {successMessage}
            </p>
          )}

          {status && (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-md text-red-800">
              {status}
            </p>
          )}

          {step === "request" && (
            <form onSubmit={handleRequestReset}>
              <label
                htmlFor="forgot-password-email"
                className="text-md font-medium mt-5 mb-1.5 block"
              >
                Email
              </label>
              <input
                type="email"
                id="forgot-password-email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md px-2 py-2.5 mb-3 text-sm bg-gray-100 border border-black/15 outline-none transition-colors focus:border-black/40"
                placeholder="name@firm.com"
              />
              <div className="mt-1" />
              <Button
                submit={true}
                text={isSubmitting ? "Sending..." : "Send reset code"}
                fullWidth={true}
                style="primary"
                disabled={isSubmitting}
              />
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword}>
              <label
                htmlFor="reset-email"
                className="text-md font-medium mt-5 mb-1.5 block"
              >
                Email
              </label>
              <input
                type="email"
                id="reset-email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md px-2 py-2.5 text-sm bg-gray-100 border border-black/15 outline-none transition-colors focus:border-black/40"
                placeholder="name@firm.com"
              />
              <label
                htmlFor="reset-code"
                className="text-md font-medium mt-3 mb-1.5 block"
              >
                Reset code
              </label>
              <input
                type="text"
                id="reset-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-md px-2 py-2.5 text-sm bg-gray-100 border border-black/15 outline-none transition-colors focus:border-black/40"
                placeholder="Enter 6-digit code"
              />
              <label
                htmlFor="reset-new-password"
                className="text-md font-medium mt-3 mb-1.5 block"
              >
                New password
              </label>
              <input
                type="password"
                id="reset-new-password"
                autoComplete="new-password"
                required
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
                title={PASSWORD_POLICY_MESSAGE}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md px-2 py-2.5 text-sm bg-gray-100 border border-black/15 outline-none transition-colors focus:border-black/40"
                placeholder="••••••••"
              />
              <label
                htmlFor="reset-confirm-password"
                className="text-md font-medium mt-3 mb-1.5 block"
              >
                Confirm new password
              </label>
              <input
                type="password"
                id="reset-confirm-password"
                autoComplete="new-password"
                required
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
                title={PASSWORD_POLICY_MESSAGE}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md px-2 py-2.5 mb-3 text-sm bg-gray-100 border border-black/15 outline-none transition-colors focus:border-black/40"
                placeholder="••••••••"
              />
              <div className="mt-1" />
              <Button
                submit={true}
                text={isSubmitting ? "Resetting..." : "Reset password"}
                fullWidth={true}
                style="primary"
                disabled={isSubmitting}
              />
              <div className="mt-3 text-center w-full">
                <Button
                  text="Resend reset code"
                  style="secondary"
                  fullWidth={true}
                  onClick={() => {
                    setStep("request");
                    setCode("");
                    setStatus(null);
                    setSuccessMessage(null);
                  }}
                />
              </div>
            </form>
          )}

          <div className="mt-4 text-md text-gray-500 flex w-full justify-center">
            <p>
              Remember your password?{" "}
              <Link
                to="/login"
                search={{
                  "account-verified": undefined,
                  email: undefined,
                }}
                className="text-blue-600 hover:underline"
              >
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </LoginLayout>
  );
}
