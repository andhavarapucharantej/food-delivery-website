"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FALLBACK_FOOD_IMAGE } from "@/lib/images";

interface FoodImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

export function FoodImage({
  src,
  alt,
  className = "",
  fill = false,
  width,
  height,
  priority = false,
  sizes,
}: FoodImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || FALLBACK_FOOD_IMAGE);
  const [hasError, setHasError] = useState<boolean>(false);

  return (
    <Image
      src={hasError ? FALLBACK_FOOD_IMAGE : imgSrc}
      alt={alt || "Food image"}
      className={className}
      fill={fill}
      width={!fill ? width || 400 : undefined}
      height={!fill ? height || 300 : undefined}
      priority={priority}
      sizes={sizes}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(FALLBACK_FOOD_IMAGE);
        }
      }}
    />
  );
}

export default FoodImage;
