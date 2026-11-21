import assert from "node:assert/strict";
import { test } from "node:test";
import "./resolve-app.mjs";
const { createQueryClient } = await import("../src/lib/api/query-client.ts");
const { donationMutations, donationsOptions, donationKeys } =
  await import("../src/lib/api/donations.ts");
const { parseBrlAmount, parseTransferredAt, formatBrl } =
  await import("../src/components/donations/donation-format.ts");
const { donorLabel } =
  await import("../src/components/donations/donor-label.ts");
const { pageSummary } =
  await import("../src/components/donations/donation-pagination.ts");

const execute = (client, options, input) =>
  client.getMutationCache().build(client, options).execute(input);
const cents = (input) => {
  const result = parseBrlAmount(input);
  return result.ok ? result.cents : null;
};
const donation = {
  id: "donation",
  organization_id: "org",
  organization_name: "Patas Amigas",
  donor_id: null,
  donor_name: null,
  amount_cents: 123456,
  currency: "BRL",
  transferred_at: "2026-11-10T12:00:00Z",
  receipt_media_id: null,
  anonymous: true,
  note: "",
  status: "reported",
  decision_reason: null,
  created_at: "2026-11-10T12:05:00Z",
};

test("Brazilian amounts become exact integer cents", () => {
  assert.equal(cents("50"), 5000);
  assert.equal(cents("50,00"), 5000);
  assert.equal(cents("50,5"), 5050);
  assert.equal(cents("1.234,56"), 123456);
  assert.equal(cents("1.234"), 123400);
  assert.equal(cents("1.234.567,89"), 123456789);
  assert.equal(cents("R$ 10,99"), 1099);
  assert.equal(cents(" 0,01 "), 1);
  assert.equal(cents("0,29"), 29);
  assert.equal(cents("1,15"), 115);
  assert.equal(cents("4,35"), 435);
  assert.equal(cents("50.25"), 5025);
  assert.equal(cents("10000000"), 1_000_000_000);
});

test("invalid or out-of-range amounts are rejected", () => {
  for (const input of [
    "",
    "0",
    "0,00",
    "-5",
    "abc",
    "1,234",
    "12.34.56",
    "1.23,45",
    "10,",
    "1e3",
    "10000000,01",
    "99999999999999999999",
  ])
    assert.equal(cents(input), null, input);
});

test("transfer dates must not be in the future", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  assert.equal(parseTransferredAt("", now).ok, false);
  assert.equal(parseTransferredAt("not a date", now).ok, false);
  assert.equal(parseTransferredAt("2026-11-20T10:00", now).ok, false);
  const past = parseTransferredAt("2026-11-01T10:00", now);
  assert.equal(past.ok, true);
  assert.equal(new Date(past.iso).toISOString(), past.iso);
});

test("BRL formatting and anonymous donor labels", () => {
  assert.match(formatBrl(123456), /^R\$\s1\.234,56$/);
  assert.equal(
    donorLabel({ anonymous: true, donorName: null }),
    "Doação anônima",
  );
  assert.equal(donorLabel({ anonymous: false, donorName: "Ana" }), "Ana");
});

test("organization donation list sends organization_id and validates", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(
      url,
      "/api/backend/v1/donations?page=2&page_size=20&organization_id=org",
    );
    return Response.json({
      items: [donation],
      page: { page: 2, page_size: 20, total: 1 },
    });
  });
  const result = await client.fetchQuery(donationsOptions("org", 2));
  assert.equal(result.items[0].amountCents, 123456);
  assert.equal(result.items[0].donorName, null);
  assert.equal(result.items[0].organizationName, "Patas Amigas");
});

test("donation pages use Go's total across all pages", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const totals = { 1: 45, 3: 45, 4: 20 };
  t.mock.method(globalThis, "fetch", async (url) => {
    const page = Number(new URL(url, "http://x").searchParams.get("page"));
    return Response.json({
      items: Array.from({ length: page === 3 ? 5 : 20 }, (_, i) => ({
        ...donation,
        id: `donation-${page}-${i}`,
      })),
      page: { page, page_size: 20, total: totals[page] },
    });
  });
  const doacao = { one: "doação", other: "doações" };

  const first = await client.fetchQuery(donationsOptions(undefined, 1));
  assert.deepEqual(pageSummary(first.page, doacao), {
    totalLabel: "45 doações",
    pageLabel: "Página 1 de 3",
    hasPrevious: false,
    hasNext: true,
    isPaged: true,
  });

  const last = pageSummary(
    (await client.fetchQuery(donationsOptions(undefined, 3))).page,
    doacao,
  );
  assert.equal(last.pageLabel, "Página 3 de 3");
  assert.equal(last.hasNext, false);
  assert.equal(last.hasPrevious, true);

  // A full page is not proof of more: 20 of 20 is the only page.
  const full = await client.fetchQuery(donationsOptions("org", 4));
  assert.equal(full.items.length, 20);
  const exact = pageSummary({ ...full.page, page: 1 }, doacao);
  assert.equal(exact.hasNext, false);
  assert.equal(exact.isPaged, false);
  assert.equal(exact.pageLabel, "Página 1 de 1");

  assert.equal(
    pageSummary({ page: 1, pageSize: 20, total: 1 }, doacao).totalLabel,
    "1 doação",
  );
  assert.equal(
    pageSummary({ page: 1, pageSize: 20, total: 0 }, doacao).pageLabel,
    "Página 1 de 1",
  );
});

test("reporting a donation posts snake_case fields and refreshes donations", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  client.setQueryData(donationKeys.list(undefined, 1), { items: [] });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.includes("/donations?")) {
      return Response.json({
        items: [donation],
        page: { page: 1, page_size: 20, total: 1 },
      });
    }
    assert.equal(url, "/api/backend/v1/organizations/org/donations");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), {
      amount_cents: 123456,
      transferred_at: "2026-11-10T12:00:00.000Z",
      anonymous: true,
      receipt_media_id: "media",
    });
    return Response.json(donation, { status: 201 });
  });
  const created = await execute(client, donationMutations.report(), {
    organizationId: "org",
    amountCents: 123456,
    transferredAt: "2026-11-10T12:00:00.000Z",
    anonymous: true,
    receiptMediaId: "media",
  });
  assert.equal(created.status, "reported");
  assert.equal(
    client.getQueryState(donationKeys.list(undefined, 1))?.isInvalidated,
    true,
  );
});

test("decisions post status and reason", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/donations/donation/decision");
    assert.deepEqual(JSON.parse(options.body), {
      status: "not_found",
      reason: "Não consta no extrato",
    });
    return Response.json({
      donation: { ...donation, status: "not_found" },
      history: [
        {
          status: "not_found",
          reason: "Não consta no extrato",
          created_at: "2026-11-11T10:00:00Z",
        },
      ],
    });
  });
  const detail = await execute(client, donationMutations.decide(), {
    donationId: "donation",
    status: "not_found",
    reason: "Não consta no extrato",
  });
  assert.equal(detail.history.length, 1);
});
