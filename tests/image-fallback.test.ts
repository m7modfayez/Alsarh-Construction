import assert from "node:assert/strict";
import test from "node:test";
import { nextImageLoadState } from "../lib/image-fallback";

test("image delivery failure moves to the local placeholder, then an accessible empty state", () => {
  assert.equal(nextImageLoadState("original"), "fallback");
  assert.equal(nextImageLoadState("fallback"), "unavailable");
  assert.equal(nextImageLoadState("unavailable"), "unavailable");
});
