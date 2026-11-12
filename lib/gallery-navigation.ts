export type GalleryDirection = "previous" | "next";
export type GalleryKeyAction = GalleryDirection | "close";

export function getGalleryKeyAction(key: string): GalleryKeyAction | null {
  if (key === "Escape") return "close";
  if (key === "ArrowLeft") return "previous";
  if (key === "ArrowRight") return "next";
  return null;
}

export function getAdjacentGalleryIndex(
  currentIndex: number,
  direction: GalleryDirection,
  imageCount: number,
): number {
  if (imageCount <= 0) return 0;
  const offset = direction === "next" ? 1 : -1;
  return (currentIndex + offset + imageCount) % imageCount;
}
