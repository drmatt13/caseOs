import { redirect } from "@tanstack/react-router";
import { UserSchema } from "#/schemas/user";
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

async function getCookieHeader(): Promise<string | undefined> {
  if (typeof document !== "undefined") {
    return document.cookie;
  }

  const { getRequest } = await import("@tanstack/react-start/server");
  return getRequest().headers.get("cookie") ?? undefined;
}

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
    throw redirect({ to: "/login" });
  }
  return { user };
}
