import { isPublicPath, loginUrl } from "@/lib/auth-redirect";
import {
  clearSessionCookies,
  setSessionCookies,
} from "@/lib/backend/session-cookies";
import { authenticatedBackendRequest } from "@/lib/backend/transport";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

/** Validate the real backend session and make rotated cookies visible to server rendering. */
export async function proxy(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) return NextResponse.next();
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const redirectToLogin = () => {
    const response = NextResponse.redirect(
      new URL(
        loginUrl(`${request.nextUrl.pathname}${request.nextUrl.search}`),
        request.url,
      ),
    );
    clearSessionCookies(response);
    return response;
  };
  if (!access && !refresh) return redirectToLogin();
  try {
    const { response: upstream, tokens } = await authenticatedBackendRequest(
      "/v1/me",
      {},
      access,
      refresh,
    );
    if (upstream.status === 401) return redirectToLogin();
    if (tokens) {
      request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
      request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
      const headers = new Headers(request.headers);
      headers.set("Cookie", request.cookies.toString());
      const response = NextResponse.next({ request: { headers } });
      setSessionCookies(response, tokens);
      return response;
    }
    return NextResponse.next();
  } catch {
    // A backend outage must not erase a session. Page error handling provides a retry.
    return NextResponse.next();
  }
}
export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\.[^/]+$).*)"],
};
