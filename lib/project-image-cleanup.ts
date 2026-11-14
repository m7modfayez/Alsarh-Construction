export interface CloudinaryCleanupResult {
  requested: number;
  deleted: number;
  alreadyMissing: number;
  referencedElsewhere: string[];
  failed: number;
  failures: string[];
}

export function collectCloudinaryPublicIds(
  coverPublicId: unknown,
  galleryPublicIds: readonly unknown[],
): string[] {
  return [...new Set(
    [coverPublicId, ...galleryPublicIds]
      .filter((publicId): publicId is string => typeof publicId === "string" && publicId.length > 0),
  )];
}

export async function cleanUnreferencedCloudinaryAssets(
  publicIds: readonly string[],
  isReferenced: (publicId: string) => Promise<boolean>,
  deleteAsset: (publicId: string) => Promise<"deleted" | "not_found">,
): Promise<CloudinaryCleanupResult> {
  const uniqueIds = [...new Set(publicIds.filter(Boolean))];
  const result: CloudinaryCleanupResult = {
    requested: uniqueIds.length,
    deleted: 0,
    alreadyMissing: 0,
    referencedElsewhere: [],
    failed: 0,
    failures: [],
  };

  await Promise.all(uniqueIds.map(async (publicId) => {
    try {
      if (await isReferenced(publicId)) {
        result.referencedElsewhere.push(publicId);
        return;
      }

      const deletion = await deleteAsset(publicId);
      if (deletion === "deleted") result.deleted += 1;
      else result.alreadyMissing += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloudinary cleanup failed";
      result.failures.push(`${publicId}: ${message}`);
      console.error("Cloudinary asset cleanup failed:", publicId, message);
    }
  }));

  result.failed = result.failures.length;
  return result;
}
