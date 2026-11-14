"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { nextImageLoadState, type ImageLoadState } from "@/lib/image-fallback";

type Props = Omit<ImageProps, "src"> & { src: string; fallbackSrc?: string };

export default function ResilientImage({ src, fallbackSrc = "/placeholder.jpg", onError, ...props }: Props) {
  const [state, setState] = useState<ImageLoadState>("original");

  useEffect(() => {
    setState("original");
  }, [src]);

  if (state === "unavailable") {
    return <div className={props.className} role="img" aria-label={props.alt || "Image unavailable"} />;
  }

  return <Image
    {...props}
    src={state === "fallback" ? fallbackSrc : src}
    onError={(event) => {
      onError?.(event);
      setState((current) => nextImageLoadState(current));
    }}
  />;
}
