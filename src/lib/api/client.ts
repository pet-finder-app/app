import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

export type Schema = components["schemas"];

export class ApiError extends Error {
  status: number;
  problem: unknown;
  constructor(status: number, problem: unknown) {
    const body = problem as
      | {
          detail?: string;
          title?: string;
          error?: string;
          errors?: Record<string, string>;
        }
      | undefined;
    super(
      [
        body?.detail ?? body?.error ?? body?.title ?? `Erro ${status}`,
        ...Object.values(body?.errors ?? {}),
      ].join(" · "),
    );
    this.status = status;
    this.problem = problem;
  }

  get isAuthenticationError() {
    return (
      this.status === 401 &&
      (this.problem as { title?: string } | null)?.title !== "Invalid OTP"
    );
  }
}

let refresh: Promise<boolean> | undefined;
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const request = new Request(input, init);
  const retry = request.clone();
  let response = await fetch(request);
  // Invalid delivery OTPs also return 401. Replaying those would consume a
  // second attempt; only authentication failures should refresh the session.
  const problem =
    response.status === 401
      ? await response
          .clone()
          .json()
          .catch(() => null)
      : null;
  if (response.status === 401 && problem?.title !== "Invalid OTP") {
    refresh ??= fetch("/api/session/refresh", { method: "POST" })
      .then((r) => r.ok)
      .finally(() => {
        refresh = undefined;
      });
    if (await refresh) {
      request.signal.throwIfAborted();
      response = await fetch(retry);
    }
  }
  return response;
}

export const api = createClient<paths>({
  baseUrl: "/api/backend",
  fetch: authenticatedFetch,
});

export async function result<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const response = await promise;
  if (!response.response.ok)
    throw new ApiError(response.response.status, response.error);
  return response.data as T;
}

export async function session(
  action: "login" | "register" | "logout",
  body?: Schema["LoginRequest"] | Schema["RegisterRequest"],
) {
  const response = await fetch(`/api/session/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return undefined;
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status, data);
  return data as Schema["UserResponse"];
}
