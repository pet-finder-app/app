import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, jsonBody, requestJson } from "../src/lib/api/client.ts";

test("API errors preserve HTTP status and Portuguese server messages", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ message: "Sua sessão expirou." }, { status: 401 }),
  );
  await assert.rejects(
    requestJson("/api/backend/v1/me"),
    (error) =>
      error instanceof ApiError &&
      error.status === 401 &&
      error.message === "Sua sessão expirou.",
  );
});

test("requests pass cancellation signals and disable HTTP caching", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (path, options) => {
    assert.equal(path, "/api/example");
    assert.equal(options.signal, controller.signal);
    assert.equal(options.cache, "no-store");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { text: "Olá" });
    return Response.json({ ok: true });
  });
  assert.deepEqual(
    await requestJson("/api/example", {
      ...jsonBody({ text: "Olá" }),
      signal: controller.signal,
    }),
    { ok: true },
  );
});

test("network failures use a Portuguese message while cancellation is preserved", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(requestJson("/api/backend/v1/me"), {
    message: "Falha de conexão. Tente novamente.",
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    requestJson("/api/backend/v1/me", { signal: controller.signal }),
    { message: "Failed to fetch" },
  );
});

test("non-JSON errors preserve the status for authentication handling", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("Unauthorized", { status: 401 }),
  );
  await assert.rejects(
    requestJson("/api/backend/v1/me"),
    (error) => error instanceof ApiError && error.status === 401,
  );
});

test("API validation fields remain available to form error handling", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(
      { message: "Este e-mail já está cadastrado.", field: "email" },
      { status: 409 },
    ),
  );
  await assert.rejects(
    requestJson("/api/session/register"),
    (error) =>
      error instanceof ApiError &&
      error.field === "email" &&
      error.status === 409 &&
      error.isInternal,
  );
});

test("204 deletes need no JSON response body", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 204 }),
  );
  assert.equal(
    await requestJson("/api/backend/v1/organizations/id/members/user", {
      method: "DELETE",
    }),
    null,
  );
});

test("invalid OTP is a localized domain error, not a session expiry", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ title: "Invalid OTP" }, { status: 401 }),
  );
  await assert.rejects(
    requestJson("/api/backend/v1/appointments/id/confirmations"),
    (error) =>
      error instanceof ApiError &&
      !error.isAuthenticationFailure &&
      error.message.includes("Código inválido"),
  );
});
