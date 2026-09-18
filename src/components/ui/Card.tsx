import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Elevated surface — flat var(--color-surface) field, hairline border,
 * no radius, no shadow. This system has no elevation, only contrast. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-5",
        className
      )}
      {...props}
    />
  );
}

/** Deeper surface — for share/summary contexts (wrapped card, etc). */
export function SurfaceCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-none border border-[var(--color-border)] bg-[var(--color-bg-deep)] p-5",
        className
      )}
      {...props}
    />
  );
}
