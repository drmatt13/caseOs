import { API_ROUTE } from "@repo/api-contract";
import { invalidateAuthCache } from "#/lib/auth";
import { clearReactQueryState } from "#/lib/queryClient";

const AUTH_COOKIE_NAMES = ["idToken", "accessToken", "refreshToken"];
const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

function getApiUrl(): string {
  return String(API_URL ?? "").replace(/\/+$/, "");
}

function clearLocalCookies(): void {
  if (typeof document === "undefined") {
    return;
  }

  for (const cookieName of AUTH_COOKIE_NAMES) {
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
  }
}

export default async function logout(): Promise<void> {
  if (typeof document === "undefined") {
    return;
  }

  invalidateAuthCache({ broadcast: true });
  await clearReactQueryState();

  try {
    await fetch(`${getApiUrl()}${API_ROUTE.signOut}`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Network errors should not block local cleanup and redirect.
  } finally {
    invalidateAuthCache({ broadcast: false });
    clearLocalCookies();
    await clearReactQueryState();
  }
}
