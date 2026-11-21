import assert from "node:assert/strict";
import { test } from "node:test";
import "./resolve-app.mjs";
const { createQueryClient } = await import("../src/lib/api/query-client.ts");
const {
  accountErrorMessage,
  accountMutations,
  compactProfile,
  isValidCpf,
  normalizePersonalProfile,
  toPersonalProfileInput,
  validatePersonalProfile,
} = await import("../src/lib/api/account.ts");
const { userResponseSchema } = await import("../src/lib/backend/contracts.ts");
const execute = (client, options, input) =>
  client.getMutationCache().build(client, options).execute(input);
const problem = (status) =>
  Response.json(
    { type: "about:blank", title: "Problem", status },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
const user = {
  id: "user",
  name: "Pessoa",
  email: "person@example.test",
  phone: null,
  location: null,
  roles: ["adopter"],
  profile: {},
  verification_status: "unverified",
  created_at: null,
  updated_at: null,
};

test("CPF checksum matches Go's validCPF", () => {
  assert.equal(isValidCpf("52998224725"), true);
  assert.equal(isValidCpf("52998224724"), false);
  assert.equal(isValidCpf("11111111111"), false);
  assert.equal(isValidCpf("5299822472"), false);
});

test("personal profile validation rejects future dates and non-HTTP links", () => {
  const empty = normalizePersonalProfile(
    toPersonalProfileInput(userResponseSchema.parse(user).profile),
  );
  assert.equal(validatePersonalProfile(empty), null);
  assert.match(
    validatePersonalProfile(
      { ...empty, birthDate: "2999-01-01" },
      new Date("2026-01-01"),
    ),
    /nascimento/,
  );
  assert.match(
    validatePersonalProfile({ ...empty, socialLinks: ["instagram.com/x"] }),
    /https/,
  );
  assert.equal(
    normalizePersonalProfile({ ...empty, cpf: "529.982.247-25" }).cpf,
    "52998224725",
  );
});

test("compactProfile omits values Go's schema would reject when empty", () => {
  assert.deepEqual(
    compactProfile({
      cpf: "",
      capacity: 0,
      allowOrganizationContact: false,
      address: { street: "", number: "" },
      socialLinks: [],
      occupation: "Vet",
    }),
    { capacity: 0, occupation: "Vet" },
  );
});

test("personal profile PATCH sends the full snake_case profile", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/me");
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), {
      profile: {
        cpf: "52998224725",
        address: { postal_code: "01000-000" },
        avatar_url: "https://api.test/v1/media/x",
        allow_organization_contact: true,
      },
    });
    return Response.json({
      ...user,
      profile: {
        cpf: "52998224725",
        avatar_url: "https://api.test/v1/media/x",
      },
    });
  });
  const profile = normalizePersonalProfile({
    ...toPersonalProfileInput({}),
    cpf: "52998224725",
    address: {
      postalCode: "01000-000",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
    },
    avatarUrl: "https://api.test/v1/media/x",
    allowOrganizationContact: true,
  });
  const result = await execute(
    client,
    accountMutations.updatePersonalProfile(),
    { profile },
  );
  assert.equal(result.profile.avatarUrl, "https://api.test/v1/media/x");
});

test("organization private profile PATCH omits untouched sections", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/organizations/org");
    assert.deepEqual(JSON.parse(options.body), {
      private_profile: {
        representative_cpf: "52998224725",
        documents: ["https://api.test/v1/media/d"],
        consent_document_review: true,
      },
    });
    return problem(422);
  });
  await assert.rejects(
    execute(client, accountMutations.updateOrganizationProfile(), {
      id: "org",
      changes: {
        privateProfile: {
          representativeName: "",
          representativeCpf: "52998224725",
          representativeEmail: "",
          representativePhone: "",
          documents: ["https://api.test/v1/media/d"],
          consentPublicContact: false,
          consentDocumentReview: true,
        },
      },
    }),
  );
});

test("account deletion sends the password and explains ownership conflicts", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push(JSON.parse(options.body));
    assert.equal(url, "/api/backend/v1/me");
    assert.equal(options.method, "DELETE");
    return calls.length === 1
      ? problem(409)
      : new Response(null, { status: 204 });
  });
  const failure = await execute(client, accountMutations.deleteAccount(), {
    password: "secret",
  }).catch((error) => error);
  assert.match(accountErrorMessage(failure, "delete"), /Transfira a gestão/);
  client.setQueryData(["session"], { id: "user" });
  await execute(client, accountMutations.deleteAccount(), {
    password: "secret",
  });
  assert.deepEqual(calls[0], { password: "secret" });
  assert.equal(client.getQueryData(["session"]), undefined);
});
