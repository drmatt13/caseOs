import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import AuthPageShell, {
  AuthField,
  authInputClassName,
} from "#/components/layouts/auth/AuthPageShell";
import { verifyUser } from "#/lib/auth";

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    const { user } = await verifyUser();
    if (user) {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setStatus("Complete all fields before continuing.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords must match before account creation can proceed.");
      return;
    }

    setStatus(
      "Account creation flow is prepared for authentication service integration.",
    );
  };

  return (
    <AuthPageShell
      description="Create access to a workspace that turns fragmented case material into a persistent, linked system for strategy, analysis, and execution."
      eyebrow="Account Setup"
      footer={
        <>
          Already have access?{" "}
          <Link
            className="font-medium text-black underline underline-offset-4"
            to="/login"
          >
            Sign in
          </Link>
        </>
      }
      formId="register-form"
      helper="Your account will anchor access to documents, workspace state, and agent-driven case updates."
      onSubmit={handleSubmit}
      status={status}
      submitLabel="Create your CaseOS account"
      title="Start your CaseOS workspace"
    >
      <AuthField
        description="This email becomes your primary CaseOS sign-in identity."
        htmlFor="register-email"
        label="Work email"
      >
        <input
          autoComplete="email"
          autoFocus
          className={authInputClassName}
          id="register-email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </AuthField>

      <AuthField
        description="Choose a password for secure workspace access."
        htmlFor="register-password"
        label="Password"
      >
        <input
          autoComplete="new-password"
          className={authInputClassName}
          id="register-password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </AuthField>

      <AuthField
        description="Repeat the password exactly to confirm the account setup."
        htmlFor="register-confirm-password"
        label="Confirm password"
      >
        <input
          autoComplete="new-password"
          className={authInputClassName}
          id="register-confirm-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          value={confirmPassword}
        />
      </AuthField>
    </AuthPageShell>
  );
}
