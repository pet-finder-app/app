import assert from "node:assert/strict";
import { test } from "node:test";
import { animal, conversation } from "./fixtures/backend.mjs";
import "./resolve-app.mjs";

const { createQueryClient } = await import("../src/lib/api/query-client.ts");
const { animalMutations, animalQueries, parseAnimalAttributes } =
  await import("../src/lib/api/animals.ts");
const { queryKeys } = await import("../src/lib/api/keys.ts");
const { fetchAnimalsFeedPage } =
  await import("../src/lib/api/use-animals-feed.ts");
const { createFeedUrl, readFeedQuery } =
  await import("../src/app/_components/feed-query.ts");
const execute = (client, options, input) =>
  client.getMutationCache().build(client, options).execute(input);
const draft = {
  name: "Pipoca",
  species: "rabbit",
  size: "small",
  sex: "female",
  description: "Coelha dócil que gosta de cenoura e colo.",
  location: { city: "Recife", state: "PE", countryCode: "BR" },
  attributes: {
    heightCm: 25,
    weightKg: 1.8,
    temperament: ["dócil"],
    vaccinated: true,
    energyLevel: "low",
  },
};

test("animal creation sends structured attributes in Go's snake_case", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/animals");
    assert.equal(options.method, "POST");
    const sent = JSON.parse(options.body);
    assert.equal(sent.species, "rabbit");
    assert.deepEqual(sent.attributes, {
      height_cm: 25,
      weight_kg: 1.8,
      temperament: ["dócil"],
      vaccinated: true,
      energy_level: "low",
    });
    return Response.json(animal, { status: 201 });
  });
  const result = await execute(client, animalMutations.save(), {
    animal: draft,
  });
  assert.equal(result.id, animal.id);
});

test("animal edits PATCH without the organization id", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, `/api/backend/v1/animals/${animal.id}`);
    assert.equal(options.method, "PATCH");
    assert.equal("organization_id" in JSON.parse(options.body), false);
    return Response.json(animal);
  });
  await execute(client, animalMutations.save(), {
    id: animal.id,
    animal: { ...draft, organizationId: "org" },
  });
});

test("stored attributes are read defensively", () => {
  assert.equal(parseAnimalAttributes(null), null);
  assert.deepEqual(
    parseAnimalAttributes({ height_cm: 30, energy_level: "high" })?.heightCm,
    30,
  );
  assert.equal(parseAnimalAttributes({ energy_level: "extreme" }), null);
});

test("archiving sends a reason and explains active-application conflicts", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, `/api/backend/v1/animals/${animal.id}/archive`);
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { reason: "Animal faleceu" });
    return Response.json(
      { title: "Conflict", status: 409, detail: "conflict" },
      { status: 409 },
    );
  });
  await assert.rejects(
    execute(client, animalMutations.archive(), {
      id: animal.id,
      reason: "Animal faleceu",
    }),
    /pedidos de adoção ativos/,
  );
});

test("deletion uses DELETE with a reason body and accepts 204", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  client.setQueryData(queryKeys.animal(animal.id), {});
  client.setQueryData([...queryKeys.inventory(), 1], {});
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, `/api/backend/v1/animals/${animal.id}`);
    assert.equal(options.method, "DELETE");
    assert.deepEqual(JSON.parse(options.body), {
      reason: "Cadastro duplicado",
    });
    return new Response(null, { status: 204 });
  });
  assert.equal(
    await execute(client, animalMutations.remove(), {
      id: animal.id,
      reason: "Cadastro duplicado",
    }),
    null,
  );
  assert.equal(
    client.getQueryState([...queryKeys.inventory(), 1]).isInvalidated,
    true,
  );
  assert.equal(
    client.getQueryState(queryKeys.animal(animal.id)).isInvalidated,
    false,
  );
});

test("reassignment PUTs the verified organization and reason", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, `/api/backend/v1/animals/${animal.id}/organization`);
    assert.equal(options.method, "PUT");
    assert.deepEqual(JSON.parse(options.body), {
      organization_id: "org-2",
      reason: "ONG mais próxima",
    });
    return Response.json(animal);
  });
  await execute(client, animalMutations.assignOrganization(), {
    id: animal.id,
    organizationId: "org-2",
    reason: "ONG mais próxima",
  });
});

test("image upload stores bytes through media before submitting the URL", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push(`${options.method} ${url}`);
    if (url === "/api/backend/v1/media") {
      assert.equal(JSON.parse(options.body).purpose, "animal");
      return Response.json(
        {
          id: "media",
          upload_url: "/v1/media/media/content",
          url: "https://api.example.test/v1/media/media",
          expires_at: "2026-11-15T12:00:00Z",
        },
        { status: 201 },
      );
    }
    if (url === "/api/backend/v1/media/media/content")
      return new Response(null, { status: 204 });
    assert.deepEqual(JSON.parse(options.body), {
      url: "https://api.example.test/v1/media/media",
      alt_text: "Pipoca",
      position: 2,
    });
    return Response.json(
      {
        id: "image",
        url: "https://api.example.test/v1/media/media",
        alt_text: "Pipoca",
        position: 2,
        moderation_status: "pending",
        created_at: null,
      },
      { status: 201 },
    );
  });
  const file = new File([new Uint8Array([1, 2, 3])], "pipoca.png", {
    type: "image/png",
  });
  const result = await execute(client, animalMutations.uploadImage(), {
    id: animal.id,
    file,
    altText: "Pipoca",
    position: 2,
  });
  assert.equal(result.moderationStatus, "pending");
  assert.deepEqual(calls, [
    "POST /api/backend/v1/media",
    "PUT /api/backend/v1/media/media/content",
    `POST /api/backend/v1/animals/${animal.id}/images`,
  ]);
});

test("organizations start a conversation with an interested person", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, `/api/backend/v1/animals/${animal.id}/conversations`);
    assert.deepEqual(JSON.parse(options.body), { user_id: "person" });
    return Response.json(conversation, { status: 201 });
  });
  const result = await execute(client, animalMutations.startConversation(), {
    id: animal.id,
    userId: "person",
  });
  assert.equal(result.id, conversation.id);
});

test("interest and analytics queries decode Go responses", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/analytics"))
      return Response.json({
        animal_statuses: { available: 2, archived: 1 },
        likes: 4,
        applications: 1,
        days: [{ date: "2026-11-15", likes: 4, applications: 1 }],
      });
    assert.equal(
      url,
      `/api/backend/v1/animals/${animal.id}/interest?page=2&page_size=20`,
    );
    return Response.json({
      like_count: 3,
      applicants: 1,
      people: [{ user_id: "person", name: "Ana" }],
      page: { page: 2, page_size: 20, total: 21 },
    });
  });
  const interest = await client.fetchQuery(
    animalQueries.interest(animal.id, 2),
  );
  assert.equal(interest.people[0].userId, "person");
  const analytics = await client.fetchQuery(animalQueries.analytics("org"));
  assert.equal(analytics.days.length, 1);
  assert.equal(analytics.animalStatuses.archived, 1);
});

const listedAnimal = {
  ...animal,
  status: "available",
  organization_name: "ONG de teste",
  organization_slug: "ong-de-teste",
  distance_score: null,
};
const notFound = () =>
  Response.json({ error: { message: "não encontrado" } }, { status: 404 });

test("the discovery species filter reaches the Go request URL", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const requested = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    if (!url.startsWith("/api/backend/v1/animals?")) return notFound();
    requested.push(new URL(url, "http://app").searchParams);
    return Response.json({
      items: [{ ...listedAnimal, species: "cat" }],
      page: { page: 1, page_size: 20, total: 1 },
    });
  });
  const page = await fetchAnimalsFeedPage(client, {
    mode: "discover",
    page: 1,
    coordinates: { lat: -8.05, lon: -34.9 },
    species: "cat",
  });
  assert.equal(page.items.length, 1);
  assert.equal(requested[0].get("species"), "cat");
  assert.equal(requested[0].get("latitude"), "-8.05");
  await fetchAnimalsFeedPage(client, { mode: "discover", page: 1 });
  assert.equal(requested[1].has("species"), false);
});

test("feed pages report more items from Go's total, not from a full page", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url) => {
    if (!url.startsWith("/api/backend/v1/animals?")) return notFound();
    const page = Number(new URL(url, "http://app").searchParams.get("page"));
    // A short page still has more when Go's total says so (e.g. filtered rows).
    return Response.json({
      items: [listedAnimal],
      page: { page, page_size: 20, total: 21 },
    });
  });
  const first = await fetchAnimalsFeedPage(client, {
    mode: "discover",
    page: 1,
  });
  assert.equal(first.hasMore, true);
  assert.equal(first.total, 21);
  const second = await fetchAnimalsFeedPage(client, {
    mode: "discover",
    page: 2,
  });
  assert.equal(second.hasMore, false);
});

test("the species filter round-trips through the feed URL", () => {
  const filters = readFeedQuery({ species: "rabbit", view: "grid" }, true);
  assert.equal(filters.species, "rabbit");
  assert.equal(readFeedQuery({ species: "dragon" }, true).species, null);
  const url = createFeedUrl("http://app/?species=cat", filters, null);
  assert.match(url, /species=rabbit/);
  assert.doesNotMatch(
    createFeedUrl(
      "http://app/?species=cat",
      { ...filters, species: null },
      null,
    ),
    /species=/,
  );
});
