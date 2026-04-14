import { createIsomorphicFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { UserSchema } from "#/schemas/user";
import {
  ConfirmSignUpCommand,
  CognitoIdentityProviderClient,
  CognitoIdentityProviderServiceException,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type { User } from "#/schemas/user";

function parseCookies(
  cookieHeader: string | undefined,
): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const [key, ...rest] = cookie.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf-8");
}

function getUserFromIdToken(idToken: string | undefined): User | null {
  if (!idToken) {
    return null;
  }

  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(parts[1])) as Record<
      string,
      unknown
    >;
    if (payload.token_use !== "id") {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) {
      return null;
    }

    const parsed = UserSchema.safeParse({
      id: payload.sub,
      email: payload.email,
      userName: payload["cognito:username"],
      firstName: payload.given_name ?? "",
      lastName: payload.family_name ?? "",
    });

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const getCookieHeader = createIsomorphicFn()
  .client(() => document.cookie)
  .server(async () => {
    const { getRequest } = await import("@tanstack/react-start/server");
    return getRequest().headers.get("cookie") ?? undefined;
  });

function hasCognitoCredentials(cookies: Record<string, string>): boolean {
  return ["idToken", "accessToken", "refreshToken"].every((cookieName) =>
    Boolean(cookies[cookieName]),
  );
}

export async function verifyUser(): Promise<{ user: User | null }> {
  const cookieHeader = await getCookieHeader();
  const cookies = parseCookies(cookieHeader);

  if (!hasCognitoCredentials(cookies)) {
    return { user: null };
  }

  if (typeof document !== "undefined") {
    try {
      const response = await fetch(
        import.meta.env.VITE_API_GATEWAY_URL + "/verify-user",
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          const parsed = UserSchema.safeParse(data.user);
          if (parsed.success) {
            return { user: parsed.data };
          }
        }
      }
    } catch {
      // Fall back to local mock-token decoding during development.
    }
  }

  return { user: getUserFromIdToken(cookies.idToken) };
}

export async function requireAuth() {
  const { user } = await verifyUser();
  if (!user) {
    throw redirect({
      to: "/login",
      replace: true,
      search: { email: undefined, "account-verified": undefined },
    });
  }
  return { user };
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
