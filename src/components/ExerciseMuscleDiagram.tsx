"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MuscleMap } from "@musclemap/react";
import { getMuscleHeatColor } from "@musclemap/core";
import { useLocale } from "@/lib/i18n";
import {
  buildMuscleMapValues,
  toMuscleGroup,
  viewForMuscles,
} from "@/lib/plan/muscleMap";

const PRIMARY_SCORE = 90;
const SECONDARY_SCORE = 22;
const PRIMARY_COLOR = getMuscleHeatColor(PRIMARY_SCORE, "BALANCE");
const SECONDARY_COLOR = getMuscleHeatColor(SECONDARY_SCORE, "BALANCE");

/**
 * Per-exercise muscle-highlight diagram — primary muscle in one color,
 * secondary muscles in a distinguishable second color, scoped to the single
 * exercise it's attached to (not a historical/aggregate heatmap). Collapsed
 * by default so it doesn't add visual weight to every exercise card.
 *
 * Not tied to the viewer's own body: this illustrates which muscles the
 * exercise trains in general, the same generic reference diagram every user
 * sees. Personalized body visualization lives separately in the goal avatar.
 */
export function ExerciseMuscleDiagram({
  primaryMuscles,
  secondaryMuscles,
}: {
  primaryMuscles: string[];
  secondaryMuscles: string[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const groupLabels = t.workouts.muscleMap.groups;

  const values = useMemo(
    () => buildMuscleMapValues(primaryMuscles, secondaryMuscles),
    [primaryMuscles, secondaryMuscles]
  );
  const view = useMemo(
    () => viewForMuscles(primaryMuscles, secondaryMuscles),
    [primaryMuscles, secondaryMuscles]
  );
  const labels = useMemo(() => {
    const map: Partial<Record<string, string>> = {};
    for (const raw of [...primaryMuscles, ...secondaryMuscles]) {
      const group = toMuscleGroup(raw);
      if (group) map[group] = groupLabels[raw as keyof typeof groupLabels] ?? raw;
    }
    return map;
  }, [primaryMuscles, secondaryMuscles, groupLabels]);

  if (primaryMuscles.length === 0 && secondaryMuscles.length === 0) return null;

  const namesFor = (raw: string[]) =>
    raw.map((m) => groupLabels[m as keyof typeof groupLabels] ?? m).join(", ");

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-fit items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]"
      >
        {open ? t.workouts.muscleMap.hide : t.workouts.muscleMap.show}
        {open ? (
          <ChevronUp strokeWidth={2} className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown strokeWidth={2} className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <MuscleMap
            values={values}
            sex="MALE"
            view={view}
            colorModel="BALANCE"
            labels={labels}
            figureWidth={132}
            showLegend={false}
            glow={false}
          />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
            {primaryMuscles.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                />
                <span className="font-bold text-[var(--color-text-primary)]">
                  {t.workouts.muscleMap.primary}
                </span>
                <span className="text-[var(--color-text-tertiary)]">
                  {namesFor(primaryMuscles)}
                </span>
              </span>
            )}
            {secondaryMuscles.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SECONDARY_COLOR }}
                />
                <span className="font-bold text-[var(--color-text-primary)]">
                  {t.workouts.muscleMap.secondary}
                </span>
                <span className="text-[var(--color-text-tertiary)]">
                  {namesFor(secondaryMuscles)}
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
