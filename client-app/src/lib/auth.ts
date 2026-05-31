import { redirect } from "@tanstack/react-router";
import {
  ConfirmSignUpCommand,
  CognitoIdentityProviderClient,
  CognitoIdentityProviderServiceException,
  ResendConfirmationCodeCommand,
  SignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { API_ROUTE, API_ROUTES, type ApiRoute } from "@repo/api-contract";
import { SignInResponseSchema } from "@repo/database/api.schemas";

export { API_ROUTE, API_ROUTES };
export type { ApiRoute };

const API_URL = import.meta.env.VITE_API_GATEWAY_URL;
const AWS_REGION = import.meta.env.VITE_AWS_REGION;
const USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID;
const COGNITO_DOMAIN_URL = import.meta.env.VITE_COGNITO_DOMAIN;
const USER_POOL_CLIENT_ID = import.meta.env.VITE_USER_POOL_CLIENT_ID;
const ID_TOKEN_EXPIRY_SKEW_SECONDS = 30;

type ApiRouteInput = ApiRoute | `${ApiRoute}?${string}`;
type AbsoluteUrl = `${"http" | "https"}://${string}`;
type FetchWithAuthRefreshInput = ApiRouteInput | AbsoluteUrl | URL | Request;

type AuthState = { authenticated: boolean };
type WebStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;
type SignInResponse = {
  success: boolean;
  error?: string;
  idToken?: string;
  accessToken?: string;
};

const AUTH_SYNC_STORAGE_KEY = "auth-sync";
const AUTH_SYNC_CHANNEL_NAME = "caseos-auth-sync";
const OAUTH_STATE_STORAGE_KEY = "oauth-state";
const SESSION_HINT_KEY = "has-session";
const ID_TOKEN_STORAGE_KEY = "auth-id-token";
const ACCESS_TOKEN_STORAGE_KEY = "auth-access-token";

let clientAuthCache: AuthState | null = null;
let clientAuthRequest: Promise<AuthState> | null = null;
let authSyncInitialized = false;
let authBroadcastChannel: BroadcastChannel | null = null;
const oauthSignInRequests = new Map<
  string,
  Promise<SignInResponse>
>();

type AuthCacheOptions = {
  broadcast?: boolean;
  rememberSession?: boolean;
};

type OAuthState = {
  rememberMe: boolean;
  state: string;
};

type CognitoIdTokenClaims = {
  aud?: unknown;
  exp?: unknown;
  iss?: unknown;
  sub?: unknown;
  token_use?: unknown;
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
    window.localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {}

  try {
    window.sessionStorage.removeItem(SESSION_HINT_KEY);
    window.sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {}
}

function clearOnlySessionHints(): void {
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

function getStoredIdToken(): string | null {
  if (!isBrowserRuntime()) {
    return null;
  }

  try {
    const persistentToken = window.localStorage.getItem(ID_TOKEN_STORAGE_KEY);
    if (persistentToken) {
      return persistentToken;
    }
  } catch {}

  try {
    return window.sessionStorage.getItem(ID_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function decodeJwtPayload(idToken: string): CognitoIdTokenClaims | null {
  if (!isBrowserRuntime()) {
    return null;
  }

  const [, payloadSegment] = idToken.split(".");
  if (!payloadSegment) {
    return null;
  }

  try {
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as CognitoIdTokenClaims;
  } catch {
    return null;
  }
}

function getExpectedIssuer(): string | null {
  if (!AWS_REGION || !USER_POOL_ID) {
    return null;
  }

  return `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;
}

function hasExpectedAudience(audience: unknown): boolean {
  if (!USER_POOL_CLIENT_ID) {
    return false;
  }

  if (typeof audience === "string") {
    return audience === USER_POOL_CLIENT_ID;
  }

  return (
    Array.isArray(audience) &&
    audience.some((value) => value === USER_POOL_CLIENT_ID)
  );
}

function validateStoredIdToken(idToken: string | null): boolean {
  if (!idToken) {
    return false;
  }

  const payload = decodeJwtPayload(idToken);
  if (!payload) {
    return false;
  }

  const expectedIssuer = getExpectedIssuer();
  const nowSeconds = Math.floor(Date.now() / 1000);

  return (
    payload.token_use === "id" &&
    typeof payload.sub === "string" &&
    payload.sub.length > 0 &&
    typeof payload.exp === "number" &&
    payload.exp > nowSeconds + ID_TOKEN_EXPIRY_SKEW_SECONDS &&
    hasExpectedAudience(payload.aud) &&
    (!expectedIssuer || payload.iss === expectedIssuer)
  );
}

function getValidStoredIdToken(): string | null {
  const idToken = getStoredIdToken();
  return validateStoredIdToken(idToken) ? idToken : null;
}

function storeAuthTokens(
  data: { idToken?: string; accessToken?: string },
  rememberSession: boolean,
): void {
  if (!isBrowserRuntime() || !data.idToken) {
    return;
  }

  clearSessionHints();

  const storage = rememberSession ? window.localStorage : window.sessionStorage;
  setSessionHint(storage);
  storage.setItem(ID_TOKEN_STORAGE_KEY, data.idToken);

  if (data.accessToken) {
    storage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.accessToken);
  }
}

function parseSignInResponse(data: unknown): SignInResponse {
  return SignInResponseSchema.parse(data);
}

function withAuthorizationHeader(
  init: RequestInit = {},
  options: { idToken?: string | null; replace?: boolean } = {},
): RequestInit {
  const headers = new Headers(init.headers);
  const idToken =
    options.idToken === undefined ? getValidStoredIdToken() : options.idToken;

  if (options.replace) {
    headers.delete("Authorization");
  }

  if (idToken) {
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  return {
    ...init,
    headers,
  };
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

function getApiUrl(): string {
  const apiUrl = String(API_URL ?? "").replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error("Missing VITE_API_GATEWAY_URL");
  }

  return apiUrl;
}

function getApiRequestInput(
  input: FetchWithAuthRefreshInput,
): string | URL | Request {
  if (typeof input !== "string") {
    return input;
  }

  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }

  return `${getApiUrl()}${input}`;
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
      const data = event.data as
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

    clearOnlySessionHints();
    setSessionHint(
      rememberSession ? window.localStorage : window.sessionStorage,
    );
  } catch {}

  if (options.broadcast) {
    broadcastAuthStateChange("sign-in");
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
    clientAuthCache = { authenticated: false };
    clientAuthRequest = Promise.resolve(clientAuthCache);
    return clientAuthCache;
  }

  clientAuthRequest = (async (): Promise<AuthState> => {
    try {
      const response = await fetchWithAuthRefresh(API_ROUTE.verifySession, {
        method: "GET",
      });

      if (response.ok) {
        if (!hasSessionHint) {
          try {
            setSessionHint(window.sessionStorage);
          } catch {}
        }

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
  if (!cookieHeader && isBrowserRuntime() && !getSessionHint()) {
    return false;
  }

  try {
    const headers: HeadersInit = cookieHeader ? { cookie: cookieHeader } : {};
    const response = await fetch(`${getApiUrl()}${API_ROUTE.refresh}`, {
      method: "POST",
      headers,
      credentials: "include",
    });

    if (response.ok) {
      try {
        const data = parseSignInResponse(await response.clone().json());
        if (data.idToken) {
          storeAuthTokens(data, hasPersistentSessionHint());
        }
      } catch {}

      if (isBrowserRuntime()) {
        primeAuthCache();
      }
      return true;
    }

    if (isBrowserRuntime()) {
      invalidateAuthCache({ broadcast: true });
    }

    return false;
  } catch {
    if (isBrowserRuntime()) {
      invalidateAuthCache({ broadcast: true });
    }

    return false;
  }
}

export async function fetchWithAuthRefresh(
  input: FetchWithAuthRefreshInput,
  init: RequestInit = {},
): Promise<Response> {
  const requestInput = getApiRequestInput(input);
  let idToken = getValidStoredIdToken();
  let refreshedBeforeRequest = false;

  if (!idToken) {
    refreshedBeforeRequest = await refreshSession();
    idToken = getValidStoredIdToken();
  }

  let requestInit: RequestInit = withAuthorizationHeader({
    ...init,
    credentials: init.credentials ?? "include",
  }, {
    idToken,
    replace: true,
  });

  const response = await fetch(requestInput, requestInit);
  if (response.status !== 401) {
    return response;
  }

  if (refreshedBeforeRequest || !(await refreshSession())) {
    return response;
  }

  requestInit = withAuthorizationHeader(requestInit, {
    idToken: getValidStoredIdToken(),
    replace: true,
  });
  return fetch(requestInput, requestInit);
}

export async function checkSession(): Promise<AuthState> {
  if (!isBrowserRuntime()) {
    return { authenticated: false };
  }

  return checkSessionOnClient();
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
  region: AWS_REGION,
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

  const command = new SignUpCommand({
    ClientId: USER_POOL_CLIENT_ID,
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
    ClientId: USER_POOL_CLIENT_ID,
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
    ClientId: USER_POOL_CLIENT_ID,
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
): Promise<SignInResponse> {
  const response = await fetch(`${getApiUrl()}${API_ROUTE.signIn}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      rememberMe,
    }),
  });

  const data = parseSignInResponse(await response.json());

  if (!response.ok) {
    if (response.status === 403) {
      return {
        success: false,
        error: "USER_NOT_CONFIRMED",
      };
    }
    return { success: false, error: data.error ?? "Sign in failed" };
  }

  if (data.idToken) {
    storeAuthTokens(data, rememberMe);
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
): Promise<SignInResponse> {
  const requestKey = `${state}:${code}`;
  const existingRequest = oauthSignInRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async (): Promise<SignInResponse> => {
    const oauthState = consumeOAuthState(state);
    const oauthCallbackUrl = `${getApiUrl()}${API_ROUTE.oauthCallback}`;
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
    let data: SignInResponse;
    try {
      data = parseSignInResponse(JSON.parse(responseBody));
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

    if (data.idToken) {
      storeAuthTokens(data, oauthState.rememberMe);
    }

    primeAuthCache({
      broadcast: true,
      rememberSession: oauthState.rememberMe,
    });

    return { success: true };
  })();

  oauthSignInRequests.set(requestKey, request);
  return request;
}

export async function forgotPasswordUser(email: string) {
  const command = new ForgotPasswordCommand({
    ClientId: USER_POOL_CLIENT_ID,
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
    ClientId: USER_POOL_CLIENT_ID,
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
