import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteCloudinaryImage } from "@/lib/cloudinary-project-images";
import { cleanUnreferencedCloudinaryAssets } from "@/lib/project-image-cleanup";

export async function deleteUnreferencedCloudinaryAssets(
  admin: SupabaseClient,
  publicIds: readonly string[],
  deleteAsset: typeof deleteCloudinaryImage = deleteCloudinaryImage,
): ReturnType<typeof cleanUnreferencedCloudinaryAssets> {
  return cleanUnreferencedCloudinaryAssets(
    publicIds,
    async (publicId) => {
      const [
        { data: galleryReferences, error: galleryError },
        { data: coverReferences, error: coverError },
      ] = await Promise.all([
        admin.from("project_images").select("id").eq("cloudinary_public_id", publicId).limit(1),
        admin.from("projects").select("id").eq("cover_image_public_id", publicId).limit(1),
      ]);

      if (galleryError || coverError) {
        const message = galleryError?.message ?? coverError?.message ?? "Could not verify Cloudinary image references";
        console.error("Could not verify Cloudinary image references:", publicId, message);
        throw new Error(message);
      }

      return (galleryReferences?.length ?? 0) > 0 || (coverReferences?.length ?? 0) > 0;
    },
    deleteAsset,
  );
}
