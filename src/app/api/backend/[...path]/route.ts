import {
  clearSessionCookies,
  isSameOrigin,
  setSessionCookies,
} from "@/lib/backend/session-cookies";
import {
  authenticatedBackendRequest,
  isAuthenticationFailure,
  isBackendRoute,
} from "@/lib/backend/transport";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

/** Transport only: domain validation, permissions, and persistence belong to the Go API. */
async function forward(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const pathname = `/${path.join("/")}`;
  if (!isBackendRoute(request.method, pathname))
    return NextResponse.json(
      { message: "Esta operação não está disponível." },
      { status: 404 },
    );
  if (request.method !== "GET" && !isSameOrigin(request))
    return NextResponse.json(
      { message: "Origem da solicitação inválida." },
      { status: 403 },
    );
  try {
    const body =
      request.method === "GET" ? undefined : await request.arrayBuffer();
    // Binary media uploads follow Go's 10 MiB per-file limit; JSON stays small.
    const limit = /^\/v1\/media\/[^/]+\/content$/.test(pathname)
      ? 10 * 1_048_576
      : 1_048_576;
    if (body && body.byteLength > limit)
      return NextResponse.json(
        { message: "A solicitação excede o tamanho permitido." },
        { status: 413 },
      );
    const { response: upstream, tokens } = await authenticatedBackendRequest(
      `${pathname}${request.nextUrl.search}`,
      {
        method: request.method,
        body,
        headers: {
          "Content-Type":
            request.headers.get("Content-Type") ?? "application/json",
        },
        signal: request.signal,
      },
      request.cookies.get(ACCESS_COOKIE)?.value,
      request.cookies.get(REFRESH_COOKIE)?.value,
    );
    const isUnauthorized = await isAuthenticationFailure(upstream);
    const isMediaDownload =
      request.method === "GET" && /^\/v1\/media\/[^/]+$/.test(pathname);
    const response = new NextResponse(
      upstream.status === 204 ? null : upstream.body,
      {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") ?? "application/json",
          // Media bytes are immutable; keep Go's caching policy for them. Every
          // other API response is private, changing data and is never cached.
          "Cache-Control":
            isMediaDownload && upstream.ok
              ? (upstream.headers.get("Cache-Control") ?? "no-store")
              : "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
    const disposition = upstream.headers.get("Content-Disposition");
    if (disposition) response.headers.set("Content-Disposition", disposition);
    const requestId = upstream.headers.get("X-Request-ID");
    if (requestId) response.headers.set("X-Request-ID", requestId);
    if (tokens) {
      setSessionCookies(response, tokens);
      // A response carrying rotated session cookies must never be shared.
      const policy = response.headers.get("Cache-Control") ?? "";
      if (policy.startsWith("public"))
        response.headers.set(
          "Cache-Control",
          policy.replace(/^public/, "private"),
        );
    }
    if (isUnauthorized) clearSessionCookies(response);
    return response;
  } catch {
    return NextResponse.json(
      { message: "Não foi possível conectar ao serviço. Tente novamente." },
      { status: 503 },
    );
  }
}
export {
  forward as DELETE,
  forward as GET,
  forward as PATCH,
  forward as POST,
  forward as PUT,
};
