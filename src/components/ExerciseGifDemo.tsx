"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { exerciseGifProxyPath } from "@/lib/exercises/workoutx";

/**
 * Real exercise demonstration content from the WorkoutX API (lib/exercises/
 * ensureExerciseGifs.ts) — an animated GIF, not a video, hence `gifUrl` /
 * `exerciseGifUrl` naming throughout this feature rather than `videoUrl`.
 * Renders nothing when no GIF resolved for this exercise (no match, no API
 * key, or the free-tier limit was hit) — the existing text instructions
 * above it on the exercise card are the fallback, not a message here.
 * Collapsed by default, same pattern as ExerciseMuscleDiagram and
 * ExerciseAvatarAnimation, so the three coexist without competing for space.
 */
export function ExerciseGifDemo({ exerciseGifUrl }: { exerciseGifUrl: string | null }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  const proxyPath = exerciseGifProxyPath(exerciseGifUrl);
  if (!proxyPath) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-fit items-center gap-1.5 text-xs font-bold text-[var(--color-accent-2)]"
      >
        <Play strokeWidth={2} className="h-3.5 w-3.5" />
        {open ? t.workouts.gifDemo.hide : t.workouts.gifDemo.show}
        {open ? (
          <ChevronUp strokeWidth={2} className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown strokeWidth={2} className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-accent-2)]/40 bg-[var(--color-surface)] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF; next/image would strip the animation */}
          <img
            src={proxyPath}
            alt={t.workouts.gifDemo.caption}
            className="mx-auto h-[220px] w-auto rounded-xl bg-[var(--color-bg)] object-contain"
            loading="lazy"
          />
          <p className="px-1 text-center text-[10px] text-[var(--color-text-tertiary)]">
            {t.workouts.gifDemo.caption}
          </p>
        </div>
      )}
    </div>
  );
}
