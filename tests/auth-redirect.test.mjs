import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isPublicPath,
  loginUrl,
  redirectPage,
} from "../src/lib/auth-redirect.ts";

test("login destinations preserve path, filters, and fragments", () => {
  const page = "/adopter/discover?view=grid&city=Recife#pet";
  assert.equal(
    new URL(loginUrl(page), "https://app.test").searchParams.get("page"),
    page,
  );
  assert.equal(redirectPage(page), page);
});

test("unsafe and non-application destinations fall back to home", () => {
  for (const page of [
    undefined,
    ["/me"],
    "https://other.test",
    "//other.test",
    "/\\other.test",
    "javascript:alert(1)",
    "/login?page=/me",
    "/register/",
    "/forgot-password",
    "/reset-password",
    "/terms",
    "/api/auth/logout",
    "/_next/static/app.js",
    "/\n/other.test",
  ]) {
    assert.equal(redirectPage(page), "/", String(page));
  }
  assert.equal(redirectPage("/me"), "/me");
});

test("only exact public routes, with optional trailing slashes, bypass protection", () => {
  for (const path of [
    "/login",
    "/register/",
    "/forgot-password",
    "/reset-password",
    "/terms/",
  ])
    assert.equal(isPublicPath(path), true);
  for (const path of [
    "/",
    "/me",
    "/pets/pet-1",
    "/login/anything",
    "/ngo/settings",
  ])
    assert.equal(isPublicPath(path), false);
});
