import { useState } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import Button from "#/components/Button";
import LoginLayout from "#/components/layouts/LoginLayout";

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

  return (
    <>
      <LoginLayout>
        <div className="flex flex-col w-md">
          <div
            id="register-form"
            className="flex flex-col px-5 pt-8 pb-5 border-mist-400 shadow-md rounded-2xl bg-white"
          >
            <p className="text-3xl font-bold">Create your account</p>
            <p className="mt-1 text-sm text-gray-600">
              Get started with your workspace
            </p>
            <label
              htmlFor="register-email"
              className="text-sm font-medium mt-5 mb-1.5"
            >
              Email
            </label>
            <input
              type="email"
              id="register-email"
              autoComplete="email"
              autoFocus
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
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
            {/* <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-black/15" />
              <span className="px-3 text-xs text-gray-500">
                or continue with
              </span>
              <div className="flex-1 h-px bg-black/15" />
            </div>

            <button
              type="button"
              className="w-full rounded-md border border-black/15 bg-white py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Continue with Google
            </button> */}
          </div>
        </div>
      </LoginLayout>
    </>
  );
}
