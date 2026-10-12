"use client";

import Image from "next/image";
import { useState } from "react";
import { imageSource } from "@/lib/media";

export default function Photo({
  src,
  alt,
  priority = false,
  sizes,
  position = 50,
  fit = "cover",
}: {
  src?: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  position?: number;
  fit?: "cover" | "contain";
}) {
  const [failed, setFailed] = useState<string>();
  const source = imageSource(src);
  const fallback = "/textures/cotton.jpg";
  const displayed = source && failed !== source ? source : fallback;
  return (
    <Image
      src={displayed}
      alt={displayed === fallback ? "" : alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={displayed.startsWith("http")}
      style={{ objectFit: fit, objectPosition: `50% ${position}%` }}
      onError={() => {
        if (source && displayed !== fallback) setFailed(source);
      }}
    />
  );
}
