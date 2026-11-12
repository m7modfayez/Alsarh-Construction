import assert from "node:assert/strict";
import test from "node:test";

import {
  cloudinaryPublicId,
  ImageUploadError,
  isSafeCleanupJob,
  MAX_IMAGE_FILE_BYTES,
  persistWithCompensation,
  uploadBatchWithCompensation,
  validateImageFiles,
} from "../lib/project-image-lifecycle";
import { isAuthenticatedDashboardUser } from "../lib/auth-utils";

const asset = {
  publicId: `projects/123e4567-e89b-42d3-a456-426614174000/${"a".repeat(64)}`,
  secureUrl: `https://res.cloudinary.com/rpoookqu/image/upload/v1/projects/123e4567-e89b-42d3-a456-426614174000/${"a".repeat(64)}.webp`,
  sourceSha256: "a".repeat(64),
  optimizedSha256: "b".repeat(64),
  optimizedBytes: 123,
};

test("validates image MIME types, per-file size, aggregate size, and count", () => {
  assert.doesNotThrow(() => validateImageFiles([{ type: "image/png", size: 100 }]));
  assert.throws(() => validateImageFiles([{ type: "image/gif", size: 100 }]), /غير مدعوم/);
  assert.throws(() => validateImageFiles([{ type: "image/jpeg", size: MAX_IMAGE_FILE_BYTES + 1 }]), /10 ميجابايت/);
  assert.throws(() => validateImageFiles(Array.from({ length: 21 }, () => ({ type: "image/webp", size: 1 }))), /20 صورة/);
  assert.throws(() => validateImageFiles(Array.from({ length: 4 }, () => ({ type: "image/jpeg", size: 8 * 1024 * 1024 }))), /30 ميجابايت/);
});

test("uses a deterministic project-scoped Cloudinary public ID", () => {
  const id = cloudinaryPublicId("123e4567-e89b-42d3-a456-426614174000", "A".repeat(64));
  assert.equal(id, asset.publicId);
  assert.equal(cloudinaryPublicId("123e4567-e89b-42d3-a456-426614174000", "A".repeat(64)), id);
});

test("successful Cloudinary uploads are bounded and retain input order", async () => {
  let active = 0;
  let maximum = 0;
  const uploaded = await uploadBatchWithCompensation(
    [0, 1, 2, 3, 4],
    async (index) => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
      return { ...asset, publicId: `${asset.publicId}-${index}` };
    },
    async () => assert.fail("successful upload must not be compensated"),
    2,
  );
  assert.equal(maximum, 2);
  assert.deepEqual(uploaded.map((item) => item.publicId), [0, 1, 2, 3, 4].map((index) => `${asset.publicId}-${index}`));
});

test("a failed upload queues completed and partially uploaded assets for compensation", async () => {
  const orphan = { ...asset, publicId: `${asset.publicId}-partial` };
  const cleanup: string[] = [];
  await assert.rejects(
    uploadBatchWithCompensation(
      [0, 1],
      async (index) => {
        if (index === 0) throw new ImageUploadError("delivery check failed", orphan);
        return { ...asset, publicId: `${asset.publicId}-success` };
      },
      async (items) => { cleanup.push(...items.map((item) => item.publicId)); },
      2,
    ),
    /delivery check failed/,
  );
  assert.deepEqual(cleanup.sort(), [`${asset.publicId}-partial`, `${asset.publicId}-success`].sort());
});

test("database persistence failure queues newly uploaded assets for compensation", async () => {
  const queued: string[] = [];
  await assert.rejects(
    persistWithCompensation([asset], async () => { throw new Error("database rejected transaction"); }, async (items) => {
      queued.push(...items.map((item) => item.publicId));
    }),
    /database rejected transaction/,
  );
  assert.deepEqual(queued, [asset.publicId]);
});

test("metadata-only edits do not invoke the upload adapter", async () => {
  let uploads = 0;
  const result = await uploadBatchWithCompensation([], async () => { uploads += 1; return asset; }, async () => undefined);
  assert.deepEqual(result, []);
  assert.equal(uploads, 0);
});

test("cleanup accepts only exact Cloudinary delivery URLs and never a legacy Supabase URL", () => {
  assert.equal(isSafeCleanupJob({ id: "1", cloudinary_public_id: asset.publicId, secure_url: asset.secureUrl }, "rpoookqu"), true);
  assert.equal(isSafeCleanupJob({ id: "2", cloudinary_public_id: "", secure_url: "https://agygawewzqgweeufhhre.supabase.co/storage/v1/object/public/projects/legacy.jpg" }, "rpoookqu"), false);
  assert.equal(isSafeCleanupJob({ id: "3", cloudinary_public_id: asset.publicId, secure_url: "https://res.cloudinary.com/other/image/upload/x.webp" }, "rpoookqu"), false);
});

test("unauthenticated requests cannot enter the admin server layer", () => {
  assert.equal(isAuthenticatedDashboardUser(null), false);
  assert.equal(isAuthenticatedDashboardUser({}), false);
  assert.equal(isAuthenticatedDashboardUser({ id: "user-id" }), true);
});
