import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, afterEach, beforeEach, test } from "node:test";
import { setRequestCookies } from "./support/request-context.mjs";

// Exercise the actual handlers and NextResponse cookies. Only Next's request
// context and the upstream HTTP boundary are substituted for these unit tests.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    let url;
    if (specifier === "next/headers")
      url = new URL("./support/request-context.mjs", import.meta.url).href;
    if (specifier === "next/server")
      url = import.meta.resolve("next/server.js");
    if (specifier === "server-only") url = "data:text/javascript,export{}";
    if (specifier === "@/lib/api/server")
      url = new URL("../src/lib/api/server.ts", import.meta.url).href;
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context);
  },
});
const { POST: authenticate } =
  await import("../src/app/api/session/[action]/route.ts");
const proxy = await import("../src/app/api/backend/[...path]/route.ts");
after(() => hooks.deregister());

const originalFetch = globalThis.fetch;
const originalOrigin = process.env.API_BASE_URL;
const originalNodeEnv = process.env.NODE_ENV;
const user = {
  id: "account-id",
  name: "Ana",
  email: "ana@example.test",
  roles: ["adopter"],
  phone: null,
  location: null,
  created_at: null,
  updated_at: null,
};
const session = {
  access_token: "test-access",
  refresh_token: "test-refresh",
  expires_in: 900,
  token_type: "Bearer",
  user,
};
const json = (value, status = 200) => Response.json(value, { status });
const context = (action) => ({ params: Promise.resolve({ action }) });
function request(action, body, origin = "http://app.test") {
  return new Request(`http://app.test/api/session/${action}`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
function proxyRequest(
  path,
  {
    method = "GET",
    body,
    origin = "http://app.test",
    headers = {},
    query = "",
  } = {},
) {
  return proxy[method](
    new Request(`http://app.test/api/backend/${path}${query}`, {
      method,
      headers: { Origin: origin, ...headers },
      body,
    }),
    { params: Promise.resolve({ path: path.split("/") }) },
  );
}
beforeEach(() => {
  process.env.API_BASE_URL = "http://api.test/";
  process.env.NODE_ENV = "production";
  setRequestCookies();
  globalThis.fetch = async () => {
    throw new Error("Unexpected upstream request");
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalOrigin === undefined) delete process.env.API_BASE_URL;
  else process.env.API_BASE_URL = originalOrigin;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

test("login returns only the user and protects both tokens in cookies", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://api.test/v1/auth/login");
    assert.deepEqual(JSON.parse(options.body), {
      email: user.email,
      password: "private-password",
    });
    assert.equal(options.cache, "no-store");
    return json(session);
  };
  const response = await authenticate(
    request("login", { email: user.email, password: "private-password" }),
    context("login"),
  );
  assert.deepEqual(await response.json(), user);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  for (const name of ["petfinder_access", "petfinder_refresh"]) {
    const cookie = response.cookies.get(name);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.secure, true);
    assert.equal(cookie.sameSite, "lax");
    assert.equal(cookie.path, "/");
  }
  assert.equal(response.cookies.get("petfinder_access").maxAge, 900);
});

test("registration preserves consent flags and the upstream creation status", async () => {
  const body = {
    name: user.name,
    email: user.email,
    password: "password123456",
    accepted_terms: true,
    accepted_privacy_policy: true,
  };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://api.test/v1/auth/register");
    assert.deepEqual(JSON.parse(options.body), body);
    return json(session, 201);
  };
  const response = await authenticate(
    request("register", body),
    context("register"),
  );
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), user);
});

test("session endpoints reject cross-origin writes before contacting the API", async () => {
  const response = await authenticate(
    request("login", {}, "https://other.test"),
    context("login"),
  );
  assert.equal(response.status, 403);
});

test("unknown session actions cannot forward arbitrary auth endpoints", async () => {
  const response = await authenticate(request("admin", {}), context("admin"));
  assert.equal(response.status, 404);
});

test("refresh without a cookie rejects the request and clears stale access", async () => {
  setRequestCookies({ petfinder_access: "stale" });
  const response = await authenticate(request("refresh"), context("refresh"));
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get("petfinder_access").value, "");
});

test("refresh uses the HTTP-only cookie instead of a client-supplied token", async () => {
  setRequestCookies({ petfinder_refresh: "cookie-refresh" });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://api.test/v1/auth/refresh");
    assert.deepEqual(JSON.parse(options.body), {
      refresh_token: "cookie-refresh",
    });
    return json(session);
  };
  const response = await authenticate(
    request("refresh", { refresh_token: "untrusted-token" }),
    context("refresh"),
  );
  assert.equal(response.status, 200);
  assert.equal(
    response.cookies.get("petfinder_refresh").value,
    session.refresh_token,
  );
  assert.deepEqual(await response.json(), user);
});

test("a rejected refresh clears both session cookies", async () => {
  setRequestCookies({ petfinder_refresh: "revoked" });
  globalThis.fetch = async () => json({ error: "revoked" }, 401);
  const response = await authenticate(request("refresh"), context("refresh"));
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get("petfinder_access").value, "");
  assert.equal(response.cookies.get("petfinder_refresh").value, "");
});

test("temporary refresh errors preserve the existing session for a later retry", async () => {
  setRequestCookies({ petfinder_refresh: "valid" });
  globalThis.fetch = async () => json({ title: "Unavailable" }, 503);
  const response = await authenticate(request("refresh"), context("refresh"));
  assert.equal(response.status, 503);
  assert.equal(response.headers.has("Set-Cookie"), false);
});

test("logout with no refresh cookie still clears stale access locally", async () => {
  setRequestCookies({ petfinder_access: "stale" });
  const response = await authenticate(request("logout"), context("logout"));
  assert.equal(response.status, 204);
  assert.equal(response.cookies.get("petfinder_access").value, "");
  assert.equal(await response.text(), "");
});

test("logout revokes the cookie session with its access token", async () => {
  setRequestCookies({
    petfinder_access: "access",
    petfinder_refresh: "refresh",
  });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://api.test/v1/auth/logout");
    assert.equal(options.headers.Authorization, "Bearer access");
    assert.deepEqual(JSON.parse(options.body), { refresh_token: "refresh" });
    return new Response(null, { status: 204 });
  };
  const response = await authenticate(request("logout"), context("logout"));
  assert.equal(response.status, 204);
  assert.equal(response.cookies.get("petfinder_refresh").value, "");
});

test("expired logout rotates tokens then revokes the new refresh session", async () => {
  setRequestCookies({
    petfinder_access: "expired",
    petfinder_refresh: "old-refresh",
  });
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) return json({ error: "expired" }, 401);
    if (calls.length === 2) return json(session);
    assert.equal(
      options.headers.Authorization,
      `Bearer ${session.access_token}`,
    );
    assert.deepEqual(JSON.parse(options.body), {
      refresh_token: session.refresh_token,
    });
    return new Response(null, { status: 204 });
  };
  const response = await authenticate(request("logout"), context("logout"));
  assert.equal(response.status, 204);
  assert.deepEqual(
    calls.map(({ url }) => new URL(url).pathname),
    ["/v1/auth/logout", "/v1/auth/refresh", "/v1/auth/logout"],
  );
});

test("logout without an access cookie renews before revoking", async () => {
  setRequestCookies({ petfinder_refresh: "old-refresh" });
  const paths = [];
  globalThis.fetch = async (url) => {
    paths.push(new URL(url).pathname);
    return paths.length === 1
      ? json(session)
      : new Response(null, { status: 204 });
  };
  const response = await authenticate(request("logout"), context("logout"));
  assert.equal(response.status, 204);
  assert.deepEqual(paths, ["/v1/auth/refresh", "/v1/auth/logout"]);
});

test("proxy preserves query parameters and uses only cookie authentication", async () => {
  setRequestCookies({ petfinder_access: "trusted-access" });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://api.test/v1/animals?page=2&city=Recife");
    assert.equal(options.headers.Authorization, "Bearer trusted-access");
    assert.equal(options.headers.Cookie, undefined);
    assert.equal(options.cache, "no-store");
    return json({ items: [], page: { page: 2, page_size: 12, total: 0 } });
  };
  const response = await proxyRequest("v1/animals", {
    query: "?page=2&city=Recife",
    headers: { Authorization: "Bearer untrusted", Cookie: "unrelated=secret" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("proxy supports anonymous discovery without forwarding client credentials", async () => {
  globalThis.fetch = async (_, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return json({ items: [] });
  };
  const response = await proxyRequest("v1/animals", {
    headers: { Authorization: "Bearer untrusted" },
  });
  assert.equal(response.status, 200);
});

test("proxy preserves mutation bodies and upstream validation problems", async () => {
  const body = '{"name":"a"}';
  const problem = {
    status: 422,
    title: "Validation failed",
    errors: { name: "too short" },
  };
  globalThis.fetch = async (_, options) => {
    assert.equal(options.method, "PATCH");
    assert.equal(options.body, body);
    assert.equal(options.headers["Content-Type"], "application/json");
    return json(problem, 422);
  };
  const response = await proxyRequest("v1/me", { method: "PATCH", body });
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), problem);
});

test("proxy forwards successful deletion without attempting a JSON body", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  const response = await proxyRequest("v1/animals/animal-id/images/image-id", {
    method: "DELETE",
  });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
});

test("proxy rejects cross-origin mutations", async () => {
  const response = await proxyRequest("v1/me", {
    method: "PATCH",
    origin: "https://other.test",
    body: "{}",
  });
  assert.equal(response.status, 403);
});

test("proxy rejects auth paths, traversal, and endpoints outside the contract", async () => {
  for (const path of [
    "v1/auth/refresh",
    "v1/animals/../me",
    "v1/animals/id/unknown",
    "internal/secrets",
  ]) {
    const response = await proxyRequest(path);
    assert.equal(response.status, 404, path);
  }
});

test("proxy translates connection failures into a sanitized 502 problem", async (t) => {
  t.mock.method(console, "error", () => {});
  globalThis.fetch = async () => {
    throw new Error("private connection detail");
  };
  const response = await proxyRequest("v1/me");
  assert.equal(response.status, 502);
  const body = await response.text();
  assert.equal(JSON.parse(body).status, 502);
  assert.doesNotMatch(body, /private connection detail/);
});

test("malformed login JSON is a client error and never reaches the API", async () => {
  const invalid = new Request("http://app.test/api/session/login", {
    method: "POST",
    body: "{invalid",
    headers: { Origin: "http://app.test" },
  });
  const response = await authenticate(invalid, context("login"));
  assert.equal(response.status, 400);
});

test("failed revocation after refresh preserves rotated tokens for logout retry", async () => {
  setRequestCookies({ petfinder_refresh: "old-refresh" });
  let calls = 0;
  globalThis.fetch = async () =>
    ++calls === 1 ? json(session) : json({ title: "Unavailable" }, 503);
  const response = await authenticate(request("logout"), context("logout"));
  assert.equal(response.status, 503);
  assert.equal(
    response.cookies.get("petfinder_refresh")?.value,
    session.refresh_token,
  );
  assert.equal(
    response.cookies.get("petfinder_access")?.value,
    session.access_token,
  );
  assert.deepEqual(await response.json(), { title: "Unavailable" });
});

test("network failure after refresh also preserves rotated tokens", async (t) => {
  t.mock.method(console, "error", () => {});
  setRequestCookies({ petfinder_refresh: "old-refresh" });
  let calls = 0;
  globalThis.fetch = async () => {
    if (++calls === 1) return json(session);
    throw new Error("Connection lost during revocation");
  };
  const response = await authenticate(request("logout"), context("logout"));
  assert.equal(response.status, 502);
  assert.equal(
    response.cookies.get("petfinder_refresh")?.value,
    session.refresh_token,
  );
});

test("local development cookies do not require HTTPS", async () => {
  process.env.NODE_ENV = "development";
  globalThis.fetch = async () => json(session);
  const response = await authenticate(
    request("login", { email: user.email, password: "password" }),
    context("login"),
  );
  assert.equal(response.cookies.get("petfinder_access").secure, false);
  assert.equal(response.cookies.get("petfinder_access").httpOnly, true);
});

test("invalid credentials preserve the upstream problem without setting tokens", async () => {
  const problem = { error: "invalid credentials" };
  globalThis.fetch = async () => json(problem, 401);
  const response = await authenticate(
    request("login", { email: user.email, password: "wrong" }),
    context("login"),
  );
  assert.equal(response.status, 401);
  assert.equal(response.headers.has("Set-Cookie"), false);
  assert.deepEqual(await response.json(), problem);
});
