import assert from "node:assert/strict";
import { test } from "node:test";
import {
  animal,
  application,
  appointment,
  collection,
  confirmation,
  conversation,
  image,
  message,
  organization,
} from "./fixtures/backend.mjs";
import "./resolve-app.mjs";

const { createQueryClient } = await import("../src/lib/api/query-client.ts");
const { apiMutations } = await import("../src/lib/api/mutations.ts");
const { queryKeys } = await import("../src/lib/api/keys.ts");
const {
  animalInventoryOptions,
  applicationAppointmentsOptions,
  applicationOptions,
  appointmentOptions,
  messageHistoryOptions,
  myOrganizationsOptions,
} = await import("../src/lib/api/queries.ts");
const execute = (client, options, input) =>
  client.getMutationCache().build(client, options).execute(input);

test("memberships include pending organizations and invited memberships without private fields", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "/api/backend/v1/me/organizations?page=2&page_size=100");
    return Response.json(
      collection(
        [
          { organization, membership_status: "active", member_role: "owner" },
          {
            organization: {
              ...organization,
              id: "invited",
              legal_name: undefined,
              registration_number: undefined,
            },
            membership_status: "invited",
            member_role: "representative",
          },
        ],
        2,
      ),
    );
  });
  const result = await client.fetchQuery(myOrganizationsOptions(2));
  assert.equal(result.items[0].organization.verificationStatus, "pending");
  assert.equal(result.items[0].membershipStatus, "active");
  assert.equal(result.items[1].membershipStatus, "invited");
  assert.equal(result.items[1].organization.legalName, undefined);
});

test("inventory uses private endpoints, pagination, and server status filters", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    return Response.json(collection([{ ...animal, status: "adopted" }], 2, 20));
  });
  const owned = await client.fetchQuery(
    animalInventoryOptions(undefined, undefined, 2),
  );
  const inventory = await client.fetchQuery(
    animalInventoryOptions(organization.id, "adopted", 2),
  );
  assert.equal(owned.items[0].submittedBy, animal.submitted_by);
  assert.equal(inventory.items[0].status, "adopted");
  assert.deepEqual(urls, [
    "/api/backend/v1/me/animals?page=2&page_size=20",
    `/api/backend/v1/organizations/${organization.id}/animals?page=2&page_size=20&status=adopted`,
  ]);
});

test("unlike and unhide use idempotent DELETE and invalidate discovery and preference caches", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.equal(url, `/api/backend/v1/animals/${animal.id}/preference`);
    assert.equal(options.method, "DELETE");
    assert.equal(options.body, undefined);
    return new Response(null, { status: 204 });
  });
  for (const key of [queryKeys.animals, queryKeys.preferences])
    client.setQueryData(key, []);
  assert.deepEqual(
    await execute(client, apiMutations.like(), {
      type: "pet",
      id: animal.id,
      liked: true,
    }),
    { liked: false },
  );
  assert.deepEqual(
    await execute(client, apiMutations.hidePet(), {
      id: animal.id,
      hidden: false,
    }),
    { disliked: false },
  );
  assert.deepEqual(
    await execute(client, apiMutations.hidePet(), {
      id: animal.id,
      hidden: false,
    }),
    { disliked: false },
  );
  assert.equal(calls, 3);
  for (const key of [queryKeys.animals, queryKeys.preferences])
    assert.equal(client.getQueryState(key).isInvalidated, true);
});

test("double-tap on a liked animal remains an idempotent PUT", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.method, "PUT");
    assert.deepEqual(JSON.parse(options.body), { value: "liked" });
    return Response.json({
      animal_id: animal.id,
      user_id: "user",
      preference: "liked",
      created_at: null,
      updated_at: null,
    });
  });
  assert.deepEqual(
    await execute(client, apiMutations.like(), {
      type: "pet",
      id: animal.id,
      liked: true,
      onlyLike: true,
    }),
    { liked: true },
  );
});

test("image moderation decodes the database response and refreshes animal galleries", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  client.setQueryData(queryKeys.animal(animal.id), {});
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(
      url,
      `/api/backend/v1/animals/${animal.id}/images/${image.id}/moderation`,
    );
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { decision: "approved" });
    return Response.json({ ...image, moderation_status: "approved" });
  });
  const result = await execute(client, apiMutations.moderateImage(), {
    id: animal.id,
    imageId: image.id,
    decision: "approved",
  });
  assert.equal(result.moderationStatus, "approved");
  assert.equal(
    client.getQueryState(queryKeys.animal(animal.id)).isInvalidated,
    true,
  );
});

test("withdrawal sends a reason, refreshes workflows, and never retries a state conflict", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const keys = [
    queryKeys.application(application.id),
    queryKeys.conversations,
    queryKeys.appointments,
  ];
  for (const key of keys) client.setQueryData(key, {});
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.equal(
      url,
      `/api/backend/v1/applications/${application.id}/withdrawal`,
    );
    assert.deepEqual(JSON.parse(options.body), {
      reason: "Minha situação mudou.",
    });
    return calls === 1
      ? Response.json({ ...application, status: "withdrawn" })
      : Response.json({ title: "Conflict" }, { status: 409 });
  });
  const input = { id: application.id, reason: "Minha situação mudou." };
  assert.equal(
    (await execute(client, apiMutations.withdrawApplication(), input)).status,
    "withdrawn",
  );
  for (const key of keys)
    assert.equal(client.getQueryState(key).isInvalidated, true);
  await assert.rejects(
    execute(client, apiMutations.withdrawApplication(), input),
    { status: 409 },
  );
  assert.equal(calls, 2);
});

test("application details recover accessible conversation references after reload", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      application: {
        ...application,
        animal_name: animal.name,
        animal_status: animal.status,
        animal_species: animal.species,
        animal_size: animal.size,
        adopter_name: "Pessoa",
        adopter_verification_status: "verified",
        adopter_email: "person@example.test",
        organization_name: organization.name,
      },
      history: [],
      conversations: [conversation],
    }),
  );
  const result = await client.fetchQuery(applicationOptions(application.id));
  assert.equal(result.conversations[0].id, conversation.id);
  assert.equal(result.conversations[0].applicationId, application.id);
});

test("appointment reads recover completed records and confirmations without OTP data", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url) =>
    url.includes("/applications/")
      ? Response.json({ items: [{ ...appointment, status: "completed" }] })
      : Response.json({
          appointment: { ...appointment, status: "completed" },
          confirmations: [confirmation],
          otp_code: "must-not-be-cached",
        }),
  );
  const list = await client.fetchQuery(
    applicationAppointmentsOptions(application.id),
  );
  const detail = await client.fetchQuery(appointmentOptions(appointment.id));
  assert.equal(list.items[0].status, "completed");
  assert.equal(detail.confirmations[0].confirmation, "animal_delivered");
  assert.equal("otp_code" in detail, false);
});

test("appointment changes invalidate both appointment lists and details", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const keys = [
    queryKeys.applicationAppointments(application.id),
    queryKeys.appointment(appointment.id),
  ];
  for (const key of keys) client.setQueryData(key, {});
  t.mock.method(globalThis, "fetch", async () => Response.json(appointment));
  await execute(client, apiMutations.updateAppointment(), {
    id: appointment.id,
    changes: { status: "scheduled" },
  });
  for (const key of keys)
    assert.equal(client.getQueryState(key).isInvalidated, true);
});

test("chat history uses the oldest message ID as an exclusive cursor and polling preserves older pages", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    return Response.json(
      collection(
        url.includes("before=")
          ? [message(1)]
          : Array.from({ length: 100 }, (_, index) => message(101 - index)),
      ),
    );
  });
  const options = messageHistoryOptions(conversation.id);
  const first = await client.fetchInfiniteQuery(options);
  const cursor = options.getNextPageParam(first.pages[0]);
  assert.equal(cursor, message(2).id);
  const result = await client.fetchInfiniteQuery({ ...options, pages: 2 });
  assert.equal(result.pages.length, 2);
  assert.equal(result.pages[1].items[0].body, "Mensagem 1");
  assert.equal(options.getNextPageParam(result.pages[1]), undefined);
  const olderUrl = `/api/backend/v1/conversations/${conversation.id}/messages?page_size=100&before=${message(2).id}`;
  assert.equal(urls.at(-1), olderUrl);
  await client.invalidateQueries({ queryKey: options.queryKey });
  const refreshed = await client.fetchInfiniteQuery(options);
  assert.equal(refreshed.pages.length, 2);
  assert.equal(urls.at(-1), olderUrl);
});

test("malformed inventory responses never enter the query cache", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(collection([{ id: animal.id }])),
  );
  const options = animalInventoryOptions(organization.id);
  await assert.rejects(
    client.fetchQuery({ ...options, retry: false }),
    /Resposta inválida/,
  );
  assert.equal(client.getQueryData(options.queryKey), undefined);
});
