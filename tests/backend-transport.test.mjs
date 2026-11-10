import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import "./resolve-app.mjs";
const { authenticatedBackendRequest, isBackendRoute } =
  await import("../src/lib/backend/transport.ts");
const { BACKEND_ROUTES } = await import("../src/lib/backend/routes.ts");
const { POST: sessionPost } =
  await import("../src/app/api/session/[action]/route.ts");
const { NextRequest } = await import("next/server.js");
const user = {
  id: "user",
  name: "Pessoa",
  email: "user@example.test",
  phone: null,
  location: null,
  roles: ["adopter"],
  created_at: null,
  updated_at: null,
};
const tokens = {
  access_token: "new-access",
  refresh_token: "new-refresh",
  token_type: "Bearer",
  expires_in: 900,
  user,
};
const unauthorized = () =>
  Response.json({ title: "Unauthorized" }, { status: 401 });
const setup = (t) => {
  const previous = process.env.API_BASE_URL;
  process.env.API_BASE_URL = "http://backend.test";
  t.after(() => {
    if (previous === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = previous;
  });
};

test("proxy allowlist follows Go's documented routes and excludes auth/socket forwarding", (t) => {
  if (!existsSync(new URL("../../api/build/openapi.yaml", import.meta.url)))
    return t.skip("Sibling backend is required for contract parity");
  const contract = parse(
    readFileSync(
      new URL("../../api/build/openapi.yaml", import.meta.url),
      "utf8",
    ),
  );
  const expected = Object.entries(contract.paths).flatMap(
    ([path, operations]) =>
      path.startsWith("/v1/") &&
      !path.startsWith("/v1/auth/") &&
      !path.endsWith("/ws")
        ? Object.keys(operations)
            .filter((method) =>
              ["get", "post", "put", "patch", "delete"].includes(method),
            )
            .map((method) => `${method.toUpperCase()} ${path}`)
        : [],
  );
  assert.deepEqual(
    BACKEND_ROUTES.map((route) => `${route.method} ${route.path}`).sort(),
    expected.sort(),
  );
  assert.equal(isBackendRoute("PUT", "/v1/animals/id/preference"), true);
  for (const route of [
    "/v1/auth/login",
    "/v1/posts",
    "/v1/animals/../me",
    "/v1/animals/a%2fb",
    "/v1/conversations/id/ws",
  ])
    assert.equal(isBackendRoute("GET", route), false);
});

test("expired bearer refreshes once and retries with rotated access token", async (t) => {
  setup(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push([url.pathname, options.headers.get("Authorization")]);
    if (url.pathname.endsWith("/refresh")) {
      assert.deepEqual(JSON.parse(options.body), {
        refresh_token: "refresh-one",
      });
      return Response.json(tokens);
    }
    return options.headers.get("Authorization") === "Bearer new-access"
      ? Response.json(user)
      : unauthorized();
  });
  const result = await authenticatedBackendRequest(
    "/v1/me",
    {},
    "expired",
    "refresh-one",
  );
  assert.equal(result.response.status, 200);
  assert.equal(result.tokens.refreshToken, "new-refresh");
  assert.deepEqual(
    calls.map((call) => call[0]),
    ["/v1/me", "/v1/auth/refresh", "/v1/me"],
  );
});

test("concurrent requests coalesce rotating refresh tokens", async (t) => {
  setup(t);
  let refreshes = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.pathname.endsWith("/refresh")) {
      refreshes++;
      return Response.json(tokens);
    }
    return Response.json(user);
  });
  await Promise.all(
    Array.from({ length: 5 }, () =>
      authenticatedBackendRequest(
        "/v1/me",
        {},
        undefined,
        "concurrent-refresh",
      ),
    ),
  );
  assert.equal(refreshes, 1);
});

test("invalid OTP does not refresh valid credentials", async (t) => {
  setup(t);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ title: "Invalid OTP" }, { status: 401 });
  });
  const result = await authenticatedBackendRequest(
    "/v1/appointments/id/confirmations",
    {},
    "valid",
    "otp-refresh",
  );
  assert.equal(result.response.status, 401);
  assert.equal(result.tokens, null);
  assert.equal(calls, 1);
});

test("login keeps bearer tokens in HttpOnly cookies and exposes only user data", async (t) => {
  setup(t);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url.pathname, "/v1/auth/login");
    assert.deepEqual(JSON.parse(options.body), {
      email: user.email,
      password: "password12345",
    });
    return Response.json(tokens);
  });
  const request = new NextRequest("http://app.test/api/session/login", {
    method: "POST",
    headers: { Origin: "http://app.test", "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: "password12345" }),
  });
  const response = await sessionPost(request, {
    params: Promise.resolve({ action: "login" }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user });
  assert.equal(response.cookies.get("petfinder_access").httpOnly, true);
  assert.match(
    response.headers.get("set-cookie"),
    /petfinder_refresh=new-refresh/,
  );
});

test("logout revokes the newly rotated refresh token after access expiry", async (t) => {
  setup(t);
  let revoked;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.pathname.endsWith("/refresh")) return Response.json(tokens);
    if (url.pathname.endsWith("/logout")) {
      revoked = JSON.parse(options.body).refresh_token;
      return new Response(null, { status: 204 });
    }
    return options.headers.get("Authorization") === "Bearer new-access"
      ? Response.json(user)
      : unauthorized();
  });
  const request = new NextRequest("http://app.test/api/session/logout", {
    method: "POST",
    headers: {
      cookie: "petfinder_access=expired; petfinder_refresh=logout-refresh",
    },
  });
  const response = await sessionPost(request, {
    params: Promise.resolve({ action: "logout" }),
  });
  assert.equal(response.status, 200);
  assert.equal(revoked, "new-refresh");
  assert.equal(response.cookies.get("petfinder_refresh").value, "");
});

test("cross-origin session changes are rejected before backend requests", async (t) => {
  setup(t);
  t.mock.method(globalThis, "fetch", () =>
    assert.fail("cross-origin request forwarded"),
  );
  const response = await sessionPost(
    new NextRequest("http://app.test/api/session/logout", {
      method: "POST",
      headers: { Origin: "http://other.test" },
    }),
    { params: Promise.resolve({ action: "logout" }) },
  );
  assert.equal(response.status, 403);
});

test("same-origin checks honor the browser host when Next normalizes its bind hostname", async () => {
  const { isSameOrigin } =
    await import("../src/lib/backend/session-cookies.ts");
  assert.equal(
    isSameOrigin(
      new Request("http://localhost:3100/api/session/login", {
        headers: {
          Host: "127.0.0.1:3100",
          Origin: "http://127.0.0.1:3100",
          "Sec-Fetch-Site": "same-origin",
        },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOrigin(
      new Request("http://localhost:3100/api/session/login", {
        headers: { Host: "127.0.0.1:3100", Origin: "http://attacker.test" },
      }),
    ),
    false,
  );
});
