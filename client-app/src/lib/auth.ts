import { redirect } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import {
  ConfirmSignUpCommand,
  CognitoIdentityProviderClient,
  CognitoIdentityProviderServiceException,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { SignInResponseSchema } from "@repo/database/src/api.schemas";
import z from "zod";

const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

type AuthState = { authenticated: boolean };

const AUTH_SYNC_STORAGE_KEY = "caseos:auth-sync";
const AUTH_SYNC_CHANNEL_NAME = "caseos-auth-sync";

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
};

function isBrowserRuntime(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
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
      invalidateAuthCache({ broadcast: false });
    }
  });

  if (typeof BroadcastChannel !== "undefined") {
    authBroadcastChannel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME);
    authBroadcastChannel.onmessage = (event: MessageEvent<unknown>) => {
      const data = event.data as { type?: string } | undefined;
      if (data?.type === "auth-state-changed") {
        invalidateAuthCache({ broadcast: false });
      }
    };
  }
}

export function invalidateAuthCache(options: AuthCacheOptions = {}): void {
  clientAuthCache = null;
  clientAuthRequest = null;

  if (options.broadcast) {
    broadcastAuthStateChange("sign-out");
  }
}

export function primeAuthCache(options: AuthCacheOptions = {}): void {
  const value: AuthState = { authenticated: true };
  clientAuthCache = value;
  clientAuthRequest = Promise.resolve(value);

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
    });

    if (response.ok) {
      return { authenticated: true };
    }

    if (response.status === 401) {
      const refreshResponse = await fetch(`${API_URL}/refresh`, {
        method: "POST",
        headers: { cookie: cookieHeader },
      });
      if (refreshResponse.ok) {
        return { authenticated: true };
      }
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

  clientAuthRequest = (async (): Promise<AuthState> => {
    try {
      const response = await fetch(`${API_URL}/verify-user`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        return { authenticated: true };
      }

      if (response.status === 401) {
        const refreshResponse = await fetch(`${API_URL}/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (refreshResponse.ok) {
          return { authenticated: true };
        }
      }

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
): Promise<z.infer<typeof SignInResponseSchema>> {
  const response = await fetch(`${API_URL}/sign-in`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const data: z.infer<typeof SignInResponseSchema> = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error ?? "Sign in failed" };
  }

  primeAuthCache({ broadcast: true });

  return { success: true };
}
