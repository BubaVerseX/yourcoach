import { format } from "../i18n/format.ts";
import type { Locale } from "@/lib/i18n";
import en from "../i18n/dictionaries/en.ts";
import ka from "../i18n/dictionaries/ka.ts";

const dictionaries = { en, ka };

export const PROJECTION_HORIZON_WEEKS = 12;
/** Rough Wishnofsky rule of thumb: ~7700 kcal of sustained deficit/surplus
 * per kg of body-fat change. A simplification (ignores lean-mass shifts,
 * adaptive metabolism, water weight) but standard for a directional estimate. */
const KCAL_PER_KG = 7700;

export type ProjectionPoint = { week: number; weightKg: number };

/** Deterministic weekly weight trajectory from the calorie target vs. TDEE
 * gap — the AI only writes the milestone narration grounded in these
 * numbers, it never invents the trajectory itself. */
export function computeWeightProjection(
  startingWeightKg: number,
  calorieTarget: number,
  tdee: number,
  horizonWeeks: number = PROJECTION_HORIZON_WEEKS
): { weeklyDeltaKg: number; series: ProjectionPoint[] } {
  const dailyDelta = calorieTarget - tdee;
  const weeklyDeltaKg = Math.round(((dailyDelta * 7) / KCAL_PER_KG) * 100) / 100;

  const series: ProjectionPoint[] = [];
  for (let week = 0; week <= horizonWeeks; week++) {
    series.push({
      week,
      weightKg: Math.round((startingWeightKg + weeklyDeltaKg * week) * 10) / 10,
    });
  }

  return { weeklyDeltaKg, series };
}

/** Non-AI milestone narration — grounded in the same deterministic series
 * computeWeightProjection produces, used whenever the AI call is unavailable
 * or fails (see ensureAiPlan) so premium users always see a projection with
 * milestones, never just an empty list. */
export function buildFormulaMilestones(
  series: ProjectionPoint[],
  weeklyDeltaKg: number,
  locale: Locale
): { weekLabel: string; text: string }[] {
  const t = dictionaries[locale];
  const horizonWeeks = series.length ? series[series.length - 1].week : 0;
  if (horizonWeeks < 1) return [];

  const checkpoints = [...new Set([0.25, 0.5, 0.75, 1].map((f) => Math.max(1, Math.round(horizonWeeks * f))))];

  return checkpoints.map((week) => {
    const point = series.find((p) => p.week === week) ?? series[series.length - 1];
    const weekLabel = format(t.progress.journeyWeekShort, { n: week });
    const text =
      Math.abs(weeklyDeltaKg) < 0.05
        ? format(t.progress.formulaMilestoneMaintain, { week })
        : format(t.progress.formulaMilestoneWeight, { week, weight: point.weightKg });
    return { weekLabel, text };
  });
}
