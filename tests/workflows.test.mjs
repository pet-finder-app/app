import assert from "node:assert/strict";
import { test } from "node:test";
import "./resolve-app.mjs";
const { createQueryClient } = await import("../src/lib/api/query-client.ts");
const { queryKeys } = await import("../src/lib/api/keys.ts");
const {
  applicationAgreementOptions,
  invalidPlaceholders,
  ownAnimalsOptions,
  surrendersOptions,
  workflowKeys,
  workflowMutations,
} = await import("../src/lib/api/workflows.ts");
const { surrenderResponseSchema } =
  await import("../src/lib/backend/contracts.ts");
const execute = (client, options, input) =>
  client.getMutationCache().build(client, options).execute(input);

const sha = "a".repeat(64);
const agreement = {
  id: "agreement",
  template_id: "template",
  body: "Pessoa adota Rex.",
  sha256: sha,
  user_id: "adopter",
  representative_id: "rep",
  created_at: "2026-11-15T12:00:00Z",
  signatures: [
    { signer_id: "adopter", sha256: sha, signed_at: "2026-11-15T12:01:00Z" },
  ],
};

test("signing codes accept Go's empty 202 and explain unavailable e-mail", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  let status = 202;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/agreements/agreement/signing-code");
    assert.equal(options.method, "POST");
    return status === 202
      ? new Response(null, { status })
      : Response.json({ title: "Email unavailable", status }, { status });
  });
  assert.equal(
    await execute(client, workflowMutations.sendSigningCode(), "agreement"),
    undefined,
  );
  status = 503;
  await assert.rejects(
    execute(client, workflowMutations.sendSigningCode(), "agreement"),
    /envio de e-mails não está configurado/,
  );
  status = 429;
  await assert.rejects(
    execute(client, workflowMutations.sendSigningCode(), "agreement"),
    /Aguarde antes de pedir outro/,
  );
});

test("signatures send the displayed hash with explicit acceptance and refresh caches", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/agreements/agreement/signatures");
    assert.deepEqual(JSON.parse(options.body), {
      code: "123456",
      sha256: sha,
      accept: true,
    });
    return Response.json(agreement);
  });
  for (const key of [
    workflowKeys.agreement("agreement"),
    queryKeys.application("app"),
    workflowKeys.surrender("case"),
    queryKeys.conversations,
  ])
    client.setQueryData(key, {});
  const signed = await execute(client, workflowMutations.signAgreement(), {
    id: "agreement",
    code: "123456",
    sha256: sha,
  });
  assert.equal(signed.signatures[0].signerId, "adopter");
  for (const key of [
    workflowKeys.agreement("agreement"),
    queryKeys.application("app"),
    workflowKeys.surrender("case"),
  ])
    assert.equal(client.getQueryState(key).isInvalidated, true);
  assert.equal(
    client.getQueryState(queryKeys.conversations).isInvalidated,
    false,
  );
});

test("a missing application agreement is an empty state, not an error", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ title: "Resource not found" }, { status: 404 }),
  );
  assert.equal(
    await client.fetchQuery(applicationAgreementOptions("app")),
    null,
  );
  assert.deepEqual(workflowKeys.applicationAgreement("app").slice(0, 3), [
    ...queryKeys.application("app"),
  ]);
});

test("administrative cancellation posts the reason and maps conflicts", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/applications/app/cancellation");
    assert.deepEqual(JSON.parse(options.body), { reason: "Animal faleceu" });
    return Response.json({ title: "Conflict" }, { status: 409 });
  });
  await assert.rejects(
    execute(client, workflowMutations.cancelApplication(), {
      id: "app",
      reason: "Animal faleceu",
    }),
    /não pode mais ser cancelado/,
  );
});

test("surrender requests use Go's snake_case fields", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/surrenders");
    assert.deepEqual(JSON.parse(options.body), {
      organization_id: "org",
      kind: "intake",
      reason: "Preciso que a ONG acolha este animal agora.",
      documents: ["media"],
      animal: {
        name: "Rex",
        species: "dog",
        sex: "male",
        size: "medium",
        description: "Cachorro dócil e muito brincalhão.",
        approximate_birth_date: "2024-01-01",
        location: { city: "Recife", state: "PE", country_code: "BR" },
      },
    });
    return Response.json({ title: "Conflict" }, { status: 409 });
  });
  await assert.rejects(
    execute(client, workflowMutations.createSurrender(), {
      organizationId: "org",
      kind: "intake",
      reason: "Preciso que a ONG acolha este animal agora.",
      documents: ["media"],
      animal: {
        name: "Rex",
        species: "dog",
        sex: "male",
        size: "medium",
        description: "Cachorro dócil e muito brincalhão.",
        approximateBirthDate: "2024-01-01",
        location: { city: "Recife", state: "PE", countryCode: "BR" },
      },
    }),
    /ONG precisa estar verificada/,
  );
});

test("surrender projections with decision history parse", () => {
  const parsed = surrenderResponseSchema.parse({
    id: "case",
    organization_id: "org",
    organization_name: "ONG Patas",
    requester_id: "user",
    requester_name: "Maria Souza",
    kind: "return",
    animal_id: "animal",
    application_id: "app",
    animal: {
      name: "Rex",
      species: "dog",
      sex: "male",
      size: "medium",
      description: "Cachorro dócil e muito brincalhão.",
      location: { city: "Recife", state: "PE", country_code: "BR" },
    },
    reason: "Mudança de cidade impede os cuidados.",
    documents: null,
    status: "accepted",
    review_reason: "Aceito",
    created_at: "2026-11-15T12:00:00Z",
    updated_at: "2026-11-15T12:00:00Z",
    delivered_at: null,
    received_at: null,
    completed_at: null,
    agreement_id: null,
    history: [
      {
        action: "accepted",
        notes: "Aceito",
        actor_id: "rep",
        actor_name: "Ana Lima",
        created_at: "2026-11-15T12:00:00Z",
      },
    ],
  });
  assert.deepEqual(parsed.documents, []);
  assert.equal(parsed.history[0].snapshot, undefined);
  assert.equal(parsed.history[0].actorName, "Ana Lima");
  assert.equal(parsed.requesterName, "Maria Souza");
  assert.equal(parsed.organizationName, "ONG Patas");
});

test("template placeholders follow Go's supported list", () => {
  assert.deepEqual(
    invalidPlaceholders(
      "{{user_name}} adota {{animal_name}} de {{organization_name}} em {{date}}.",
    ),
    [],
  );
  assert.deepEqual(invalidPlaceholders("{{nome}} e {{date}"), [
    "{{nome}}",
    "{{ }}",
  ]);
});

const followup = {
  id: "fu",
  application_id: "app",
  due_at: "2030-01-01T12:00:00Z",
  instructions: "Envie fotos recentes.",
  status: "scheduled",
  closed_at: null,
  cancellation_reason: null,
  reports: [],
  reviews: [],
};

test("follow-up updates PATCH only the changed fields and refresh caches", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, method: options.method, body: JSON.parse(options.body) });
    return Response.json({
      ...followup,
      due_at: "2030-02-01T12:00:00Z",
    });
  });
  for (const key of [
    workflowKeys.followup("fu"),
    workflowKeys.applicationFollowups("app"),
  ])
    client.setQueryData(key, {});
  const updated = await execute(client, workflowMutations.updateFollowup(), {
    id: "fu",
    dueAt: "2030-02-01T12:00:00.000Z",
  });
  assert.deepEqual(calls, [
    {
      url: "/api/backend/v1/follow-ups/fu",
      method: "PATCH",
      body: { due_at: "2030-02-01T12:00:00.000Z" },
    },
  ]);
  assert.equal(updated.dueAt, "2030-02-01T12:00:00Z");
  for (const key of [
    workflowKeys.followup("fu"),
    workflowKeys.applicationFollowups("app"),
  ])
    assert.equal(client.getQueryState(key).isInvalidated, true);
});

test("follow-up updates explain closed tasks in Portuguese", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ title: "Conflict" }, { status: 409 }),
  );
  await assert.rejects(
    execute(client, workflowMutations.updateFollowup(), {
      id: "fu",
      instructions: "Nova orientação",
    }),
    /não pode mais ser alterado/,
  );
});

test("follow-up cancellation posts the reason and parses the cancelled task", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  let status = 200;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/follow-ups/fu/cancellation");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), {
      reason: "Adotante mudou de país",
    });
    return status === 200
      ? Response.json({
          ...followup,
          status: "cancelled",
          closed_at: "2026-11-20T12:00:00Z",
          cancellation_reason: "Adotante mudou de país",
        })
      : Response.json({ title: "Conflict" }, { status });
  });
  const cancelled = await execute(client, workflowMutations.cancelFollowup(), {
    id: "fu",
    reason: "Adotante mudou de país",
  });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.cancellationReason, "Adotante mudou de país");
  status = 409;
  await assert.rejects(
    execute(client, workflowMutations.cancelFollowup(), {
      id: "fu",
      reason: "Adotante mudou de país",
    }),
    /já foi encerrado ou cancelado/,
  );
});

test("agreement creation conflicts mention completed adoptions", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "/api/backend/v1/applications/app/agreement");
    return Response.json({ title: "Conflict" }, { status: 409 });
  });
  await assert.rejects(
    execute(client, workflowMutations.createAgreement(), {
      subject: "application",
      id: "app",
      templateId: "t",
      representativeId: "rep",
    }),
    /aprovado nem concluído/,
  );
});

test("surrender lists and own animals page with Go's real totals", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    const page = Number(new URL(url, "http://x").searchParams.get("page"));
    const pageSize = Number(
      new URL(url, "http://x").searchParams.get("page_size"),
    );
    return Response.json({
      items: [],
      page: { page, page_size: pageSize, total: pageSize + 1 },
    });
  });
  const surrenders = surrendersOptions("org");
  const first = await client.fetchInfiniteQuery(surrenders);
  assert.equal(surrenders.getNextPageParam(first.pages[0], first.pages), 2);
  const animals = ownAnimalsOptions();
  const mine = await client.fetchInfiniteQuery(animals);
  assert.equal(animals.getNextPageParam(mine.pages[0], mine.pages), 2);
  assert.equal(
    animals.getNextPageParam(
      { items: [], page: { page: 2, pageSize: 50, total: 51 } },
      mine.pages,
    ),
    undefined,
  );
  assert.deepEqual(urls, [
    "/api/backend/v1/surrenders?page=1&page_size=20&organization_id=org",
    "/api/backend/v1/me/animals?page=1&page_size=50",
  ]);
});
