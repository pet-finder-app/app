import {
  ACCESS_COOKIE,
  ORGANIZATION_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/session";
import type { NextResponse } from "next/server";
import type { AuthSessionResponse } from "./contracts";

type CookieReader = { get(name: string): { value: string } | undefined };
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export function setSessionCookies(
  response: NextResponse,
  tokens: AuthSessionResponse,
): void {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...options,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...options,
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
}

export function selectedOrganization(
  cookies: CookieReader,
  userId: string,
): string | null {
  const [owner, organizationId] = (
    cookies.get(ORGANIZATION_COOKIE)?.value ?? ""
  ).split(":");
  return owner === userId && organizationId ? organizationId : null;
}

export function setOrganizationCookie(
  response: NextResponse,
  userId: string,
  organizationId: string,
): void {
  response.cookies.set(ORGANIZATION_COOKIE, `${userId}:${organizationId}`, {
    ...options,
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  // Next may normalize request.url to its bind hostname. The browser-facing
  // Host header identifies the origin that actually received the request.
  // Behind a TLS-terminating reverse proxy the app itself sees plain HTTP, so
  // honor the proxy's forwarded scheme/host. The app only binds to loopback in
  // production, and browsers cannot set X-Forwarded-* on cross-site requests
  // without a CORS preflight that Next never approves.
  const url = new URL(request.url);
  const first = (name: string) =>
    request.headers.get(name)?.split(",")[0]?.trim() || undefined;
  const forwardedProto = first("X-Forwarded-Proto");
  const protocol =
    forwardedProto === "http" || forwardedProto === "https"
      ? `${forwardedProto}:`
      : url.protocol;
  const host = first("X-Forwarded-Host") ?? first("Host") ?? url.host;
  // Build a fresh URL: assigning `url.host` without a port keeps the old one.
  let expected: string;
  try {
    expected = new URL(`${protocol}//${host}`).origin;
  } catch {
    return false;
  }
  return (
    request.headers.get("Sec-Fetch-Site") !== "cross-site" &&
    (!origin || origin === expected)
  );
}
