import assert from "node:assert/strict";
import test from "node:test";

import { isLoginFormReady } from "../lib/login-form";

test("login form is ready only with a valid email and nonempty password", () => {
  assert.equal(isLoginFormReady("", "password"), false);
  assert.equal(isLoginFormReady("admin@example.com", ""), false);
  assert.equal(isLoginFormReady("not-an-email", "password"), false);
  assert.equal(isLoginFormReady(" admin@example.com ", "password"), true);
  assert.equal(isLoginFormReady("admin@example.com", " "), true);
});
