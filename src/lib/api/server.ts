import { NextResponse } from "next/server";
import "server-only";
import type { components } from "./schema";

export const ACCESS_COOKIE = "petfinder_access";
export const REFRESH_COOKIE = "petfinder_refresh";
export const apiOrigin = () => {
  const url = process.env.API_BASE_URL;
  if (!url)
    throw new Error("Configure API_BASE_URL para conectar à API Petfinder.");
  return url.replace(/\/$/, "");
};

export function setSession(
  response: NextResponse,
  session: components["schemas"]["AuthSessionResponse"],
) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    ...options,
    maxAge: session.expires_in,
  });
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    ...options,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function unavailable(error: unknown) {
  console.error(
    "Petfinder API:",
    error instanceof Error ? error.message : "Connection failed",
  );
  return NextResponse.json(
    {
      title: "API indisponível",
      detail: "Não foi possível conectar ao serviço. Tente novamente.",
      status: 502,
    },
    { status: 502 },
  );
}
