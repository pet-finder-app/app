import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiError, authenticatedFetch, result } from "../src/lib/api/client.ts";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const json = (data, status = 200) => Response.json(data, { status });

test("concurrent unauthorized requests share one refresh and replay their bodies", async () => {
  let refreshed = false;
  let refreshCount = 0;
  const bodies = [];
  let unauthorizedCount = 0;
  let bothUnauthorized;
  const pending = new Promise((resolve) => {
    bothUnauthorized = resolve;
  });
  globalThis.fetch = async (request) => {
    if (request === "/api/session/refresh") {
      refreshCount++;
      await pending;
      refreshed = true;
      return json({ id: "user" });
    }
    bodies.push(await request.text());
    if (!refreshed) {
      if (++unauthorizedCount === 2) bothUnauthorized();
      return json({ error: "expired token" }, 401);
    }
    return json({ saved: true });
  };
  const responses = await Promise.all(
    ["one", "two"].map((body) =>
      authenticatedFetch("http://app.test/api/backend/v1/me", {
        method: "PATCH",
        body,
      }),
    ),
  );
  assert.equal(refreshCount, 1);
  assert.deepEqual(bodies.sort(), ["one", "one", "two", "two"]);
  assert.ok(responses.every((response) => response.ok));
});

test("a failed refresh preserves the original error and does not loop", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json({ error: "invalid session" }, 401);
  };
  const response = await authenticatedFetch(
    "http://app.test/api/backend/v1/me",
  );
  assert.equal(response.status, 401);
  assert.equal(calls, 2);
});

test("invalid OTP responses are never replayed or treated as expired sessions", async () => {
  let calls = 0;
  const problem = {
    title: "Invalid OTP",
    detail: "code is invalid or expired",
    status: 401,
  };
  globalThis.fetch = async () => {
    calls++;
    return json(problem, 401);
  };
  const response = await authenticatedFetch(
    "http://app.test/api/backend/v1/appointments/id/confirmations",
    { method: "POST", body: '{"otp_code":"000000"}' },
  );
  assert.equal(response.status, 401);
  assert.equal(calls, 1);
  assert.equal(new ApiError(401, problem).isAuthenticationError, false);
});

test("forbidden operations do not attempt refresh", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json({ title: "Forbidden" }, 403);
  };
  const response = await authenticatedFetch(
    "http://app.test/api/backend/v1/organizations/id/members",
  );
  assert.equal(response.status, 403);
  assert.equal(calls, 1);
});

test("a request cancelled during refresh is not replayed", async () => {
  const controller = new AbortController();
  let resourceCalls = 0;
  globalThis.fetch = async (request) => {
    if (request === "/api/session/refresh") {
      controller.abort();
      return json({});
    }
    resourceCalls++;
    return json({ error: "expired token" }, 401);
  };
  await assert.rejects(
    authenticatedFetch("http://app.test/api/backend/v1/me", {
      signal: controller.signal,
    }),
    { name: "AbortError" },
  );
  assert.equal(resourceCalls, 1);
});

test("API problems retain status and field validation details", async () => {
  const problem = {
    detail: "Review the fields",
    errors: { name: "too short", password: "must include a number" },
  };
  await assert.rejects(
    result(Promise.resolve({ response: json(problem, 422), error: problem })),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 422);
      assert.match(error.message, /too short/);
      assert.match(error.message, /must include a number/);
      assert.equal(error.problem, problem);
      return true;
    },
  );
});

test("successful empty responses are supported", async () => {
  assert.equal(
    await result(
      Promise.resolve({ response: new Response(null, { status: 204 }) }),
    ),
    undefined,
  );
});

test("an unauthorized replay returns to the caller instead of refreshing forever", async () => {
  let refreshes = 0;
  let requests = 0;
  globalThis.fetch = async (request) => {
    if (request === "/api/session/refresh") {
      refreshes++;
      return json({});
    }
    requests++;
    return json({ error: "unauthorized" }, 401);
  };
  const response = await authenticatedFetch(
    "http://app.test/api/backend/v1/me",
  );
  assert.equal(response.status, 401);
  assert.equal(refreshes, 1);
  assert.equal(requests, 2);
});

test("a rejected refresh promise is cleared so a subsequent request can recover", async () => {
  let refreshes = 0;
  let authorized = false;
  globalThis.fetch = async (request) => {
    if (request === "/api/session/refresh") {
      if (++refreshes === 1) throw new Error("offline");
      authorized = true;
      return json({});
    }
    return authorized ? json({ saved: true }) : json({ error: "expired" }, 401);
  };
  await assert.rejects(
    authenticatedFetch("http://app.test/api/backend/v1/me"),
    /offline/,
  );
  assert.equal(
    (await authenticatedFetch("http://app.test/api/backend/v1/me")).status,
    200,
  );
  assert.equal(refreshes, 2);
});

test("a network error on a mutation is not retried", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("offline");
  };
  await assert.rejects(
    authenticatedFetch("http://app.test/api/backend/v1/applications", {
      method: "POST",
      body: "{}",
    }),
    /offline/,
  );
  assert.equal(calls, 1);
});

test("a non-JSON unauthorized response can refresh without consuming the original error", async () => {
  globalThis.fetch = async (request) =>
    request === "/api/session/refresh"
      ? json({}, 401)
      : new Response("Session expired", { status: 401 });
  const response = await authenticatedFetch(
    "http://app.test/api/backend/v1/me",
  );
  assert.equal(await response.text(), "Session expired");
});

test("logout supports a bodyless 204 and surfaces backend failures", async () => {
  const { session } = await import("../src/lib/api/client.ts");
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/session/logout");
    assert.equal(options.method, "POST");
    assert.equal(options.body, undefined);
    return new Response(null, { status: 204 });
  };
  assert.equal(await session("logout"), undefined);
  globalThis.fetch = async () => json({ detail: "Unavailable" }, 503);
  await assert.rejects(
    session("logout"),
    (error) => error instanceof ApiError && error.status === 503,
  );
});
