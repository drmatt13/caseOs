import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import AuthPageShell, {
  AuthField,
  authInputClassName,
} from "#/components/layouts/auth/AuthPageShell";
import { verifyUser } from "#/lib/auth";

export const Route = createFileRoute("/forgot-password")({
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
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("Enter the email associated with your account.");
      return;
    }

    setStatus(
      "Password recovery delivery will be connected in the authentication integration pass.",
    );
  };

  return (
    <AuthPageShell
      description="Recover access to your CaseOS workspace and resume work with the current case record, linked evidence, and continuously updated strategy context."
      eyebrow="Recovery"
      footer={
        <>
          Remembered your credentials?{" "}
          <Link
            className="font-medium text-black underline underline-offset-4"
            to="/login"
          >
            Return to sign in
          </Link>
        </>
      }
      formId="forgot-password-form"
      helper="Use the same email associated with your CaseOS account."
      onSubmit={handleSubmit}
      status={status}
      submitLabel="Send reset instructions"
      title="Restore workspace access"
    >
      <AuthField
        description="Enter the email where password recovery instructions should be delivered."
        htmlFor="forgot-password-email"
        label="Work email"
      >
        <input
          autoComplete="email"
          autoFocus
          className={authInputClassName}
          id="forgot-password-email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </AuthField>
    </AuthPageShell>
  );
}
