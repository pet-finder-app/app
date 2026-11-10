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
  const expected = new URL(request.url);
  const host = request.headers.get("Host");
  if (host) expected.host = host;
  return (
    request.headers.get("Sec-Fetch-Site") !== "cross-site" &&
    (!origin || origin === expected.origin)
  );
}
