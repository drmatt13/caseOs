import { useState } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import Button from "#/components/Button";
import LoginLayout from "#/components/layouts/LoginLayout";

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

  return (
    <>
      <LoginLayout>
        <div className="flex flex-col w-sm">
          <div
            id="forgot-password-form"
            className="flex flex-col px-5 pt-8 pb-5 border-mist-400 shadow-md rounded-2xl bg-white"
          >
            <p className="text-[1.7rem] font-bold">Reset your password</p>
            <p className="mt-0.5 text-sm text-gray-600">
              Enter your email and we'll send you reset instructions
            </p>
            <label
              htmlFor="forgot-password-email"
              className="text-sm font-medium mt-5 mb-1.5"
            >
              Email
            </label>
            <input
              type="email"
              id="forgot-password-email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md px-2 py-2.5 mb-3 text-xs bg-gray-100 border border-black/15"
              placeholder="name@firm.com"
            />
            {status && (
              <p className="text-sm text-red-600 mt-1 mb-2">{status}</p>
            )}
            {/* <div className="mt-2"> */}
            <div className="mt-1" />
            <Button
              submit={true}
              text="Send reset instructions"
              style="primary"
            />
            {/* </div> */}
            <div className="mt-4 text-gray-500 flex w-full justify-center">
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
    </>
  );
}
