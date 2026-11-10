const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/terms",
]);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname.replace(/\/+$/, ""));
}

export function loginUrl(page: string): string {
  return `/login?${new URLSearchParams({ page })}`;
}

export function redirectPage(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  const origin = "https://petfinder.invalid";
  try {
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      isPublicPath(url.pathname) ||
      /^\/(?:api|_next)(?:\/|$)/.test(url.pathname)
    )
      return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
