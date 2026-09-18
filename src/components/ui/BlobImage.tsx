import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlobImageProps {
  src?: string | null;
  alt: string;
  icon?: LucideIcon;
  variant?: 1 | 2 | 3;
  className?: string;
  /** Passed through to next/image; tune per usage so the browser doesn't
   * download an oversized crop for a small thumbnail. */
  sizes?: string;
  /** Preloads via a <link> in <head> — reserve for a true above-the-fold
   * hero photo (Next 16's replacement for the deprecated `priority` prop). */
  preload?: boolean;
}

const GRADIENTS = [
  "linear-gradient(135deg, #e11d1d 0%, #f04444 100%)",
  "linear-gradient(135deg, #2dd4bf 0%, #67e8dd 100%)",
  "linear-gradient(135deg, #e11d1d 0%, #2dd4bf 100%)",
];

export function BlobImage({
  src,
  alt,
  icon: Icon,
  variant = 1,
  className,
  sizes = "128px",
  preload = false,
}: BlobImageProps) {
  const blobClass = variant === 2 ? "blob-variant-2" : variant === 3 ? "blob-variant-3" : "";

  return (
    <div
      className={cn(
        "soft-raised blob-mask relative flex items-center justify-center",
        blobClass,
        className
      )}
      style={!src ? { background: GRADIENTS[variant - 1] } : undefined}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          loading={preload ? undefined : "eager"}
          preload={preload}
        />
      ) : Icon ? (
        <Icon strokeWidth={1.8} className="h-[38%] w-[38%] text-white/90" />
      ) : null}
    </div>
  );
}
