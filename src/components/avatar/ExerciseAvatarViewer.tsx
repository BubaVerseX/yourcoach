"use client";

import dynamic from "next/dynamic";
import type { MovementPattern } from "@/lib/avatar/animation";

/** Public entry point — dynamically imported with ssr:false so the three.js/
 * @react-three/fiber bundle is fetched only once this mounts, never at
 * module-eval time. Callers gate mounting behind an explicit expand action
 * (see ExerciseAvatarAnimation) rather than rendering it unconditionally. */
const ExerciseAvatarScene = dynamic(
  () => import("./ExerciseAvatarScene").then((m) => m.ExerciseAvatarScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-tertiary)]">
        …
      </div>
    ),
  }
);

export function ExerciseAvatarViewer({
  pattern,
  primaryMuscles,
  secondaryMuscles,
  className,
}: {
  pattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <ExerciseAvatarScene pattern={pattern} primaryMuscles={primaryMuscles} secondaryMuscles={secondaryMuscles} />
    </div>
  );
}
