import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  MAX_IMAGE_FILE_BYTES,
  validateImageFiles,
} from "../lib/project-image-validation";
import {
  cleanUnreferencedCloudinaryAssets,
  collectCloudinaryPublicIds,
} from "../lib/project-image-cleanup";
import { runWithPendingState } from "../lib/project-image-pending";

const root = process.cwd();
const management = readFileSync(join(root, "lib/server/project-management.ts"), "utf8");
const cloudinary = readFileSync(join(root, "lib/cloudinary-project-images.ts"), "utf8");
const cleanup = readFileSync(join(root, "lib/server/cloudinary-project-cleanup.ts"), "utf8");
const dashboard = readFileSync(join(root, "app/dashboard/page.tsx"), "utf8");
const editPage = readFileSync(join(root, "app/dashboard/edit/[id]/page.tsx"), "utf8");

test("validates accepted image MIME types, size, total batch size, and image count", () => {
  assert.doesNotThrow(() => validateImageFiles([{ type: "image/png", size: 100 }]));
  assert.doesNotThrow(() => validateImageFiles([{ type: "image/avif", size: 100 }]));
  assert.throws(() => validateImageFiles([{ type: "image/gif", size: 100 }]), /غير مدعوم/);
  assert.throws(() => validateImageFiles([{ type: "image/jpeg", size: MAX_IMAGE_FILE_BYTES + 1 }]), /10 ميجابايت/);
  assert.throws(() => validateImageFiles(Array.from({ length: 21 }, () => ({ type: "image/webp", size: 1 }))), /20 صورة/);
  assert.throws(() => validateImageFiles(Array.from({ length: 4 }, () => ({ type: "image/jpeg", size: 8 * 1024 * 1024 }))), /30 ميجابايت/);
});

test("Cloudinary uploads use unique project-scoped IDs and persist the returned identity", () => {
  assert.match(cloudinary, /randomUUID\(\)/);
  assert.match(cloudinary, /format:\s*"webp"/);
  assert.match(cloudinary, /publicId:\s*asset\.public_id/);
  assert.match(cloudinary, /secureUrl:\s*asset\.secure_url/);
  assert.doesNotMatch(cloudinary, /verifyDelivery|optimizedHash|findExistingAsset/);
});

test("creation uploads before saving and requires real Cloudinary URLs and IDs for image rows", () => {
  const uploadPosition = management.indexOf("await uploadProjectImage");
  const projectInsertPosition = management.indexOf('.from("projects")\n        .insert');
  const imageInsertPosition = management.indexOf('.from("project_images").insert(rows)');
  assert.ok(uploadPosition >= 0 && projectInsertPosition > uploadPosition);
  assert.ok(imageInsertPosition > projectInsertPosition);
  assert.match(management, /image_url:\s*asset\.secureUrl/);
  assert.match(management, /cloudinary_public_id:\s*asset\.publicId/);
  assert.match(management, /image_order:\s*image\.image_order/);
});

test("editing preserves retained image identity and cleans removed images after database updates", () => {
  assert.match(management, /image_url:\s*old\.image_url/);
  assert.match(management, /cloudinary_public_id:\s*old\.cloudinary_public_id/);
  assert.match(management, /id:\s*old\.id/);
  assert.match(management, /cover_image:\s*cover\.image_url/);
  assert.match(management, /cover_image_public_id:\s*cover\.cloudinary_public_id/);
  const projectUpdate = management.indexOf(".update(payload)", management.indexOf("const retainedRows"));
  const cleanupCall = management.indexOf("deleteUnreferencedCloudinaryAssets(admin, removedPublicIds)");
  assert.ok(projectUpdate >= 0 && cleanupCall > projectUpdate);
  assert.match(management, /removedImages\s*=\s*oldImages\.filter/);
  assert.match(management, /removedImages\s*\.map\(\(image\) => image\.cloudinary_public_id\)/);
  assert.match(management, /const removedPublicIds = removedImages/);
  assert.match(management, /newPublicIds = uploadedAssets\.map/);
  assert.doesNotMatch(
    management.slice(management.indexOf("const removedPublicIds"), management.indexOf("const cloudinaryDeletion", management.indexOf("const removedPublicIds"))),
    /uploadedAssets/,
  );
  assert.ok(management.indexOf("if (updateProjectError)") < cleanupCall);
  assert.ok(management.indexOf("if (!updatedProject)") < cleanupCall);
  assert.match(editPage, /cloudinaryDeletion\?\.failed/);
  assert.match(editPage, /تم تحديث المشروع، لكن تعذر تأكيد حذف بعض الصور المُزالة/);
});

test("project deletion collects cover and gallery identities before DB deletion, then runs reference-aware cleanup", () => {
  const deleteFlow = management.slice(management.indexOf("export async function deleteProjectMutation"));
  assert.match(deleteFlow, /select\("id, cover_image_public_id"\)/);
  assert.match(deleteFlow, /select\("cloudinary_public_id"\)/);
  assert.match(deleteFlow, /const publicIds = collectCloudinaryPublicIds\(/);
  const imageDelete = deleteFlow.indexOf('.from("project_images")\n    .delete()');
  const projectDelete = deleteFlow.indexOf('.from("projects").delete()');
  const cleanupCall = deleteFlow.indexOf("deleteUnreferencedCloudinaryAssets(admin, publicIds)");
  assert.ok(imageDelete >= 0 && projectDelete > imageDelete && cleanupCall > projectDelete);
  assert.match(cleanup, /\.eq\("cloudinary_public_id", publicId\)/);
  assert.match(cleanup, /\.eq\("cover_image_public_id", publicId\)/);
  assert.match(cleanup, /cleanUnreferencedCloudinaryAssets/);
  assert.match(cloudinary, /CLOUDINARY_DELETE_TIMEOUT_MS = 15_000/);
  assert.match(cloudinary, /cloudinary\.uploader\.destroy\(publicId,\s*\{/);
  assert.doesNotMatch(cloudinary.slice(cloudinary.indexOf("export async function deleteCloudinaryImage")), /callback:\s*\(/);
});

test("project deletion collects the cover and every gallery public ID, removing duplicates only", () => {
  assert.deepEqual(
    collectCloudinaryPublicIds("cover/id", ["gallery/one", "gallery/two", "gallery/one", null, ""]),
    ["cover/id", "gallery/one", "gallery/two"],
  );
});

test("cleanup deduplicates IDs, preserves referenced assets, and reports deletion failures", async () => {
  const referenced = new Set(["shared/cover"]);
  const attempted: string[] = [];
  const result = await cleanUnreferencedCloudinaryAssets(
    ["shared/cover", "gallery/one", "gallery/one", "gallery/two", ""],
    async (publicId) => referenced.has(publicId),
    async (publicId) => {
      attempted.push(publicId);
      if (publicId === "gallery/two") throw new Error("Cloudinary unavailable");
      return "deleted";
    },
  );

  assert.deepEqual(attempted, ["gallery/one", "gallery/two"]);
  assert.deepEqual(result.referencedElsewhere, ["shared/cover"]);
  assert.equal(result.requested, 3);
  assert.equal(result.deleted, 1);
  assert.equal(result.failed, 1);
  assert.match(result.failures[0], /Cloudinary unavailable/);
});

test("project deletion attempts its cover and every gallery image after database deletion", async () => {
  const attempted: string[] = [];
  const result = await cleanUnreferencedCloudinaryAssets(
    ["cover/public-id", "gallery/one", "gallery/two"],
    async () => false,
    async (publicId) => {
      attempted.push(publicId);
      return "deleted";
    },
  );

  assert.deepEqual(attempted, ["cover/public-id", "gallery/one", "gallery/two"]);
  assert.equal(result.deleted, 3);
  assert.equal(result.failed, 0);
});

test("database reference lookup failures prevent asset deletion and are reported", async () => {
  let deletionAttempted = false;
  const result = await cleanUnreferencedCloudinaryAssets(
    ["gallery/image"],
    async () => { throw new Error("database unavailable"); },
    async () => {
      deletionAttempted = true;
      return "deleted";
    },
  );

  assert.equal(deletionAttempted, false);
  assert.equal(result.failed, 1);
  assert.match(result.failures[0], /database unavailable/);
});

test("database update failures are handled before removed-image cleanup is called", () => {
  const projectUpdateError = management.indexOf("if (updateProjectError)");
  const noUpdatedProject = management.indexOf("if (!updatedProject)");
  const cleanupCall = management.indexOf("deleteUnreferencedCloudinaryAssets(admin, removedPublicIds)");
  assert.ok(projectUpdateError >= 0 && noUpdatedProject > projectUpdateError);
  assert.ok(cleanupCall > noUpdatedProject);
  assert.match(management.slice(projectUpdateError, cleanupCall), /throw new Error/);
});

test("pending state stops after successful edit and deletion responses", async () => {
  for (const page of [editPage, dashboard]) {
    assert.match(page, /runWithPendingState/);
    assert.match(page, /response\.json\(\)/);
    assert.match(page, /if \(!response\.ok\) throw new Error/);
  }
  for (const result of [{ ok: true }, { cloudinaryDeletion: { failed: 1 } }]) {
    const states: boolean[] = [];
    const response = await runWithPendingState(async () => result, (pending) => states.push(pending));
    assert.equal(response, result);
    assert.deepEqual(states, [true, false]);
  }
});

test("pending state stops after failed requests and preserves the rejection", async () => {
  const states: boolean[] = [];
  await assert.rejects(
    runWithPendingState(async () => { throw new Error("request failed"); }, (pending) => states.push(pending)),
    /request failed/,
  );
  assert.deepEqual(states, [true, false]);
});

test("dashboard prevents duplicate deletes and reports outcomes while updating the list", () => {
  assert.match(dashboard, /deletingIdsRef\.current\.has\(id\)/);
  assert.match(dashboard, /disabled=\{deletingIds\.has\(project\.id\)\}/);
  assert.match(dashboard, /Loader2 className="h-4 w-4 animate-spin"/);
  assert.match(dashboard, /جارٍ الحذف/);
  assert.match(dashboard, /setProjects\(prev => prev\.filter\(p => p\.id !== id\)\)/);
  assert.match(dashboard, /setNotification\(\{ type: 'success'/);
  assert.match(dashboard, /setNotification\(\{ type: 'warning'/);
  assert.match(dashboard, /setNotification\(\{ type: 'error'/);
  assert.match(dashboard, /result\.cloudinaryDeletion\?\.failed/);
  assert.match(editPage, /result\.cloudinaryDeletion\?\.failed/);
});

test("the project management workflow has no lifecycle RPC or storage upload dependency", () => {
  assert.doesNotMatch(management, /\.rpc\(/);
  assert.doesNotMatch(management, /storage/);
  assert.doesNotMatch(management, /cleanup_jobs|reserve_asset_upload|retryCloudinaryCleanup/);
});
