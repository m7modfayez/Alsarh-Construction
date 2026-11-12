import assert from "node:assert/strict";
import test from "node:test";

import {
  getAdjacentGalleryIndex,
  getGalleryKeyAction,
} from "../lib/gallery-navigation";

test("gallery navigation wraps through only the current project's images", () => {
  assert.equal(getAdjacentGalleryIndex(0, "previous", 4), 3);
  assert.equal(getAdjacentGalleryIndex(3, "next", 4), 0);
  assert.equal(getAdjacentGalleryIndex(1, "next", 4), 2);
});

test("gallery keyboard actions cover arrows and Escape only", () => {
  assert.equal(getGalleryKeyAction("ArrowLeft"), "previous");
  assert.equal(getGalleryKeyAction("ArrowRight"), "next");
  assert.equal(getGalleryKeyAction("Escape"), "close");
  assert.equal(getGalleryKeyAction("Enter"), null);
});

test("empty galleries do not produce a negative navigation index", () => {
  assert.equal(getAdjacentGalleryIndex(0, "previous", 0), 0);
});
