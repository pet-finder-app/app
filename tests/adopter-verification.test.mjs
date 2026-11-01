import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyAdopterProfile,
  getAdopterChecklist,
  isAdopterReadyForReview,
} from "../src/lib/adopter.ts";

function completedProfile() {
  const profile = createEmptyAdopterProfile("Ana Silva");
  Object.assign(profile.personal, {
    personalTaxId: "52998224725",
    birthDate: "1990-01-01",
    phone: "11999999999",
    idDocument: {
      name: "document.pdf",
      size: 1024,
      mimeType: "application/pdf",
      uploadedAt: "2026-10-18T12:00:00.000Z",
      url: null,
    },
  });
  Object.assign(profile.personal.address, {
    postalCode: "01001000",
    street: "Praça da Sé",
    city: "São Paulo",
    state: "SP",
  });
  profile.housing.type = "house";
  profile.housing.ownership = "owned";
  profile.preferences.species = ["dog"];
  return profile;
}

test("verification tracks profile data without collecting terms acceptance again", () => {
  const profile = completedProfile();
  const before = JSON.stringify(profile);
  assert.equal(getAdopterChecklist(profile).length, 5);
  assert.ok(getAdopterChecklist(profile).every((item) => item.done));
  assert.equal(isAdopterReadyForReview(profile), true);
  assert.equal(JSON.stringify(profile), before);
  assert.equal(profile.legalConsent.terms, null);
});

test("registration acceptance is preserved and does not add a verification step", () => {
  const profile = completedProfile();
  const terms = {
    version: "signup-version",
    acceptedAt: "2026-10-01T12:00:00.000Z",
    ip: "127.0.0.1",
    userAgent: "test",
  };
  profile.legalConsent.terms = terms;
  const checklist = getAdopterChecklist(profile);
  assert.ok(
    checklist.every((item) =>
      ["personal", "housing", "preferences"].includes(item.section),
    ),
  );
  assert.equal(isAdopterReadyForReview(profile), true);
  assert.equal(profile.legalConsent.terms, terms);
});

test("missing required profile data still prevents review submission", () => {
  const profile = completedProfile();
  profile.personal.idDocument = null;
  assert.equal(isAdopterReadyForReview(profile), false);
  assert.equal(
    getAdopterChecklist(profile).find((item) => !item.done)?.id,
    "id-document",
  );
});
