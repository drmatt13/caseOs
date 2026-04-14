import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import Button from "#/components/Button";
import LoginLayout from "#/components/layouts/LoginLayout";

import { verifyUser } from "#/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { user } = await verifyUser();
    if (user) throw redirect({ to: "/" });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <>
      <LoginLayout>
        <div className="flex flex-col w-md">
          <div
            id="login-form"
            className="flex flex-col px-5 pt-8 pb-5 border-mist-400 shadow-md rounded-2xl bg-white"
          >
            <p className="text-[1.7rem] font-bold">Welcome back</p>
            <p className="mt-0.5 text-sm text-gray-600">
              Sign in to your workspace
            </p>
            <label htmlFor="email" className="text-sm font-medium mt-5 mb-1.5">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md px-2 py-2.5 text-xs bg-gray-100 border border-black/15"
              placeholder="name@firm.com"
            />
            <label
              htmlFor="password"
              className="text-sm font-medium mt-3 mb-1.5"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md px-2 py-2.5 mb-3 text-xs bg-gray-100 border border-black/15"
              placeholder="••••••••"
            />
            <div className="flex items-center justify-between mt-2 mb-4">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRememberMe(e.target.checked)
                  }
                  className="mr-2 w-4 h-4 rounded border-black/15"
                  aria-label="Remember me"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button submit={true} text="Login" style="primary" />
            {/* dont have an account? register now */}
            <div className="mt-4 text-gray-500 flex w-full justify-center">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Register now
                </Link>
              </p>
            </div>
            <div className="flex items-center my-4">
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
            </button>
          </div>
        </div>
      </LoginLayout>
    </>
  );
}
