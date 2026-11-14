import assert from "node:assert/strict";
import test from "node:test";
import {
  assertManifestMatchesMapping,
  countManifestActions,
  createApplyManifest,
  executeApplyPass,
  executeRollbackPass,
  rowMatchesManifest,
  rowMatchesRollback,
  validateApplyManifest,
  verifyPostApplyState,
  type ManifestEntry,
} from "./migration-manifest";

const migrationId = "8b5bdad5-1f24-4a15-8f4e-5fca6208eb65";
const rowId = "b21973a1-ae1a-41d6-9cc0-5ea62cfe51d2";
const sourceHash = "a".repeat(64);
const optimizedHash = "b".repeat(64);
const sourceUrl = "https://supabase.example/storage/v1/object/public/projects/photo.jpg";
const cloudUrl = "https://res.cloudinary.com/sample/image/upload/supabase-projects/photo.webp";

function applyEntry(overrides: Partial<ManifestEntry> = {}): ManifestEntry {
  return {
    migrationId,
    tableName: "project_images",
    primaryKeyColumn: "id",
    rowId,
    urlColumn: "image_url",
    expectedOriginalUrl: sourceUrl,
    expectedCloudinarySecureUrl: cloudUrl,
    originalPath: "photo.jpg",
    cloudinaryPublicId: "supabase-projects/photo",
    expectedSourceSha256: sourceHash,
    expectedOptimizedSha256: optimizedHash,
    mappingVerificationStatus: "verified",
    action: "apply",
    ...overrides,
  };
}

test("creates and validates a stable checksum-bound row manifest", () => {
  const manifest = createApplyManifest(migrationId, [applyEntry()], "2026-11-11T10:00:00.000Z");
  assert.equal(validateApplyManifest(manifest).checksum, manifest.checksum);
  assert.equal(manifest.checksum.length, 64);
});

test("rejects manifest content tampering and invalid checksum", () => {
  const manifest = createApplyManifest(migrationId, [applyEntry()], "2026-11-11T10:00:00.000Z");
  const tampered = structuredClone(manifest);
  tampered.entries[0].expectedCloudinarySecureUrl = "https://attacker.example/image.webp";
  assert.throws(() => validateApplyManifest(tampered), /checksum/);
});

test("rejects duplicate row identities and unsupported targets", () => {
  const duplicate = createApplyManifest(migrationId, [applyEntry(), applyEntry()], "2026-11-11T10:00:00.000Z");
  assert.throws(() => validateApplyManifest(duplicate), /duplicate row/);
  const badTarget = createApplyManifest(migrationId, [applyEntry({ urlColumn: "cover_image" })], "2026-11-11T10:00:00.000Z");
  assert.throws(() => validateApplyManifest(badTarget), /unsupported table or URL column/);
});

test("matches only the exact row ID and expected source URL", () => {
  const entry = applyEntry();
  assert.equal(rowMatchesManifest(entry, rowId, sourceUrl), true);
  assert.equal(rowMatchesManifest(entry, "9c1973a1-ae1a-41d6-9cc0-5ea62cfe51d2", sourceUrl), false);
  assert.equal(rowMatchesManifest(entry, rowId, "https://other.example/changed.jpg"), false);
  // A newly inserted row has a different primary key and cannot be selected by this manifest entry.
  assert.equal(rowMatchesManifest(entry, "f21973a1-ae1a-41d6-9cc0-5ea62cfe51d2", sourceUrl), false);
});

test("rollback matching requires the same row and expected Cloudinary URL", () => {
  const entry = applyEntry();
  assert.equal(rowMatchesRollback(entry, rowId, cloudUrl), true);
  assert.equal(rowMatchesRollback(entry, rowId, sourceUrl), false);
  assert.equal(rowMatchesRollback(entry, "9c1973a1-ae1a-41d6-9cc0-5ea62cfe51d2", cloudUrl), false);
});

test("historical skipped journal rows remain readable without a path-specific rule", () => {
  const excluded = applyEntry({
    originalPath: "legacy-skipped.jpg",
    expectedCloudinarySecureUrl: "",
    cloudinaryPublicId: "",
    expectedOptimizedSha256: "",
    mappingVerificationStatus: "not_applicable",
    action: "exclude",
  });
  const manifest = createApplyManifest(migrationId, [excluded], "2026-11-11T10:00:00.000Z");
  assert.deepEqual(countManifestActions(validateApplyManifest(manifest)), { apply: 0, excluded: 1 });
  assert.equal(validateApplyManifest(manifest).entries[0].action, "exclude");
});

test("apply manifest mapping must retain the exact verified asset and hashes", () => {
  const entry = applyEntry();
  const manifest = createApplyManifest(migrationId, [entry], "2026-11-11T10:00:00.000Z");
  const matching = {
    originalPath: entry.originalPath,
    originalUrl: entry.expectedOriginalUrl,
    sourceSha256: entry.expectedSourceSha256,
    optimizedSha256: entry.expectedOptimizedSha256,
    cloudinaryPublicId: entry.cloudinaryPublicId,
    cloudinarySecureUrl: entry.expectedCloudinarySecureUrl,
    uploadStatus: "uploaded",
    verificationStatus: "verified",
  };
  assert.doesNotThrow(() => assertManifestMatchesMapping(manifest, [matching]));
  assert.throws(() => assertManifestMatchesMapping(manifest, [{ ...matching, verificationStatus: "failed" }]), /no longer matches/);
  assert.throws(() => assertManifestMatchesMapping(manifest, [{ ...matching, cloudinaryPublicId: "other" }]), /no longer matches/);
});

test("resumes a partial apply from durable journal state without repeating a committed row", async () => {
  const first = applyEntry();
  const second = applyEntry({ rowId: "f21973a1-ae1a-41d6-9cc0-5ea62cfe51d2", originalPath: "second.jpg", expectedOriginalUrl: sourceUrl + "?second" });
  const excluded = applyEntry({
    rowId: "c21973a1-ae1a-41d6-9cc0-5ea62cfe51d2",
    originalPath: "legacy-skipped.jpg",
    expectedCloudinarySecureUrl: "",
    cloudinaryPublicId: "",
    expectedOptimizedSha256: "",
    mappingVerificationStatus: "not_applicable",
    action: "exclude",
  });
  const journal = new Map<string, string>([[first.rowId, "pending"], [second.rowId, "pending"]]);
  const writes = new Map<string, number>();
  let failSecondOnce = true;
  const operations = {
    validate: async () => {},
    markFailed: async (entry: ManifestEntry) => { if (journal.get(entry.rowId) === "pending") journal.set(entry.rowId, "failed"); },
    apply: async (entry: ManifestEntry) => {
      const state = journal.get(entry.rowId);
      if (state === "applied") return "applied" as const;
      if (entry.rowId === second.rowId && failSecondOnce) {
        failSecondOnce = false;
        throw new Error("simulated interrupted request");
      }
      writes.set(entry.rowId, (writes.get(entry.rowId) ?? 0) + 1);
      journal.set(entry.rowId, "applied");
      return "applied" as const;
    },
    inspect: async (entry: ManifestEntry) => journal.get(entry.rowId) as "pending" | "applied" | "failed",
  };
  const firstPass = await executeApplyPass([first, second, excluded], operations);
  assert.equal(firstPass.applied, 1);
  assert.equal(firstPass.failed, 1);
  const secondPass = await executeApplyPass([first, second, excluded], operations);
  assert.equal(secondPass.applied, 2);
  assert.equal(writes.get(first.rowId), 1);
  assert.equal(writes.get(second.rowId), 1);
  assert.equal(writes.has(excluded.rowId), false);
});

test("reconciles a process interruption after commit from the durable journal", async () => {
  const entry = applyEntry();
  let state: "pending" | "applied" | "failed" = "pending";
  const result = await executeApplyPass([entry], {
    validate: async () => {},
    markFailed: async () => { if (state === "pending") state = "failed"; },
    apply: async () => {
      state = "applied"; // transaction committed, but the client lost the response
      throw new Error("connection dropped after commit");
    },
    inspect: async () => state,
  });
  assert.equal(result.applied, 1);
  assert.equal(result.needsReconciliation, 0);
});

test("rollback sends only manifest rows and restores only journal-applied rows", async () => {
  const applied = applyEntry();
  const pending = applyEntry({ rowId: "f21973a1-ae1a-41d6-9cc0-5ea62cfe51d2", originalPath: "pending.jpg" });
  const excluded = applyEntry({
    rowId: "c21973a1-ae1a-41d6-9cc0-5ea62cfe51d2",
    originalPath: "legacy-skipped.jpg",
    expectedCloudinarySecureUrl: "",
    cloudinaryPublicId: "",
    expectedOptimizedSha256: "",
    mappingVerificationStatus: "not_applicable",
    action: "exclude",
  });
  const journal = new Map<string, string>([[applied.rowId, "applied"], [pending.rowId, "pending"]]);
  const rollbackCalls: string[] = [];
  const result = await executeRollbackPass([applied, pending, excluded], {
    rollback: async (entry) => {
      rollbackCalls.push(entry.rowId);
      if (journal.get(entry.rowId) !== "applied") return "not_applied" as const;
      journal.set(entry.rowId, "rolled_back");
      return "rolled_back" as const;
    },
    inspect: async (entry) => journal.get(entry.rowId) as "applied" | "pending" | "rolled_back",
  });
  assert.deepEqual(rollbackCalls, [applied.rowId, pending.rowId]);
  assert.equal(result.restored, 1);
  assert.equal(result.notApplied, 1);
  assert.equal(journal.get(excluded.rowId), undefined);
});

test("rollback conflicts are reported and do not count as restored", async () => {
  const changed = applyEntry();
  const result = await executeRollbackPass([changed], {
    rollback: async () => "conflict",
    inspect: async () => "conflict",
  });
  assert.equal(result.conflicts, 1);
  assert.equal(result.restored, 0);
});

test("row edits after preview are conflicts and do not match apply or rollback conditions", () => {
  const entry = applyEntry();
  assert.equal(rowMatchesManifest(entry, rowId, "https://supabase.example/changed-after-preview"), false);
  assert.equal(rowMatchesRollback(entry, rowId, "https://cloudinary.example/changed-after-apply"), false);
});

test("post-apply verification passes only with the exact run, journal, rows, and historical skipped status", () => {
  const apply = applyEntry();
  const excluded = applyEntry({
    rowId: "c21973a1-ae1a-41d6-9cc0-5ea62cfe51d2",
    originalPath: "legacy-skipped.jpg",
    expectedOriginalUrl: "https://supabase.example/storage/v1/object/public/projects/excluded.jpg",
    expectedCloudinarySecureUrl: "",
    cloudinaryPublicId: "",
    expectedSourceSha256: "",
    expectedOptimizedSha256: "",
    mappingVerificationStatus: "not_applicable",
    action: "exclude",
  });
  const manifest = createApplyManifest(migrationId, [apply, excluded], "2026-11-11T10:00:00.000Z");
  const journal = [apply, excluded].map((entry) => ({
    migrationId,
    manifestChecksum: manifest.checksum,
    tableName: entry.tableName,
    primaryKeyColumn: entry.primaryKeyColumn,
    rowId: entry.rowId,
    urlColumn: entry.urlColumn,
    expectedOriginalUrl: entry.expectedOriginalUrl,
    expectedCloudinaryUrl: entry.expectedCloudinarySecureUrl,
    originalPath: entry.originalPath,
    cloudinaryPublicId: entry.cloudinaryPublicId,
    sourceSha256: entry.expectedSourceSha256,
    optimizedSha256: entry.expectedOptimizedSha256,
    mappingVerificationStatus: entry.mappingVerificationStatus,
    action: entry.action,
    applyStatus: entry.action === "apply" ? "applied" : "excluded",
    rollbackStatus: entry.action === "apply" ? "pending" : "not_applicable",
    appliedAt: entry.action === "apply" ? "2026-11-11T10:01:00.000Z" : null,
  }));
  const verified = verifyPostApplyState({
    manifest,
    runRecords: [{ migrationId, manifestChecksum: manifest.checksum, manifestEntries: manifest.entries }],
    journalRecords: journal,
    databaseRows: [
      { tableName: "project_images", rowId: apply.rowId, url: apply.expectedCloudinarySecureUrl },
      { tableName: "project_images", rowId: excluded.rowId, url: excluded.expectedOriginalUrl },
    ],
  });
  assert.equal(verified.passed, true);
  assert.equal(verified.appliedJournalRows, 1);
  assert.equal(verified.excludedJournalRows, 1);
  assert.equal(verified.cloudinaryUrlMatches, 1);
  assert.equal(verified.excludedUrlMatches, 1);
});

test("post-apply verification detects absent run, missing/unexpected journal rows, URL drift, and conflicts", () => {
  const first = applyEntry();
  const second = applyEntry({ rowId: "f21973a1-ae1a-41d6-9cc0-5ea62cfe51d2", originalPath: "second.jpg" });
  const manifest = createApplyManifest(migrationId, [first, second], "2026-11-11T10:00:00.000Z");
  const journal = [first, second].map((entry) => ({
    migrationId,
    manifestChecksum: manifest.checksum,
    tableName: entry.tableName,
    primaryKeyColumn: entry.primaryKeyColumn,
    rowId: entry.rowId,
    urlColumn: entry.urlColumn,
    expectedOriginalUrl: entry.expectedOriginalUrl,
    expectedCloudinaryUrl: entry.expectedCloudinarySecureUrl,
    originalPath: entry.originalPath,
    cloudinaryPublicId: entry.cloudinaryPublicId,
    sourceSha256: entry.expectedSourceSha256,
    optimizedSha256: entry.expectedOptimizedSha256,
    mappingVerificationStatus: entry.mappingVerificationStatus,
    action: entry.action,
    applyStatus: entry.rowId === first.rowId ? "applied" : "conflict",
    rollbackStatus: "pending",
    appliedAt: "2026-11-11T10:01:00.000Z",
  }));
  const result = verifyPostApplyState({
    manifest,
    runRecords: [],
    journalRecords: [journal[0], journal[1], { ...journal[0], tableName: "projects", rowId: "c21973a1-ae1a-41d6-9cc0-5ea62cfe51d2" }],
    databaseRows: [
      { tableName: "project_images", rowId: first.rowId, url: "https://unexpected.example/changed.webp" },
      { tableName: "projects", rowId: "c21973a1-ae1a-41d6-9cc0-5ea62cfe51d2", url: "https://outside.example/image" },
    ],
  });
  assert.equal(result.passed, false);
  assert.equal(result.runRecordMatches, false);
  assert.equal(result.missingJournalRows, 0);
  assert.equal(result.journalMetadataMismatches, 1);
  assert.equal(result.unexpectedJournalRows, 1);
  assert.equal(result.conflictedJournalRows, 1);
  assert.equal(result.databaseUrlMismatches, 1);
  assert.equal(result.missingDatabaseRows, 1);
  assert.equal(result.unexpectedManifestIds, 1);
});

test("post-apply fallback statuses are explicitly incomplete without enumerable journal rows", () => {
  const entry = applyEntry();
  const manifest = createApplyManifest(migrationId, [entry], "2026-11-11T10:00:00.000Z");
  const result = verifyPostApplyState({
    manifest,
    runRecords: null,
    journalRecords: null,
    journalStatuses: [{ tableName: entry.tableName, rowId: entry.rowId, applyStatus: "applied", rollbackStatus: "pending", appliedAt: "2026-11-11T10:01:00.000Z" }],
    databaseRows: [{ tableName: entry.tableName, rowId: entry.rowId, url: entry.expectedCloudinarySecureUrl }],
  });
  assert.equal(result.appliedJournalRows, 1);
  assert.equal(result.journalFullyEnumerable, false);
  assert.equal(result.unexpectedJournalRows, null);
  assert.equal(result.duplicateJournalRows, null);
  assert.equal(result.passed, false);
});
