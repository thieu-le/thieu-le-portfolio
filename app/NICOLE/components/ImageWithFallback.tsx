"use client";

import Image from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = "",
}: ImageWithFallbackProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-[#F5F5F5] text-[#999] text-xl`}
      >
        {alt}
      </div>
    );
  }

  // Handle both local and external URLs
  if (src.startsWith("http")) {
    // For external URLs, use Next.js Image with unoptimized flag
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        onError={() => setImgError(true)}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      onError={() => setImgError(true)}
    />
  );
}
