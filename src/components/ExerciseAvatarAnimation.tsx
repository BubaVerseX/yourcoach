"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { ExerciseAvatarViewer } from "@/components/avatar/ExerciseAvatarViewer";
import type { MovementPattern } from "@/lib/avatar/animation";

/**
 * The distinctive, ShadowCoach-only element on the exercise detail view: a
 * generic avatar looping the movement pattern this exercise most resembles,
 * with the muscles it trains glowing in the app's own accent colors.
 * Collapsed by default and the three.js scene is lazy-loaded (see
 * ExerciseAvatarViewer) — it only ever mounts once a viewer explicitly opens
 * it, never on ordinary page load.
 */
export function ExerciseAvatarAnimation({
  pattern,
  primaryMuscles,
  secondaryMuscles,
}: {
  pattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-fit items-center gap-1.5 text-xs font-bold text-[var(--color-accent)]"
      >
        <Sparkles strokeWidth={2} className="h-3.5 w-3.5" />
        {open ? t.workouts.avatarDemo.hide : t.workouts.avatarDemo.show}
        {open ? (
          <ChevronUp strokeWidth={2} className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown strokeWidth={2} className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-surface)] p-3">
          <ExerciseAvatarViewer
            pattern={pattern}
            primaryMuscles={primaryMuscles}
            secondaryMuscles={secondaryMuscles}
            className="h-[280px] w-full bg-[var(--color-bg)]"
          />
          <p className="px-1 text-center text-[10px] text-[var(--color-text-tertiary)]">
            {t.workouts.avatarDemo.caption}
          </p>
        </div>
      )}
    </div>
  );
}
