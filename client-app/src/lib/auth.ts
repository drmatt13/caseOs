import { redirect } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import {
  ConfirmSignUpCommand,
  CognitoIdentityProviderClient,
  CognitoIdentityProviderServiceException,
  ResendConfirmationCodeCommand,
  SignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { SignInResponseSchema } from "@repo/database/api.schemas";
import z from "zod";

const API_URL = import.meta.env.VITE_API_GATEWAY_URL;
const COGNITO_DOMAIN_URL = import.meta.env.VITE_COGNITO_DOMAIN;
const USER_POOL_CLIENT_ID = import.meta.env.VITE_USER_POOL_CLIENT_ID;

type AuthState = { authenticated: boolean };
type WebStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

const AUTH_SYNC_STORAGE_KEY = "auth-sync";
const AUTH_SYNC_CHANNEL_NAME = "caseos-auth-sync";
const OAUTH_STATE_STORAGE_KEY = "oauth-state";
const SESSION_HINT_KEY = "has-session";

let clientAuthCache: AuthState | null = null;
let clientAuthRequest: Promise<AuthState> | null = null;
let authSyncInitialized = false;
let authBroadcastChannel: BroadcastChannel | null = null;

const getServerCookieHeader = createIsomorphicFn()
  .client(() => undefined)
  .server(async () => {
    const { getRequest } = await import("@tanstack/react-start/server");
    return getRequest().headers.get("cookie") ?? undefined;
  });

type AuthCacheOptions = {
  broadcast?: boolean;
  rememberSession?: boolean;
};

type OAuthState = {
  rememberMe: boolean;
  state: string;
};

function isBrowserRuntime(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function clearSessionHints(): void {
  if (!isBrowserRuntime()) {
    return;
  }

  try {
    window.localStorage.removeItem(SESSION_HINT_KEY);
  } catch {}

  try {
    window.sessionStorage.removeItem(SESSION_HINT_KEY);
  } catch {}
}

function getSessionHint(): boolean {
  if (!isBrowserRuntime()) {
    return false;
  }

  try {
    if (window.localStorage.getItem(SESSION_HINT_KEY) === "1") {
      return true;
    }
  } catch {}

  try {
    return window.sessionStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function hasPersistentSessionHint(): boolean {
  if (!isBrowserRuntime()) {
    return false;
  }

  try {
    return window.localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function setSessionHint(storage: WebStorage): void {
  storage.setItem(SESSION_HINT_KEY, "1");
}

function getOAuthRedirectUri(): string {
  return `${window.location.origin}/auth/callback`;
}

function getCognitoDomainUrl(): string {
  const domainUrl = String(COGNITO_DOMAIN_URL ?? "").replace(/\/+$/, "");

  if (!domainUrl) {
    throw new Error("Missing VITE_COGNITO_DOMAIN");
  }

  return domainUrl;
}

function generateOAuthState(): string {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function storeOAuthState(state: OAuthState): void {
  window.sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, JSON.stringify(state));
}

function consumeOAuthState(incomingState: string): OAuthState {
  const stored = window.sessionStorage.getItem(OAUTH_STATE_STORAGE_KEY);
  window.sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY);

  if (!stored) {
    throw new Error("Missing OAuth state. Please try signing in again.");
  }

  const parsed = JSON.parse(stored) as Partial<OAuthState>;
  if (parsed.state !== incomingState) {
    throw new Error("OAuth state mismatch. Please try signing in again.");
  }

  return {
    rememberMe: parsed.rememberMe === true,
    state: incomingState,
  };
}

function handleExternalAuthStateChange(reason?: "sign-in" | "sign-out"): void {
  if (reason === "sign-in" && !hasPersistentSessionHint()) {
    try {
      setSessionHint(window.sessionStorage);
    } catch {}
  }

  if (reason === "sign-out") {
    clearSessionHints();
  }

  invalidateAuthCache({ broadcast: false });
}

function broadcastAuthStateChange(reason: "sign-in" | "sign-out"): void {
  if (!isBrowserRuntime()) {
    return;
  }

  const payload = JSON.stringify({ reason, at: Date.now() });

  try {
    window.localStorage.setItem(AUTH_SYNC_STORAGE_KEY, payload);
    window.localStorage.removeItem(AUTH_SYNC_STORAGE_KEY);
  } catch {
    // Ignore storage errors and rely on in-tab cache updates.
  }

  try {
    authBroadcastChannel?.postMessage({ type: "auth-state-changed", reason });
  } catch {
    // Ignore broadcast errors and rely on storage events.
  }
}

function initializeAuthSync(): void {
  if (!isBrowserRuntime() || authSyncInitialized) {
    return;
  }

  authSyncInitialized = true;

  window.addEventListener("storage", (event) => {
    if (event.key === AUTH_SYNC_STORAGE_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue) as {
          reason?: "sign-in" | "sign-out";
        };
        handleExternalAuthStateChange(data.reason);
      } catch {
        handleExternalAuthStateChange();
      }
    }
  });

  if (typeof BroadcastChannel !== "undefined") {
    authBroadcastChannel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME);
    authBroadcastChannel.onmessage = (event: MessageEvent<unknown>) => {
      const data =
        event.data as
          | { reason?: "sign-in" | "sign-out"; type?: string }
          | undefined;
      if (data?.type === "auth-state-changed") {
        handleExternalAuthStateChange(data.reason);
      }
    };
  }
}

export function invalidateAuthCache(options: AuthCacheOptions = {}): void {
  if (options.broadcast) {
    clientAuthCache = { authenticated: false };
    clientAuthRequest = Promise.resolve(clientAuthCache);
    clearSessionHints();
    broadcastAuthStateChange("sign-out");
  } else {
    clientAuthCache = null;
    clientAuthRequest = null;
  }
}

export function primeAuthCache(options: AuthCacheOptions = {}): void {
  const value: AuthState = { authenticated: true };
  clientAuthCache = value;
  clientAuthRequest = Promise.resolve(value);

  try {
    const rememberSession =
      options.rememberSession ?? hasPersistentSessionHint();

    clearSessionHints();
    setSessionHint(
      rememberSession ? window.localStorage : window.sessionStorage,
    );
  } catch {}

  if (options.broadcast) {
    broadcastAuthStateChange("sign-in");
  }
}

async function checkSessionOnServer(): Promise<AuthState> {
  try {
    const cookieHeader = await getServerCookieHeader();

    if (!cookieHeader) {
      return { authenticated: false };
    }

    const response = await fetch(`${API_URL}/verify-user`, {
      method: "GET",
      headers: { cookie: cookieHeader },
      credentials: "include",
    });

    if (response.ok) {
      return { authenticated: true };
    }

    if (response.status === 401 && (await refreshSession(cookieHeader))) {
      return { authenticated: true };
    }

    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

async function checkSessionOnClient(): Promise<AuthState> {
  initializeAuthSync();

  if (clientAuthCache) {
    return clientAuthCache;
  }

  if (clientAuthRequest) {
    return clientAuthRequest;
  }

  const hasSessionHint = getSessionHint();

  if (!hasSessionHint) {
    const noSession: AuthState = { authenticated: false };
    clientAuthCache = noSession;
    clientAuthRequest = Promise.resolve(noSession);
    return noSession;
  }

  clientAuthRequest = (async (): Promise<AuthState> => {
    try {
      const response = await fetch(`${API_URL}/verify-user`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        return { authenticated: true };
      }

      if (response.status === 401 && (await refreshSession())) {
        return { authenticated: true };
      }

      clearSessionHints();
      return { authenticated: false };
    } catch {
      return { authenticated: false };
    }
  })();

  const result = await clientAuthRequest;
  clientAuthCache = result;
  clientAuthRequest = Promise.resolve(result);

  return result;
}

export async function refreshSession(cookieHeader?: string): Promise<boolean> {
  try {
    const headers: HeadersInit = cookieHeader ? { cookie: cookieHeader } : {};
    const response = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers,
      credentials: "include",
    });

    if (response.ok) {
      if (isBrowserRuntime()) {
        primeAuthCache();
      }
      return true;
    }

    if (isBrowserRuntime()) {
      clearSessionHints();
    }

    return false;
  } catch {
    return false;
  }
}

export async function fetchWithAuthRefresh(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const requestInit: RequestInit = {
    ...init,
    credentials: init.credentials ?? "include",
  };

  const response = await fetch(input, requestInit);
  if (response.status !== 401) {
    return response;
  }

  if (!(await refreshSession())) {
    return response;
  }

  return fetch(input, requestInit);
}

export async function checkSession(): Promise<AuthState> {
  if (isBrowserRuntime()) {
    return checkSessionOnClient();
  }
  return checkSessionOnServer();
}

export async function requireAuth(): Promise<void> {
  const { authenticated } = await checkSession();
  if (!authenticated) {
    throw redirect({
      to: "/login",
      replace: true,
      search: { email: undefined, "account-verified": undefined },
    });
  }
}

export async function redirectIfAuthenticated(): Promise<void> {
  const { authenticated } = await checkSession();
  if (authenticated) {
    throw redirect({ to: "/" });
  }
}

const cognitoClient = new CognitoIdentityProviderClient({
  region: import.meta.env.VITE_AWS_REGION,
});

function mapSignUpError(error: unknown): string {
  if (!(error instanceof CognitoIdentityProviderServiceException)) {
    return "Failed to create account.";
  }

  switch (error.name) {
    case "UsernameExistsException":
      return "An account with this email already exists.";
    case "InvalidPasswordException":
      return "Password does not meet Cognito password requirements.";
    case "InvalidParameterException":
      return error.message || "One or more signup fields are invalid.";
    case "NotAuthorizedException":
      if (error.message?.toLowerCase().includes("secret hash")) {
        return "This Cognito app client requires a client secret. Use a public (no-secret) app client for browser signup, or perform signup on your backend.";
      }
      return error.message || "Sign up is not authorized for this app client.";
    default:
      return error.message || "Failed to create account.";
  }
}

export async function signUpUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();

  console.log(import.meta.env.VITE_USER_POOL_CLIENT_ID);

  const command = new SignUpCommand({
    ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    Username: normalizedEmail,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: normalizedEmail,
      },
      {
        Name: "given_name",
        Value: normalizedFirstName,
      },
      {
        Name: "family_name",
        Value: normalizedLastName,
      },
    ],
  });

  try {
    return await cognitoClient.send(command);
  } catch (error) {
    console.error("Raw Cognito signup error:", error);
    throw new Error(mapSignUpError(error));
  }
}

function mapConfirmSignUpError(error: unknown): string {
  if (!(error instanceof CognitoIdentityProviderServiceException)) {
    return "Failed to verify your account.";
  }

  switch (error.name) {
    case "CodeMismatchException":
      return "Invalid verification code. Please try again.";
    case "ExpiredCodeException":
      return "Verification code has expired. Please request a new one.";
    case "TooManyFailedAttemptsException":
      return "Attempt limit exceeded. Please wait a few minutes and try again.";
    case "LimitExceededException":
      return "Attempt limit exceeded. Please request a new code and try again shortly.";
    case "TooManyRequestsException":
      return "Too many requests. Please wait a moment and try again.";
    case "NotAuthorizedException":
      return "Your account is already verified. Please sign in.";
    case "UserNotFoundException":
      return "Account not found. Please register first.";
    default:
      return error.message || "Failed to verify your account.";
  }
}

function mapResendCodeError(error: unknown): string {
  if (!(error instanceof CognitoIdentityProviderServiceException)) {
    return "Failed to resend verification code.";
  }

  switch (error.name) {
    case "TooManyRequestsException":
    case "LimitExceededException":
      return "Too many resend attempts. Please wait a bit before trying again.";
    case "UserNotFoundException":
      return "Account not found. Please register first.";
    default:
      return error.message || "Failed to resend verification code.";
  }
}

export async function confirmSignUpUser(usernameOrEmail: string, code: string) {
  const command = new ConfirmSignUpCommand({
    ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    Username: usernameOrEmail.trim().toLowerCase(),
    ConfirmationCode: code.trim(),
  });

  try {
    return await cognitoClient.send(command);
  } catch (error) {
    console.error("Raw Cognito confirm-signup error:", error);
    throw new Error(mapConfirmSignUpError(error));
  }
}

export async function resendConfirmationCodeUser(usernameOrEmail: string) {
  const command = new ResendConfirmationCodeCommand({
    ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    Username: usernameOrEmail.trim().toLowerCase(),
  });

  try {
    return await cognitoClient.send(command);
  } catch (error) {
    console.error("Raw Cognito resend-code error:", error);
    throw new Error(mapResendCodeError(error));
  }
}

export async function signInUser(
  email: string,
  password: string,
  rememberMe = false,
): Promise<z.infer<typeof SignInResponseSchema>> {
  const response = await fetch(`${API_URL}/sign-in`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      rememberMe,
    }),
  });

  const data: z.infer<typeof SignInResponseSchema> = await response.json();

  if (!response.ok) {
    if (response.status === 403) {
      return {
        success: false,
        error: "USER_NOT_CONFIRMED",
      };
    }
    return { success: false, error: data.error ?? "Sign in failed" };
  }

  primeAuthCache({ broadcast: true, rememberSession: rememberMe });

  return { success: true };
}

export function signInWithGoogle(rememberMe = false): void {
  if (!isBrowserRuntime()) {
    return;
  }

  const state = generateOAuthState();
  storeOAuthState({ rememberMe, state });

  const authorizeUrl = new URL(`${getCognitoDomainUrl()}/oauth2/authorize`);
  authorizeUrl.searchParams.set("client_id", USER_POOL_CLIENT_ID);
  authorizeUrl.searchParams.set("identity_provider", "Google");
  authorizeUrl.searchParams.set("redirect_uri", getOAuthRedirectUri());
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "select_account");

  window.location.assign(authorizeUrl.toString());
}

export async function completeOAuthSignIn(
  code: string,
  state: string,
): Promise<z.infer<typeof SignInResponseSchema>> {
  const oauthState = consumeOAuthState(state);
  const oauthCallbackUrl = `${API_URL}/oauth/callback`;
  const response = await fetch(oauthCallbackUrl, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      redirectUri: getOAuthRedirectUri(),
      rememberMe: oauthState.rememberMe,
    }),
  });

  const responseBody = await response.text();
  let data: z.infer<typeof SignInResponseSchema>;
  try {
    data = JSON.parse(responseBody) as z.infer<typeof SignInResponseSchema>;
  } catch {
    const bodyPreview = responseBody.slice(0, 120);
    return {
      success: false,
      error: `OAuth callback API did not return JSON from ${oauthCallbackUrl}. Restart the frontend/API dev servers and verify VITE_API_GATEWAY_URL. Response started with: ${bodyPreview}`,
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: data.error ?? "Google sign in failed",
    };
  }

  primeAuthCache({
    broadcast: true,
    rememberSession: oauthState.rememberMe,
  });

  return { success: true };
}

export async function forgotPasswordUser(email: string) {
  const command = new ForgotPasswordCommand({
    ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    Username: email.trim().toLowerCase(),
  });

  try {
    return await cognitoClient.send(command);
  } catch (error) {
    if (error instanceof CognitoIdentityProviderServiceException) {
      switch (error.name) {
        case "UserNotFoundException":
          throw new Error(
            "If an account with that email exists, a reset code has been sent.",
          );
        case "LimitExceededException":
        case "TooManyRequestsException":
          throw new Error(
            "Too many attempts. Please wait a bit before trying again.",
          );
        default:
          throw new Error(
            error.message || "Failed to send password reset code.",
          );
      }
    }
    throw new Error("Failed to send password reset code.");
  }
}

export async function confirmForgotPasswordUser(
  email: string,
  code: string,
  newPassword: string,
) {
  const command = new ConfirmForgotPasswordCommand({
    ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    Username: email.trim().toLowerCase(),
    ConfirmationCode: code.trim(),
    Password: newPassword,
  });

  try {
    return await cognitoClient.send(command);
  } catch (error) {
    if (error instanceof CognitoIdentityProviderServiceException) {
      switch (error.name) {
        case "CodeMismatchException":
          throw new Error("Invalid reset code. Please try again.");
        case "ExpiredCodeException":
          throw new Error("Reset code has expired. Please request a new one.");
        case "InvalidPasswordException":
          throw new Error(
            "Password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, and a number.",
          );
        case "LimitExceededException":
        case "TooManyRequestsException":
          throw new Error(
            "Too many attempts. Please wait a bit before trying again.",
          );
        case "UserNotFoundException":
          throw new Error("Account not found. Please register first.");
        default:
          throw new Error(error.message || "Failed to reset password.");
      }
    }
    throw new Error("Failed to reset password.");
  }
}
