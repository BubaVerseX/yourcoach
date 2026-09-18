import Image from "next/image";
import { cn } from "@/lib/utils";

interface DuotonePhotoProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
  /** CSS clip-path polygon for the diagonal-cut motif. */
  clipPath?: string;
}

/** Athletic photography treatment (Rule B) — duotone red/teal base with a
 * red diagonal legibility overlay. Never use on food photography. */
export function DuotonePhoto({ src, alt, className, sizes = "100vw", preload, clipPath }: DuotonePhotoProps) {
  return (
    <div className={cn("relative overflow-hidden bg-[var(--color-duotone-a)]", className)} style={clipPath ? { clipPath } : undefined}>
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover grayscale contrast-125 brightness-90"
          loading={preload ? undefined : "eager"}
          preload={preload}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(135deg, var(--color-duotone-a) 0%, var(--color-duotone-b) 100%)",
          mixBlendMode: "color",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(200deg, rgba(225,29,29,0.22), rgba(10,10,10,0.9))" }}
      />
    </div>
  );
}
