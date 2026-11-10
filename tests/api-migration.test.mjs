import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { appRoot } from "./resolve-app.mjs";
const { createQueryClient } = await import("../src/lib/api/query-client.ts");
const { apiMutations } = await import("../src/lib/api/mutations.ts");
const { queryKeys } = await import("../src/lib/api/keys.ts");
const { userResponseSchema, collectionResponseOrganizationResponseSchema } =
  await import("../src/lib/backend/contracts.ts");
const { toWire } = await import("../src/lib/backend/wire.ts");
const execute = (client, options, input) =>
  client.getMutationCache().build(client, options).execute(input);
const user = {
  id: "user",
  name: "Pessoa",
  email: "person@example.test",
  phone: null,
  location: null,
  roles: ["adopter", "advertiser"],
  created_at: null,
  updated_at: null,
};

test("wire responses validate and map nullable backend fields", () => {
  assert.deepEqual(userResponseSchema.parse(user).roles, [
    "adopter",
    "advertiser",
  ]);
  assert.equal(userResponseSchema.parse(user).createdAt, null);
  assert.equal(
    userResponseSchema.safeParse({ id: "incomplete" }).success,
    false,
  );
  assert.deepEqual(
    collectionResponseOrganizationResponseSchema.parse({
      items: null,
      page: { page: 1, page_size: 100, total: 0 },
    }).items,
    [],
  );
  assert.deepEqual(
    toWire({ officialChannels: { phone: "123" }, acceptedTerms: true }),
    { official_channels: { phone: "123" }, accepted_terms: true },
  );
});

test("preferences use the Go PUT contract and invalidate related caches", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/animals/animal/preference");
    assert.equal(options.method, "PUT");
    assert.deepEqual(JSON.parse(options.body), { value: "liked" });
    return Response.json({
      animal_id: "animal",
      user_id: "user",
      preference: "liked",
      created_at: null,
      updated_at: null,
    });
  });
  for (const key of [
    queryKeys.animals,
    queryKeys.preferences,
    queryKeys.conversations,
  ])
    client.setQueryData(key, []);
  assert.deepEqual(
    await execute(client, apiMutations.like(), { type: "pet", id: "animal" }),
    { liked: true },
  );
  assert.equal(client.getQueryState(queryKeys.animals).isInvalidated, true);
  assert.equal(client.getQueryState(queryKeys.preferences).isInvalidated, true);
  assert.equal(
    client.getQueryState(queryKeys.conversations).isInvalidated,
    false,
  );
});

test("unsupported preference clears and posts never reach a fabricated route", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", () => {
    assert.fail("unsupported operation made an HTTP request");
  });
  await assert.rejects(
    execute(client, apiMutations.hidePet(), { id: "animal", hidden: false }),
  );
  await assert.rejects(
    execute(client, apiMutations.like(), { id: "post", type: "post" }),
  );
});

test("credentials and OTP failures preserve the session; expired bearer sessions clear it", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const session = { id: "user", role: "adopter" };
  client.setQueryData(queryKeys.session, session);
  let title = "Unauthorized";
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ title }, { status: 401 }),
  );
  await assert.rejects(
    execute(client, apiMutations.login(), {
      email: user.email,
      password: "wrong",
    }),
  );
  assert.deepEqual(client.getQueryData(queryKeys.session), session);
  title = "Invalid OTP";
  await assert.rejects(
    execute(client, apiMutations.confirmAppointment(), {
      id: "appointment",
      type: "receipt",
      otpCode: "wrong",
    }),
  );
  assert.deepEqual(client.getQueryData(queryKeys.session), session);
  title = "Unauthorized";
  await assert.rejects(
    execute(client, apiMutations.like(), { id: "animal", type: "pet" }),
  );
  assert.equal(client.getQueryData(queryKeys.session), null);
});

test("account changes cancel pending reads and clear previous private caches", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  let aborted = false;
  const pending = client
    .fetchQuery({
      queryKey: queryKeys.messages("old-chat"),
      queryFn: ({ signal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener(
            "abort",
            () => {
              aborted = true;
              reject(new Error("Aborted"));
            },
            { once: true },
          ),
        ),
    })
    .catch(() => undefined);
  client.setQueryData(queryKeys.profile, { id: "old-user" });
  t.mock.method(globalThis, "fetch", async () => Response.json({ user }));
  await execute(client, apiMutations.login(), {
    email: user.email,
    password: "password12345",
  });
  await pending;
  assert.equal(aborted, true);
  assert.equal(client.getQueryCache().getAll().length, 0);
});

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}
test("only thin Next handlers remain and browser components use the API layer", () => {
  assert.deepEqual(
    files(path.join(appRoot, "src/app/api"))
      .filter((file) => file.endsWith("route.ts"))
      .map((file) => path.relative(appRoot, file))
      .sort(),
    [
      "src/app/api/backend/[...path]/route.ts",
      "src/app/api/location/route.ts",
      "src/app/api/session/[action]/route.ts",
    ],
  );
  for (const file of files(path.join(appRoot, "src")).filter((file) =>
    /\.tsx?$/.test(file),
  )) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /node:fs|src\/data\/|lib\/storage/);
    if (source.includes('"use client"'))
      assert.doesNotMatch(source, /\bfetch\s*\(/, file);
  }
});
