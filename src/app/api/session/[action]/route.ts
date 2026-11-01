import type { components } from "@/lib/api/schema";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  apiOrigin,
  clearSession,
  sameOrigin,
  setSession,
  unavailable,
} from "@/lib/api/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  if (!sameOrigin(request)) return new NextResponse(null, { status: 403 });
  const { action } = await params;
  if (!["login", "register", "refresh", "logout"].includes(action))
    return new NextResponse(null, { status: 404 });
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if ((action === "refresh" || action === "logout") && !refresh) {
    if (action === "logout") {
      const response = new NextResponse(null, { status: 204 });
      clearSession(response);
      return response;
    }
    const response = NextResponse.json(
      { detail: "Faça login para continuar." },
      { status: 401 },
    );
    clearSession(response);
    return response;
  }
  let rotatedSession: components["schemas"]["AuthSessionResponse"] | undefined;
  try {
    if (action === "logout") {
      // Logout is protected by an access token. Renew it if it expired so
      // the API can revoke the refresh session instead of only clearing cookies.
      let access = jar.get(ACCESS_COOKIE)?.value;
      let token = refresh;
      const revoke = () =>
        fetch(`${apiOrigin()}/v1/auth/logout`, {
          method: "POST",
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access ?? ""}`,
          },
          body: JSON.stringify({ refresh_token: token }),
        });
      let upstream = access ? await revoke() : undefined;
      if (!upstream || upstream.status === 401) {
        const renewed = await fetch(`${apiOrigin()}/v1/auth/refresh`, {
          method: "POST",
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: token }),
        });
        if (renewed.ok) {
          const session =
            (await renewed.json()) as components["schemas"]["AuthSessionResponse"];
          rotatedSession = session;
          access = session.access_token;
          token = session.refresh_token;
          upstream = await revoke();
        } else upstream = renewed;
      }
      if (!upstream.ok && upstream.status !== 401) {
        const response = NextResponse.json(await upstream.json(), {
          status: upstream.status,
        });
        // Refresh revoked the old token. Keep its replacement if revocation
        // fails temporarily so the user can retry logout with a valid session.
        if (rotatedSession) setSession(response, rotatedSession);
        return response;
      }
      const response = new NextResponse(null, { status: 204 });
      clearSession(response);
      return response;
    }
    let body: unknown = { refresh_token: refresh };
    if (action !== "refresh") {
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { detail: "Envie um corpo JSON válido.", status: 400 },
          { status: 400 },
        );
      }
    }
    const upstream = await fetch(`${apiOrigin()}/v1/auth/${action}`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      const response = NextResponse.json(data, { status: upstream.status });
      if (action === "refresh" && upstream.status === 401)
        clearSession(response);
      return response;
    }
    const session = data as components["schemas"]["AuthSessionResponse"];
    const response = NextResponse.json(session.user, {
      status: upstream.status,
    });
    response.headers.set("Cache-Control", "no-store");
    setSession(response, session);
    return response;
  } catch (error) {
    const response = unavailable(error);
    if (rotatedSession) setSession(response, rotatedSession);
    return response;
  }
}
