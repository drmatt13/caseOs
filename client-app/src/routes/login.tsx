import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, KeyRound } from "lucide-react";
import Button from "#/components/ui/Button";
import LoginLayout from "#/components/layouts/LoginLayout";
import { SSO_PROVIDERS_UI } from "#/components/auth/ssoProviders";
import type { SsoProviderUi } from "#/components/auth/ssoProviders";

import {
  signInUser,
  redirectIfAuthenticated,
  signInWithProvider,
  signInWithOrgSso,
  isSsoProviderEnabled,
  discoverOrgSso,
} from "#/lib/auth";
import type { SsoProviderId } from "#/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectIfAuthenticated,
  validateSearch: (search) => {
    const email = typeof search.email === "string" ? search.email : undefined;
    const accountVerified =
      search["account-verified"] === true ||
      search["account-verified"] === "true";

    return {
      email,
      "account-verified": accountVerified ? true : undefined,
    };
  },
  component: RouteComponent,
});

type LoginView = "password" | "providers" | "org";

const VIEW_ORDER: Record<LoginView, number> = {
  password: 0,
  providers: 1,
  org: 2,
};

const SSO_BUTTON_CLASS =
  "flex w-full items-center justify-center gap-2 rounded-md border border-black/15 bg-white/90 py-2.5 text-md font-medium hover:bg-gray-50 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white/90";

function SsoActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={SSO_BUTTON_CLASS}
    >
      {icon}
      {label}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 self-start text-md text-black/60 hover:text-black cursor-pointer transition-colors"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back
    </button>
  );
}

function LabeledDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center my-4">
      <div className="flex-1 h-px bg-black/15" />
      <span className="px-3 text-sm text-gray-500">{label}</span>
      <div className="flex-1 h-px bg-black/15" />
    </div>
  );
}

function StatusBanners({
  notice,
  error,
}: {
  notice: string | null;
  error: string | null;
}) {
  return (
    <>
      {notice && (
        <p
          role="status"
          className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-md text-blue-800"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-md text-red-800"
        >
          {error}
        </p>
      )}
    </>
  );
}

function RouteComponent() {
  const { email: userEmail, "account-verified": accountVerified } =
    Route.useSearch();
  const navigate = useNavigate();

  const [view, setView] = useState<LoginView>("password");
  const directionRef = useRef<"forward" | "back" | null>(null);
  const headingRef = useRef<HTMLParagraphElement | null>(null);

  const [email, setEmail] = useState(userEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [redirectingProvider, setRedirectingProvider] =
    useState<SsoProviderId | null>(null);
  const [orgEmail, setOrgEmail] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);

  function goToView(next: LoginView) {
    directionRef.current =
      VIEW_ORDER[next] > VIEW_ORDER[view] ? "forward" : "back";
    setError(null);
    setNotice(null);
    setView(next);
  }

  useEffect(() => {
    // null means initial page load: no swap happened, don't steal focus.
    if (directionRef.current === null) {
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [view]);

  const viewAnimationClass =
    directionRef.current === null
      ? "flex flex-col"
      : `flex flex-col motion-reduce:animate-none ${
          directionRef.current === "forward"
            ? "animate-view-forward"
            : "animate-view-back"
        }`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signInUser(email, password, rememberMe);

      if (!result.success) {
        if (result.error === "USER_NOT_CONFIRMED") {
          await navigate({
            to: "/verify-account",
            search: {
              email: email.trim().toLowerCase(),
              username: email.trim().toLowerCase(),
              code: "",
            },
          });
          return;
        }
        setError(result.error ?? "Sign in failed");
        return;
      }

      await navigate({ to: "/" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleProviderClick(provider: SsoProviderUi) {
    setError(null);
    setNotice(null);

    if (!isSsoProviderEnabled(provider.id)) {
      setNotice(`${provider.name} sign-in isn't available yet.`);
      return;
    }

    if (redirectingProvider) {
      return;
    }

    setRedirectingProvider(provider.id);
    try {
      signInWithProvider(provider.id, rememberMe);
    } catch {
      setRedirectingProvider(null);
      setError(`${provider.name} sign-in is not configured yet.`);
    }
  }

  async function handleOrgSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = orgEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid work email.");
      return;
    }

    setIsDiscovering(true);
    try {
      const discovery = await discoverOrgSso(trimmedEmail);
      if (!discovery) {
        setNotice(
          `Single sign-on isn't enabled for ${trimmedEmail.split("@")[1]} yet. Organization sign-on is coming as part of the Enterprise plan.`,
        );
        return;
      }
      signInWithOrgSso(discovery.idpIdentifier, rememberMe);
    } catch {
      setError("Organization sign-in is not configured yet.");
    } finally {
      setIsDiscovering(false);
    }
  }

  return (
    <LoginLayout>
      <div className="flex flex-col w-full max-w-84">
        <div className="px-5 pt-8 pb-5 rounded-2xl bg-white/40 backdrop-blur-sm border border-black/15 shadow-md">
          <div key={view} className={viewAnimationClass}>
            {view === "password" && (
              <form
                onSubmit={handleSubmit}
                id="login-form"
                className="flex flex-col"
              >
                <p
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-[1.7rem] font-bold outline-none"
                >
                  Welcome back
                </p>
                <p className="mt-0.5 text-md text-gray-600">
                  Sign in to your workspace
                </p>
                {accountVerified && (
                  <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-md text-green-800">
                    Account verified successfully. You can sign in now.
                  </p>
                )}
                <StatusBanners notice={notice} error={error} />
                <label
                  htmlFor="email"
                  className="text-md font-medium mt-5 mb-1.5"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md px-2 py-2.5 text-sm bg-gray-100 border border-black/15 outline-none transition-colors focus:border-black/40"
                  placeholder="name@firm.com"
                />
                <label
                  htmlFor="password"
                  className="text-md font-medium mt-3 mb-1.5"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-md px-2 py-2.5 mb-3 text-sm bg-gray-100 border border-black/15 outline-none transition-colors focus:border-black/40"
                  placeholder="••••••••"
                />
                <div className="flex items-center justify-between mt-2 mb-4">
                  <label className="flex items-center text-md">
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
                    search={{ email: "", code: "" }}
                    className="text-md text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button
                  submit={true}
                  text={isSubmitting ? "Signing in..." : "Login"}
                  style="primary"
                  disabled={isSubmitting}
                />
                {/* dont have an account? register now */}
                <div className="mt-4 text-md text-gray-500 flex w-full justify-center">
                  <p>
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="text-blue-600 hover:underline"
                    >
                      Register now
                    </Link>
                  </p>
                </div>
                <LabeledDivider label="or" />
                <SsoActionButton
                  icon={
                    <KeyRound
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                  }
                  label="Continue with single sign-on"
                  onClick={() => goToView("providers")}
                />
              </form>
            )}

            {view === "providers" && (
              <div className="flex flex-col">
                <BackButton onClick={() => goToView("password")} />
                <p
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-3 text-[1.7rem] font-bold outline-none"
                >
                  Choose a provider
                </p>
                <p className="mt-0.5 text-md text-gray-600">
                  Sign in with your identity provider.
                </p>
                <StatusBanners notice={notice} error={error} />
                <div className="flex flex-col gap-2.5 mt-5">
                  {SSO_PROVIDERS_UI.map((provider) => (
                    <SsoActionButton
                      key={provider.id}
                      icon={<provider.Icon />}
                      label={provider.label}
                      onClick={() => handleProviderClick(provider)}
                      disabled={redirectingProvider !== null}
                    />
                  ))}
                </div>
                <LabeledDivider label="enterprise" />
                <SsoActionButton
                  icon={
                    <Building2
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                  }
                  label="Continue with your organization"
                  onClick={() => goToView("org")}
                  disabled={redirectingProvider !== null}
                />
                <p className="mt-2 text-center text-sm text-black/50">
                  SAML 2.0 · OIDC
                </p>
              </div>
            )}

            {view === "org" && (
              // noValidate: the inline banner owns email validation; the
              // native bubble clashes with the card and accepts TLD-less domains.
              <form
                onSubmit={handleOrgSubmit}
                noValidate
                className="flex flex-col"
              >
                <BackButton onClick={() => goToView("providers")} />
                <p
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-3 text-[1.7rem] font-bold outline-none"
                >
                  Sign in to your organization
                </p>
                <p className="mt-0.5 text-md text-gray-600">
                  Enter your work email and we'll route you to your identity
                  provider.
                </p>
                <StatusBanners notice={notice} error={error} />
                <label
                  htmlFor="org-email"
                  className="text-md font-medium mt-5 mb-1.5"
                >
                  Work email
                </label>
                <input
                  type="email"
                  id="org-email"
                  value={orgEmail}
                  autoComplete="email"
                  onChange={(e) => setOrgEmail(e.target.value)}
                  className="rounded-md px-2 py-2.5 mb-4 text-sm bg-gray-100 border border-black/15 outline-none transition-colors focus:border-black/40"
                  placeholder="name@firm.com"
                />
                <Button
                  submit={true}
                  text={isDiscovering ? "Checking..." : "Continue"}
                  style="primary"
                  disabled={isDiscovering}
                />
              </form>
            )}
          </div>
        </div>
      </div>
    </LoginLayout>
  );
}
