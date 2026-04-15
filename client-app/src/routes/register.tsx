import { useState } from "react";
import type { SubmitEvent } from "react";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import Button from "#/components/Button";
import LoginLayout from "#/components/layouts/LoginLayout";

import { verifyUser, signUpUser } from "#/lib/auth";

const MIN_NAME_LENGTH = 2;
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number.";

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
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setStatus("First and last name are required.");
      return;
    }

    if (
      trimmedFirstName.length < MIN_NAME_LENGTH ||
      trimmedLastName.length < MIN_NAME_LENGTH
    ) {
      setStatus(
        `First and last name must be at least ${MIN_NAME_LENGTH} characters.`,
      );
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    if (!PASSWORD_POLICY_REGEX.test(password)) {
      setStatus(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setStatus(null);
    try {
      await signUpUser(
        email.trim(),
        password,
        trimmedFirstName,
        trimmedLastName,
      );
      alert(
        `Account created successfully. Please confirm your account using the verification email sent to ${email.trim()} before signing in.`,
      );
      await navigate({
        to: "/login",
        search: { email: undefined, "account-verified": undefined },
      });
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to create account.",
      );
    }
  };

  return (
    <>
      <LoginLayout>
        <div className="flex flex-col w-sm">
          <form
            id="register-form"
            onSubmit={handleSubmit}
            className="flex flex-col px-5 pt-8 pb-5 border-mist-400 shadow-md rounded-2xl bg-white"
          >
            <p className="text-[1.7rem] font-bold">Create your account</p>
            <p className="mt-0.5 text-sm text-gray-600">
              Get started with your workspace
            </p>
            <label
              htmlFor="register-first-name"
              className="text-sm font-medium mt-5 mb-1.5"
            >
              First name
            </label>
            <input
              type="text"
              id="register-first-name"
              autoComplete="given-name"
              autoFocus
              required
              minLength={MIN_NAME_LENGTH}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-md px-2 py-2.5 text-xs bg-gray-100 border border-black/15"
              placeholder="Jane"
            />
            <label
              htmlFor="register-last-name"
              className="text-sm font-medium mt-3 mb-1.5"
            >
              Last name
            </label>
            <input
              type="text"
              id="register-last-name"
              autoComplete="family-name"
              required
              minLength={MIN_NAME_LENGTH}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-md px-2 py-2.5 text-xs bg-gray-100 border border-black/15"
              placeholder="Doe"
            />
            <label
              htmlFor="register-email"
              className="text-sm font-medium mt-3 mb-1.5"
            >
              Email
            </label>
            <input
              type="email"
              id="register-email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md px-2 py-2.5 text-xs bg-gray-100 border border-black/15"
              placeholder="name@firm.com"
            />
            <label
              htmlFor="register-password"
              className="text-sm font-medium mt-3 mb-1.5"
            >
              Password
            </label>
            <input
              type="password"
              id="register-password"
              autoComplete="new-password"
              required
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
              title={PASSWORD_POLICY_MESSAGE}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md px-2 py-2.5 text-xs bg-gray-100 border border-black/15"
              placeholder="••••••••"
            />
            <label
              htmlFor="register-confirm-password"
              className="text-sm font-medium mt-3 mb-1.5"
            >
              Confirm password
            </label>
            <input
              type="password"
              id="register-confirm-password"
              autoComplete="new-password"
              required
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
              title={PASSWORD_POLICY_MESSAGE}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-md px-2 py-2.5 mb-3 text-xs bg-gray-100 border border-black/15"
              placeholder="••••••••"
            />
            {status && (
              <p className="text-sm text-red-600 mt-1 mb-2">{status}</p>
            )}
            {/* <div className="mt-2 w-full"> */}
            <div className="mt-2 w-full" />
            <Button submit={true} text="Create account" style="primary" />
            {/* </div> */}
            <div className="mt-4 text-gray-500 flex w-full justify-center">
              <p>
                Already have an account?{" "}
                <Link
                  to="/login"
                  search={{ email: undefined, "account-verified": undefined }}
                  className="text-blue-600 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </LoginLayout>
    </>
  );
}
