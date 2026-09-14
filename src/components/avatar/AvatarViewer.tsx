"use client";

import dynamic from "next/dynamic";
import type { AvatarParams } from "@/lib/avatar/types";

/**
 * Public entry point for the 3D avatar. The three.js/@react-three/fiber
 * scene (AvatarCanvas) is dynamically imported with ssr:false, so its
 * ~600KB+ of JS is never fetched on ordinary page loads — only when a
 * consumer actually mounts <AvatarViewer>, which callers gate behind an
 * explicit "open" action (see GoalAvatarPanel) rather than rendering it
 * unconditionally.
 */
const AvatarCanvas = dynamic(() => import("./AvatarCanvas").then((m) => m.AvatarCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-tertiary)]">
      …
    </div>
  ),
});

export function AvatarViewer({
  params,
  accentHex,
  className,
}: {
  params: AvatarParams;
  accentHex?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <AvatarCanvas params={params} accentHex={accentHex} />
    </div>
  );
}
