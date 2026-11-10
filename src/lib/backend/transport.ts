import {
  authSessionResponseSchema,
  type AuthSessionResponse,
} from "./contracts";
import { BACKEND_ROUTES } from "./routes";

export class BackendUnavailableError extends Error {
  constructor() {
    super("Não foi possível conectar ao serviço. Tente novamente.");
  }
}

export function backendUrl(path: string): URL {
  const configured = process.env.API_BASE_URL;
  if (!configured) throw new BackendUnavailableError();
  const base = new URL(configured);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new BackendUnavailableError();
  return new URL(path.replace(/^\/+/, ""), `${base.href.replace(/\/+$/, "")}/`);
}

export function isBackendRoute(method: string, pathname: string): boolean {
  if (
    pathname
      .split("/")
      .some((part) => [".", ".."].includes(part) || /%2f|%5c/i.test(part))
  )
    return false;
  return BACKEND_ROUTES.some(
    (route) =>
      route.method === method &&
      new RegExp(`^${route.path.replace(/\{[^}]+\}/g, "[^/]+")}$`).test(
        pathname,
      ),
  );
}

export async function fetchBackend(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  try {
    return await fetch(backendUrl(path), {
      ...init,
      headers,
      cache: "no-store",
      redirect: "manual",
      signal: init.signal ?? AbortSignal.timeout(15_000),
    });
  } catch {
    throw new BackendUnavailableError();
  }
}

const refreshes = new Map<string, Promise<AuthSessionResponse | null>>();

/** Coalesce concurrent requests that arrive with the same rotating refresh cookie. */
export function refreshBackendSession(
  refreshToken: string,
): Promise<AuthSessionResponse | null> {
  const existing = refreshes.get(refreshToken);
  if (existing) return existing;
  const pending = (async () => {
    const response = await fetchBackend("/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new BackendUnavailableError();
    const payload: unknown = await response.json();
    return authSessionResponseSchema.parse(payload);
  })();
  refreshes.set(refreshToken, pending);
  void pending.then(
    () => {
      const timer = setTimeout(() => refreshes.delete(refreshToken), 5_000);
      timer.unref();
    },
    () => refreshes.delete(refreshToken),
  );
  return pending;
}

/** OTP rejection is a domain validation failure, not an expired bearer session. */
export async function isAuthenticationFailure(
  response: Response,
): Promise<boolean> {
  if (response.status !== 401) return false;
  try {
    const payload: unknown = await response.clone().json();
    return !(
      typeof payload === "object" &&
      payload !== null &&
      "title" in payload &&
      payload.title === "Invalid OTP"
    );
  } catch {
    return true;
  }
}

export async function authenticatedBackendRequest(
  path: string,
  init: RequestInit,
  accessToken?: string,
  refreshToken?: string,
) {
  let tokens: AuthSessionResponse | null = null;
  if (!accessToken && refreshToken)
    tokens = await refreshBackendSession(refreshToken);
  if (!accessToken && !tokens)
    return { response: new Response(null, { status: 401 }), tokens: null };
  let response = await fetchBackend(
    path,
    init,
    tokens?.accessToken ?? accessToken,
  );
  if ((await isAuthenticationFailure(response)) && refreshToken && !tokens) {
    tokens = await refreshBackendSession(refreshToken);
    if (tokens) response = await fetchBackend(path, init, tokens.accessToken);
  }
  return { response, tokens };
}
