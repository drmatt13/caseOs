import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Network, ShieldCheck } from "lucide-react";

import { verifyUser } from "#/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { user } = await verifyUser();
    if (user) throw redirect({ to: "/" });
  },
  component: RouteComponent,
});

const inputClass =
  "w-full border-b border-black/[0.06] bg-transparent pb-2.5 text-[0.92rem] text-[#1a1f22] outline-none transition-colors duration-200 placeholder:text-black/15 focus:border-black/25";

function RouteComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setStatus("Enter your work email and password to continue.");
      return;
    }
    setStatus(
      "Authentication service connection is the next integration step. The sign-in experience is ready for production wiring.",
    );
  };

  return (
    <div className="font-geist flex min-h-dvh flex-col md:h-dvh md:flex-row md:overflow-hidden">
      {/* ─── Brand panel ─── */}
      <div className="relative flex shrink-0 flex-col justify-between bg-[#161c1f] px-6 pb-6 pt-8 text-white md:w-1/2 md:px-10 md:py-10 lg:w-[53%] lg:px-14 xl:px-20">
        <div className="pointer-events-none absolute left-[10%] top-[22%] h-64 w-64 rounded-full bg-mist-500/6 blur-[100px]" />

        <div className="relative z-10">
          <div className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-white/40">
            Agent-Driven Case Management
          </div>
          <p className="mt-4 font-bj-cree text-[1.7rem] tracking-[0.01em] md:mt-5 md:text-[2.2rem] lg:text-[2.55rem]">
            CaseOS
          </p>
        </div>

        <div className="relative z-10 mt-5 max-w-lg md:mt-auto md:mb-auto">
          <p className="text-[1.08rem] font-semibold leading-[1.18] tracking-[-0.02em] text-white/88 md:text-[1.42rem] lg:text-[1.65rem]">
            A living case workspace that keeps strategy, facts, posture, and
            evidence in sync.
          </p>
          <p className="mt-2.5 hidden max-w-md text-[0.86rem] leading-[1.65] text-white/38 md:block">
            Turns fragmented intake, documents, and case data into a persistent
            operating system for legal work. Agents continuously extract,
            organize, and update what matters.
          </p>
        </div>

        <div className="relative z-10 mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.68rem] tracking-wide text-white/22 md:mt-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            Enterprise-grade security
          </span>
          <span className="flex items-center gap-1.5">
            <BrainCircuit className="h-3 w-3" />
            LLM-powered agents
          </span>
          <span className="flex items-center gap-1.5">
            <Network className="h-3 w-3" />
            Linked intelligence
          </span>
        </div>

        {/* mobile: vertical gradient bleed into form */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent to-[#f6f4ef] md:hidden" />
      </div>

      {/* ─── Form panel ─── */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-[#f6f4ef] px-6 py-10 md:px-10 md:py-0 lg:px-16">
        {/* desktop: horizontal gradient bleed from brand panel */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-20 bg-gradient-to-r from-[#161c1f] to-transparent md:block lg:w-28" />

        <div className="relative z-10 w-full max-w-sm">
          <h1 className="text-[1.5rem] font-semibold leading-none tracking-[-0.04em] text-[#1a1f22] md:text-[1.75rem]">
            Sign in
          </h1>
          <p className="mt-2 text-[0.86rem] text-black/38">
            Access your case workspace
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-1.5 block text-[0.76rem] font-medium text-black/45"
                htmlFor="login-email"
              >
                Email
              </label>
              <input
                autoComplete="email"
                autoFocus
                className={inputClass}
                id="login-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firm.com"
                type="email"
                value={email}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  className="text-[0.76rem] font-medium text-black/45"
                  htmlFor="login-password"
                >
                  Password
                </label>
                <Link
                  className="text-[0.68rem] font-medium text-black/28 transition hover:text-black/50"
                  to="/forgot-password"
                >
                  Forgot?
                </Link>
              </div>
              <input
                autoComplete="current-password"
                className={inputClass}
                id="login-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                value={password}
              />
            </div>

            {status ? (
              <p className="text-[0.82rem] leading-5 text-black/42">{status}</p>
            ) : null}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2024] py-3 text-[0.87rem] font-medium text-white transition hover:bg-[#0d1114]"
              type="submit"
            >
              Continue
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <p className="mt-8 text-center text-[0.8rem] text-black/28">
            New to CaseOS?{" "}
            <Link
              className="font-medium text-black/50 transition hover:text-black"
              to="/register"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
