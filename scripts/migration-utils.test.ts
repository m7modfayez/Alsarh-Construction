import assert from "node:assert/strict";
import test from "node:test";
import { animatedImageReason, cloudinaryApiError, cloudinaryDeliveryUrlMismatch, cloudinaryResourceMismatch, cloudinaryUploadContext, deterministicPublicId, lookupCloudinaryImageResource, matchesOptimizedContent, selectLargestSupportedImages, selectSupportedImages, sha256, supportsMigrationFormat, unsupportedFormatReason, validateSelectionOptions } from "./migration-utils";

test("selects exactly five supported images in stable path order", () => {
  const files = [
    { name: "z-last.jpg" },
    { name: "animated.gif" },
    { name: "a-first.jpeg" },
    { name: "d-four.png" },
    { name: "c-three.JPG" },
    { name: "unsupported.webp" },
    { name: "b-two.png" },
    { name: "e-five.jpg" },
  ];

  const selected = selectSupportedImages(files, 5);

  assert.deepEqual(selected.map((file) => file.name), [
    "a-first.jpeg",
    "b-two.png",
    "c-three.JPG",
    "d-four.png",
    "e-five.jpg",
  ]);
  assert.equal(selected.length, 5);
});

test("does not count animated or unsupported extensions as supported migration inputs", () => {
  assert.equal(supportsMigrationFormat({ name: "still.png" }), true);
  assert.equal(supportsMigrationFormat({ name: "motion.gif" }), false);
  assert.equal(supportsMigrationFormat({ name: "animation.webp" }), false);
  assert.equal(supportsMigrationFormat({ name: "vector.svg" }), false);
  assert.match(unsupportedFormatReason({ name: "motion.gif" }), /may be animated/);
  assert.match(unsupportedFormatReason({ name: "clip.avif" }), /only JPEG and PNG/);
  assert.match(animatedImageReason("png", 2) ?? "", /animation is not flattened/);
  assert.equal(animatedImageReason("jpeg", 1), undefined);
  assert.throws(() => selectSupportedImages([{ name: "1.jpg" }, { name: "2.png" }], 5), /only 2 were found/);
});

test("selects the largest supported images by descending original size", () => {
  const files = [{ name: "small.jpg" }, { name: "large.png" }, { name: "medium.jpeg" }];
  const sizes = new Map([["small.jpg", 100], ["large.png", 900], ["medium.jpeg", 400]]);

  assert.deepEqual(selectLargestSupportedImages(files, sizes, 2).map((file) => file.name), ["large.png", "medium.jpeg"]);
});

test("breaks largest-image size ties by ascending object path", () => {
  const files = [{ name: "z/equal.jpg" }, { name: "a/equal.png" }, { name: "m/smaller.jpg" }];
  const sizes = new Map([["z/equal.jpg", 500], ["a/equal.png", 500], ["m/smaller.jpg", 300]]);

  assert.deepEqual(selectLargestSupportedImages(files, sizes, 2).map((file) => file.name), ["a/equal.png", "z/equal.jpg"]);
});

test("filters unsupported file types before selecting largest images", () => {
  const files = [{ name: "largest.gif" }, { name: "photo.jpg" }, { name: "second.png" }, { name: "vector.svg" }];
  const sizes = new Map([["photo.jpg", 100], ["second.png", 50]]);

  assert.deepEqual(selectLargestSupportedImages(files, sizes, 2).map((file) => file.name), ["photo.jpg", "second.png"]);
  assert.throws(() => selectLargestSupportedImages(files, sizes, 3), /only 2 were found/);
});

test("rejects combining --largest and --limit rather than silently choosing one", () => {
  assert.doesNotThrow(() => validateSelectionOptions(5));
  assert.doesNotThrow(() => validateSelectionOptions(undefined, 5));
  assert.throws(() => validateSelectionOptions(5, 5), /cannot be used together/);
});

test("resumes a prior asset only when its optimized content hash matches this run", () => {
  assert.equal(matchesOptimizedContent("same-hash", "same-hash"), true);
  assert.equal(matchesOptimizedContent("old-hash", "new-hash"), false);
  assert.equal(matchesOptimizedContent(undefined, "new-hash"), false);
});

test("accepts only the exact Cloudinary image/upload WebP delivery URL for an ID", () => {
  const id = "supabase-projects/path-hash-source-hash";
  assert.equal(cloudinaryDeliveryUrlMismatch(`https://res.cloudinary.com/demo/image/upload/v123/${id}.webp`, "demo", id), undefined);
  assert.equal(cloudinaryDeliveryUrlMismatch(`https://res.cloudinary.com/demo/image/upload/${id}.webp`, "demo", id), undefined);
  assert.match(cloudinaryDeliveryUrlMismatch(`https://res.cloudinary.com/other/image/upload/${id}.webp`, "demo", id) ?? "", /cloud name/);
  assert.match(cloudinaryDeliveryUrlMismatch(`https://res.cloudinary.com/demo/image/private/${id}.webp`, "demo", id) ?? "", /image\/upload/);
  assert.match(cloudinaryDeliveryUrlMismatch(`https://res.cloudinary.com/demo/image/upload/${id}-other.webp`, "demo", id) ?? "", /public_id/);
});

test("hashes source bytes and makes IDs stable per path and source version", () => {
  const contentHash = sha256(Buffer.from("image bytes"));
  assert.equal(contentHash, "de7030234493a8bea844dbe1d8676e68a2c1a4b014c721f0425a22b6df66faec");
  assert.equal(deterministicPublicId("folder/a.jpg", contentHash), deterministicPublicId("folder/a.jpg", contentHash));
  assert.notEqual(deterministicPublicId("folder/a.jpg", contentHash), deterministicPublicId("folder/a.jpg", sha256(Buffer.from("changed bytes"))));
  assert.notEqual(deterministicPublicId("folder/a.jpg", contentHash), deterministicPublicId("folder/a.jpg", contentHash, sha256(Buffer.from("optimized"))));
});

test("validates Cloudinary image/upload WebP assets against the same public id and secure URL", () => {
  const expected = {
    publicId: "supabase-projects/abc-sourcehash",
    secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/supabase-projects/abc-sourcehash.webp",
    sourceSha256: "sourcehash",
    optimizedSha256: "optimizedhash",
  };
  const resource = {
    public_id: expected.publicId,
    secure_url: expected.secureUrl,
    resource_type: "image",
    type: "upload",
    format: "webp",
    context: { custom: { source_sha256: expected.sourceSha256, optimized_sha256: expected.optimizedSha256 } },
  };

  assert.equal(cloudinaryResourceMismatch(expected, resource), undefined);
  assert.match(cloudinaryResourceMismatch(expected, { ...resource, type: "private" }) ?? "", /type mismatch/);
  assert.match(cloudinaryResourceMismatch(expected, { ...resource, format: "png" }) ?? "", /format mismatch/);
  assert.match(cloudinaryResourceMismatch(expected, { ...resource, context: undefined }) ?? "", /source_sha256/);
});

test("sends Cloudinary content hashes as flat custom-context fields", () => {
  assert.deepEqual(cloudinaryUploadContext("source-hash", "optimized-hash"), {
    source_sha256: "source-hash",
    optimized_sha256: "optimized-hash",
  });
});

test("uses the Cloudinary v2 Promise resource signature with options second and no callback", async () => {
  const calls: unknown[][] = [];
  const expectedResource = { public_id: "folder/image", type: "upload", resource_type: "image" };
  const fakeApi = {
    resource: async (...args: [string, { resource_type: "image"; type: "upload" }]) => {
      calls.push(args);
      return expectedResource;
    },
  };

  const result = await lookupCloudinaryImageResource(fakeApi, "folder/image");

  assert.equal(result, expectedResource);
  assert.deepEqual(calls, [["folder/image", { resource_type: "image", type: "upload" }]]);
});

test("extracts Cloudinary API status and message without serializing request credentials", () => {
  assert.deepEqual(cloudinaryApiError({ error: { http_code: 401, message: "Invalid signature" } }), {
    code: "401",
    message: "Invalid signature",
  });
});
