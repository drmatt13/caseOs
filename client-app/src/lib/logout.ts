const AUTH_COOKIE_NAMES = ["idToken", "accessToken", "refreshToken"];

export default function logout(): void {
  if (typeof document === "undefined") {
    return;
  }

  for (const cookieName of AUTH_COOKIE_NAMES) {
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
  }
}
