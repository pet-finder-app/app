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
    if (body && body.byteLength > 1_048_576)
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
    const response = new NextResponse(
      upstream.status === 204 ? null : upstream.body,
      {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") ?? "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
    const requestId = upstream.headers.get("X-Request-ID");
    if (requestId) response.headers.set("X-Request-ID", requestId);
    if (tokens) setSessionCookies(response, tokens);
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
