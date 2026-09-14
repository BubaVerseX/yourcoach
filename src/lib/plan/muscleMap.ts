import type { MuscleGroup, MuscleMapSex, MuscleMapValues, MuscleMapView } from "@musclemap/core";
import { MUSCLE_GROUP_META } from "@musclemap/core";

/**
 * The `exercises.primary_muscles` / `secondary_muscles` columns store the
 * same taxonomy as @musclemap/core's MuscleGroup enum, lowercased to match
 * this schema's existing enum convention (see migration 0008). This just
 * upcases into the shape MuscleMap expects.
 */
export function toMuscleGroup(dbValue: string): MuscleGroup | null {
  const upper = dbValue.toUpperCase();
  return upper in MUSCLE_GROUP_META ? (upper as MuscleGroup) : null;
}

/**
 * Two fixed, well-separated scores on the BALANCE color model, standing in
 * for "primary" (strong orange/red) vs "secondary" (cool blue) — the closest
 * match MuscleMap's real API offers to this app's own orange/blue duotone
 * (see globals.css --color-accent / --color-accent-2). MuscleMap doesn't
 * expose a raw per-group hex override, only score-driven built-in palettes
 * or a single-hue monochrome scale, so this is the "sensible defaults"
 * fallback rather than literal brand hex values.
 */
const PRIMARY_SCORE = 90;
const SECONDARY_SCORE = 22;

export function buildMuscleMapValues(
  primary: string[],
  secondary: string[]
): MuscleMapValues {
  const values: MuscleMapValues = {};
  for (const raw of secondary) {
    const group = toMuscleGroup(raw);
    if (group) values[group] = { score: SECONDARY_SCORE };
  }
  // Primary overwrites secondary if an exercise lists the same group in both
  // (shouldn't happen given the seed data, but primary should win).
  for (const raw of primary) {
    const group = toMuscleGroup(raw);
    if (group) values[group] = { score: PRIMARY_SCORE };
  }
  return values;
}

/**
 * Picks the narrowest view (FRONT/BACK) that still shows every involved
 * muscle group, falling back to BOTH only when the groups genuinely span
 * both sides of the body — keeps the diagram compact on exercise cards
 * instead of always rendering a front+back pair.
 */
export function viewForMuscles(primary: string[], secondary: string[]): MuscleMapView {
  const groups = [...primary, ...secondary].map(toMuscleGroup).filter((g): g is MuscleGroup => !!g);
  let needsFront = false;
  let needsBack = false;
  for (const group of groups) {
    const visibility = MUSCLE_GROUP_META[group].visibility;
    if (visibility === "FRONT") needsFront = true;
    else if (visibility === "BACK") needsBack = true;
    // BOTH-visibility groups render fine from either side, so they don't force a view.
  }
  if (needsFront && needsBack) return "BOTH";
  if (needsBack) return "BACK";
  return "FRONT";
}

export function sexForMuscleMap(sex: string | null): MuscleMapSex {
  return sex === "female" ? "FEMALE" : "MALE";
}
