import { createAdminClient } from "@/lib/supabase/admin";
import { findWorkoutXExercise } from "./workoutx";
import { findMuscleMismatches, type MuscleMismatch } from "./muscleCrossCheck";
import type { Tables } from "@/lib/supabase/database.types";

export type GifMismatchReport = {
  exerciseId: string;
  exerciseName: string;
  mismatches: MuscleMismatch[];
};

/**
 * Fetches + caches a WorkoutX demo GIF for any exercise missing one, matched
 * by fuzzy name search. Rows that already have a gif url, or that we've
 * already tried and failed to match (exercise_gif_fetched_at set), are left
 * alone — same cache-once pattern as ensureExerciseImages (lib/images/
 * ensureImages.ts) for Unsplash. Never overwrites primary_muscles/
 * secondary_muscles; a mismatch between WorkoutX's reported muscles and the
 * app's existing tags is only ever reported back, not applied.
 */
export async function ensureExerciseGifs(
  exercises: Tables<"exercises">[]
): Promise<{ exercises: Tables<"exercises">[]; mismatches: GifMismatchReport[] }> {
  if (!process.env.WORKOUT_VIDEO_API_KEY) return { exercises, mismatches: [] };
  const admin = createAdminClient();
  const needsFetch = exercises.filter((e) => !e.exercise_gif_url && !e.exercise_gif_fetched_at);
  if (!admin || needsFetch.length === 0) return { exercises, mismatches: [] };

  const patches = new Map<string, { exercise_gif_url: string | null; exercise_gif_fetched_at: string }>();
  const mismatches: GifMismatchReport[] = [];

  await Promise.all(
    needsFetch.map(async (exercise) => {
      const result = await findWorkoutXExercise(exercise.name);
      if (result.status === "retryable") return; // don't cache a transient failure as a permanent miss

      const patch = {
        exercise_gif_url: result.status === "matched" ? result.exercise.gifUrl : null,
        exercise_gif_fetched_at: new Date().toISOString(),
      };
      patches.set(exercise.id, patch);
      await admin.from("exercises").update(patch).eq("id", exercise.id);

      if (result.status === "matched") {
        const found = findMuscleMismatches(
          result.exercise.target,
          result.exercise.secondaryMuscles,
          exercise.primary_muscles,
          exercise.secondary_muscles
        );
        if (found.length > 0) {
          mismatches.push({ exerciseId: exercise.id, exerciseName: exercise.name, mismatches: found });
        }
      }
    })
  );

  return {
    exercises: exercises.map((e) => (patches.has(e.id) ? { ...e, ...patches.get(e.id)! } : e)),
    mismatches,
  };
}
