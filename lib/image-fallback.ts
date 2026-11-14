export type ImageLoadState = "original" | "fallback" | "unavailable";

export function nextImageLoadState(state: ImageLoadState): ImageLoadState {
  return state === "original" ? "fallback" : "unavailable";
}
