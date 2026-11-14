import { createHash, randomUUID } from "node:crypto";

export type MigrationTable = "project_images" | "projects";
export type ManifestEntry = {
  migrationId: string;
  tableName: MigrationTable;
  primaryKeyColumn: "id";
  rowId: string;
  urlColumn: "image_url" | "cover_image";
  expectedOriginalUrl: string;
  expectedCloudinarySecureUrl: string;
  originalPath: string;
  cloudinaryPublicId: string;
  expectedSourceSha256: string;
  expectedOptimizedSha256: string;
  mappingVerificationStatus: string;
  action: "apply" | "exclude";
};

export type ApplyManifest = {
  version: 1;
  migrationId: string;
  createdAt: string;
  checksum: string;
  entries: ManifestEntry[];
};

export function makeMigrationId(): string {
  return randomUUID();
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return "{" + Object.keys(record).sort().map((key) => JSON.stringify(key) + ":" + canonicalJson(record[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

export function manifestChecksumPayload(manifest: Omit<ApplyManifest, "checksum">): string {
  return createHash("sha256").update(canonicalJson(manifest)).digest("hex");
}

export function createApplyManifest(migrationId: string, entries: ManifestEntry[], createdAt = new Date().toISOString()): ApplyManifest {
  const payload = { version: 1 as const, migrationId, createdAt, entries };
  return { ...payload, checksum: manifestChecksumPayload(payload) };
}

export function validateApplyManifest(value: unknown): ApplyManifest {
  if (!value || typeof value !== "object") throw new Error("Apply manifest must be a JSON object");
  const manifest = value as ApplyManifest;
  if (manifest.version !== 1 || typeof manifest.migrationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(manifest.migrationId) ||
      typeof manifest.createdAt !== "string" || !Number.isFinite(Date.parse(manifest.createdAt)) ||
      !Array.isArray(manifest.entries) || manifest.entries.length === 0 || typeof manifest.checksum !== "string") {
    throw new Error("Apply manifest header or entries are invalid");
  }
  const seenRows = new Set<string>();
  for (const entry of manifest.entries) {
    if (entry.migrationId !== manifest.migrationId) throw new Error("Manifest entry migration ID does not match its header");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entry.rowId) ||
        entry.primaryKeyColumn !== "id") throw new Error("Manifest entry has no supported UUID primary key");
    const expectedColumn = entry.tableName === "project_images" ? "image_url" : entry.tableName === "projects" ? "cover_image" : undefined;
    if (!expectedColumn || entry.urlColumn !== expectedColumn) throw new Error("Manifest entry targets an unsupported table or URL column");
    const rowKey = entry.tableName + ":" + entry.rowId;
    if (seenRows.has(rowKey)) throw new Error("Manifest contains duplicate row " + rowKey);
    seenRows.add(rowKey);
    if (entry.action === "exclude") {
      if (!entry.expectedOriginalUrl || entry.expectedOriginalUrl === entry.expectedCloudinarySecureUrl) {
        throw new Error("Excluded manifest rows must retain their original URL");
      }
    } else if (entry.action === "apply") {
      if (!entry.expectedOriginalUrl || !entry.expectedCloudinarySecureUrl || !entry.cloudinaryPublicId ||
          !/^[a-f0-9]{64}$/i.test(entry.expectedSourceSha256) || !/^[a-f0-9]{64}$/i.test(entry.expectedOptimizedSha256) ||
          entry.mappingVerificationStatus !== "verified") {
        throw new Error("Apply manifest entry is missing verified mapping identity or content hashes");
      }
    } else {
      throw new Error("Manifest action must be apply or exclude");
    }
  }
  const { checksum, ...payload } = manifest;
  if (!/^[a-f0-9]{64}$/i.test(checksum) || manifestChecksumPayload(payload) !== checksum) {
    throw new Error("Apply manifest checksum does not match its contents");
  }
  return manifest;
}

export function assertManifestMatchesMapping(manifest: ApplyManifest, entries: Array<{
  originalPath: string;
  originalUrl: string;
  sourceSha256?: string;
  optimizedSha256?: string;
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  uploadStatus: string;
  verificationStatus: string;
}>): void {
  for (const row of manifest.entries) {
    if (row.action === "exclude") continue;
    const match = entries.find((entry) => entry.originalPath === row.originalPath && entry.originalUrl === row.expectedOriginalUrl &&
      entry.sourceSha256 === row.expectedSourceSha256 && entry.optimizedSha256 === row.expectedOptimizedSha256 &&
      entry.cloudinaryPublicId === row.cloudinaryPublicId && entry.cloudinarySecureUrl === row.expectedCloudinarySecureUrl &&
      ["uploaded", "existing"].includes(entry.uploadStatus) && entry.verificationStatus === "verified");
    if (!match) throw new Error("Manifest mapping no longer matches a successful verified entry for '" + row.originalPath + "'");
  }
}

export function rowMatchesManifest(entry: Pick<ManifestEntry, "rowId" | "expectedOriginalUrl">, currentId: unknown, currentUrl: unknown): boolean {
  return currentId === entry.rowId && currentUrl === entry.expectedOriginalUrl;
}

export function rowMatchesRollback(entry: Pick<ManifestEntry, "rowId" | "expectedCloudinarySecureUrl">, currentId: unknown, currentUrl: unknown): boolean {
  return currentId === entry.rowId && currentUrl === entry.expectedCloudinarySecureUrl;
}

export function countManifestActions(manifest: ApplyManifest): { apply: number; excluded: number } {
  return manifest.entries.reduce((counts, entry) => {
    counts[entry.action === "apply" ? "apply" : "excluded"] += 1;
    return counts;
  }, { apply: 0, excluded: 0 });
}

export type VerifyRunRecord = {
  migrationId: string;
  manifestChecksum: string;
  manifestEntries: unknown;
};

export type VerifyJournalRecord = {
  migrationId: string;
  manifestChecksum: string;
  tableName: string;
  primaryKeyColumn: string;
  rowId: string;
  urlColumn: string;
  expectedOriginalUrl: string;
  expectedCloudinaryUrl: string;
  originalPath: string;
  cloudinaryPublicId: string;
  sourceSha256: string | null;
  optimizedSha256: string | null;
  mappingVerificationStatus: string;
  action: "apply" | "exclude";
  applyStatus: string;
  rollbackStatus: string;
  appliedAt: string | null;
};

export type VerifyJournalStatus = {
  tableName: string;
  rowId: string;
  applyStatus?: string;
  rollbackStatus?: string;
  appliedAt?: string | null;
  missing?: boolean;
};

export type VerifyDatabaseRow = { tableName: string; rowId: string; url: string };

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return "{" + Object.keys(record).sort().map((key) => JSON.stringify(key) + ":" + stableJson(record[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

export type PostApplyVerification = {
  passed: boolean;
  expectedApplyRows: number;
  expectedExcludedRows: number;
  runRecordMatches: boolean;
  journalFullyEnumerable: boolean;
  journalRows: number | null;
  missingJournalRows: number;
  unexpectedJournalRows: number | null;
  duplicateJournalRows: number | null;
  journalMetadataMismatches: number;
  appliedJournalRows: number;
  excludedJournalRows: number;
  pendingJournalRows: number;
  conflictedJournalRows: number;
  failedJournalRows: number;
  reconciliationJournalRows: number;
  rolledBackJournalRows: number;
  databaseRowsFound: number;
  cloudinaryUrlMatches: number;
  excludedUrlMatches: number;
  databaseUrlMismatches: number;
  missingDatabaseRows: number;
  unexpectedManifestIds: number;
};

export function verifyPostApplyState(input: {
  manifest: ApplyManifest;
  runRecords: VerifyRunRecord[] | null;
  journalRecords: VerifyJournalRecord[] | null;
  journalStatuses?: VerifyJournalStatus[];
  databaseRows: VerifyDatabaseRow[];
}): PostApplyVerification {
  const applyEntries = input.manifest.entries.filter((entry) => entry.action === "apply");
  const excludedEntries = input.manifest.entries.filter((entry) => entry.action === "exclude");
  const identity = (tableName: string, rowId: string) => tableName + ":" + rowId;
  const expectedEntries = new Map(input.manifest.entries.map((entry) => [identity(entry.tableName, entry.rowId), entry]));
  const runRecordMatches = input.runRecords?.length === 1 &&
    input.runRecords[0].migrationId === input.manifest.migrationId &&
    input.runRecords[0].manifestChecksum === input.manifest.checksum &&
    stableJson(input.runRecords[0].manifestEntries) === stableJson(input.manifest.entries);

  const journalRecords = input.journalRecords;
  const statusRows = journalRecords?.map((record) => ({
    tableName: record.tableName,
    rowId: record.rowId,
    applyStatus: record.applyStatus,
    rollbackStatus: record.rollbackStatus,
    appliedAt: record.appliedAt,
  })) ?? input.journalStatuses ?? [];
  const statusCounts = {
    applied: 0, excluded: 0, pending: 0, conflict: 0, failed: 0, needsReconciliation: 0, rolledBack: 0,
  };
  const statusByIdentity = new Map<string, VerifyJournalStatus[]>();
  for (const row of statusRows) {
    const key = identity(row.tableName, row.rowId);
    statusByIdentity.set(key, [...(statusByIdentity.get(key) ?? []), row]);
    if (row.applyStatus === "applied") statusCounts.applied += 1;
    else if (row.applyStatus === "excluded") statusCounts.excluded += 1;
    else if (row.applyStatus === "pending") statusCounts.pending += 1;
    else if (row.applyStatus === "conflict") statusCounts.conflict += 1;
    else if (row.applyStatus === "failed") statusCounts.failed += 1;
    else if (row.applyStatus === "needs_reconciliation") statusCounts.needsReconciliation += 1;
    if (row.rollbackStatus === "rolled_back") statusCounts.rolledBack += 1;
  }

  let missingJournalRows = 0;
  let journalMetadataMismatches = 0;
  let unexpectedJournalRows: number | null = null;
  let duplicateJournalRows = 0;
  let journalMatches = false;
  if (journalRecords) {
    unexpectedJournalRows = 0;
    for (const [key, records] of statusByIdentity) {
      if (!expectedEntries.has(key)) unexpectedJournalRows += records.length;
      if (records.length > 1) duplicateJournalRows += records.length - 1;
    }
    for (const [key, expected] of expectedEntries) {
      const records = journalRecords.filter((record) => identity(record.tableName, record.rowId) === key);
      if (records.length === 0) {
        missingJournalRows += 1;
        continue;
      }
      const record = records[0];
      const expectedApplyStatus = expected.action === "apply" ? "applied" : "excluded";
      const expectedRollbackStatus = expected.action === "apply" ? "pending" : "not_applicable";
      const contentMatches = record.migrationId === expected.migrationId &&
        record.manifestChecksum === input.manifest.checksum &&
        record.primaryKeyColumn === expected.primaryKeyColumn && record.urlColumn === expected.urlColumn &&
        record.expectedOriginalUrl === expected.expectedOriginalUrl &&
        record.expectedCloudinaryUrl === expected.expectedCloudinarySecureUrl &&
        record.originalPath === expected.originalPath && record.cloudinaryPublicId === expected.cloudinaryPublicId &&
        record.sourceSha256 === expected.expectedSourceSha256 &&
        record.optimizedSha256 === expected.expectedOptimizedSha256 &&
        record.mappingVerificationStatus === expected.mappingVerificationStatus &&
        record.action === expected.action && record.applyStatus === expectedApplyStatus &&
        record.rollbackStatus === expectedRollbackStatus &&
        (expected.action === "exclude" ? record.appliedAt === null : typeof record.appliedAt === "string");
      if (!contentMatches) journalMetadataMismatches += 1;
    }
    journalMatches = journalRecords.length === expectedEntries.size && missingJournalRows === 0 &&
      journalMetadataMismatches === 0 && unexpectedJournalRows === 0 && duplicateJournalRows === 0;
  } else {
    for (const [key, expected] of expectedEntries) {
      const rows = statusByIdentity.get(key);
      const status = rows?.[0];
      const expectedApplyStatus = expected.action === "apply" ? "applied" : "excluded";
      const expectedRollbackStatus = expected.action === "apply" ? "pending" : "not_applicable";
      if (!status || status.missing || status.applyStatus !== expectedApplyStatus ||
          status.rollbackStatus !== expectedRollbackStatus ||
          (expected.action === "apply" ? typeof status.appliedAt !== "string" : status.appliedAt !== null)) {
        missingJournalRows += 1;
      }
    }
  }

  const databaseByIdentity = new Map(input.databaseRows.map((row) => [identity(row.tableName, row.rowId), row]));
  let cloudinaryUrlMatches = 0;
  let excludedUrlMatches = 0;
  let databaseUrlMismatches = 0;
  let missingDatabaseRows = 0;
  let unexpectedManifestIds = 0;
  for (const row of input.databaseRows) if (!expectedEntries.has(identity(row.tableName, row.rowId))) unexpectedManifestIds += 1;
  for (const entry of input.manifest.entries) {
    const row = databaseByIdentity.get(identity(entry.tableName, entry.rowId));
    if (!row) {
      missingDatabaseRows += 1;
    } else if (entry.action === "apply" && row.url === entry.expectedCloudinarySecureUrl) {
      cloudinaryUrlMatches += 1;
    } else if (entry.action === "exclude" && row.url === entry.expectedOriginalUrl) {
      excludedUrlMatches += 1;
    } else {
      databaseUrlMismatches += 1;
    }
  }
  const appliedJournalRows = statusCounts.applied;
  const excludedJournalRows = statusCounts.excluded;
  return {
    passed: Boolean(runRecordMatches && journalMatches && missingDatabaseRows === 0 &&
      databaseUrlMismatches === 0 && unexpectedManifestIds === 0 && cloudinaryUrlMatches === applyEntries.length &&
      excludedUrlMatches === excludedEntries.length && statusCounts.conflict === 0 && statusCounts.failed === 0 &&
      statusCounts.pending === 0 && statusCounts.needsReconciliation === 0 && statusCounts.rolledBack === 0),
    expectedApplyRows: applyEntries.length,
    expectedExcludedRows: excludedEntries.length,
    runRecordMatches: Boolean(runRecordMatches),
    journalFullyEnumerable: journalRecords !== null,
    journalRows: journalRecords?.length ?? null,
    missingJournalRows,
    unexpectedJournalRows,
    duplicateJournalRows: journalRecords ? duplicateJournalRows : null,
    journalMetadataMismatches,
    appliedJournalRows,
    excludedJournalRows,
    pendingJournalRows: statusCounts.pending,
    conflictedJournalRows: statusCounts.conflict,
    failedJournalRows: statusCounts.failed,
    reconciliationJournalRows: statusCounts.needsReconciliation,
    rolledBackJournalRows: statusCounts.rolledBack,
    databaseRowsFound: input.databaseRows.length,
    cloudinaryUrlMatches,
    excludedUrlMatches,
    databaseUrlMismatches,
    missingDatabaseRows,
    unexpectedManifestIds,
  };
}

export type JournalOperationState = "pending" | "applied" | "conflict" | "failed" | "needs_reconciliation" |
  "rolled_back" | "not_applied" | "excluded";
export type JournalOperationResult = {
  applied: number;
  conflicts: number;
  failed: number;
  needsReconciliation: number;
  restored: number;
  notApplied: number;
};

function emptyOperationResult(): JournalOperationResult {
  return { applied: 0, conflicts: 0, failed: 0, needsReconciliation: 0, restored: 0, notApplied: 0 };
}

function countApplyState(result: JournalOperationResult, state: JournalOperationState | undefined): void {
  if (state === "applied") result.applied += 1;
  else if (state === "conflict") result.conflicts += 1;
  else if (state === "needs_reconciliation" || state === undefined) result.needsReconciliation += 1;
  else if (state === "failed" || state === "pending") result.failed += 1;
}

export async function executeApplyPass(
  entries: ManifestEntry[],
  operations: {
    validate: (entry: ManifestEntry) => Promise<void>;
    apply: (entry: ManifestEntry) => Promise<JournalOperationState>;
    markFailed: (entry: ManifestEntry, reason: string) => Promise<void>;
    inspect: (entry: ManifestEntry) => Promise<JournalOperationState>;
  },
): Promise<JournalOperationResult> {
  const result = emptyOperationResult();
  for (const entry of entries) {
    if (entry.action === "exclude") continue;
    try {
      await operations.validate(entry);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      await operations.markFailed(entry, reason).catch(() => undefined);
      result.failed += 1;
      continue;
    }
    try {
      countApplyState(result, await operations.apply(entry));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      // The database-side mark operation changes only a still-pending journal row;
      // if the original RPC committed, applied state is preserved.
      await operations.markFailed(entry, reason).catch(() => undefined);
      try {
        countApplyState(result, await operations.inspect(entry));
      } catch {
        result.needsReconciliation += 1;
      }
    }
  }
  return result;
}

export async function executeRollbackPass(
  entries: ManifestEntry[],
  operations: {
    rollback: (entry: ManifestEntry) => Promise<JournalOperationState>;
    inspect: (entry: ManifestEntry) => Promise<JournalOperationState>;
  },
): Promise<JournalOperationResult> {
  const result = emptyOperationResult();
  for (const entry of entries) {
    if (entry.action === "exclude") continue;
    try {
      const state = await operations.rollback(entry);
      if (state === "rolled_back") result.restored += 1;
      else if (state === "conflict") result.conflicts += 1;
      else if (state === "not_applied") result.notApplied += 1;
      else if (state === "needs_reconciliation") result.needsReconciliation += 1;
      else result.failed += 1;
    } catch {
      try {
        const state = await operations.inspect(entry);
        if (state === "rolled_back") result.restored += 1;
        else if (state === "conflict") result.conflicts += 1;
        else result.needsReconciliation += 1;
      } catch {
        result.needsReconciliation += 1;
      }
    }
  }
  return result;
}
