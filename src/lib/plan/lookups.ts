import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { ensureRecipeImages, ensureExerciseImages } from "@/lib/images/ensureImages";
import { ensureExerciseGifs } from "@/lib/exercises/ensureExerciseGifs";

export async function getRecipesByIds(ids: string[]): Promise<Map<string, Tables<"recipes">>> {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("recipes").select("*").in("id", uniqueIds);
  const recipes = await ensureRecipeImages(data ?? []);
  return new Map(recipes.map((r) => [r.id, r]));
}

export async function getExercisesByIds(ids: string[]): Promise<Map<string, Tables<"exercises">>> {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("exercises").select("*").in("id", uniqueIds);
  const withImages = await ensureExerciseImages(data ?? []);
  const { exercises } = await ensureExerciseGifs(withImages);
  return new Map(exercises.map((e) => [e.id, e]));
}

export function mealIdsFromDay(day: {
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  snacks: string[];
}) {
  return [day.breakfast, day.lunch, day.dinner, ...day.snacks].filter((id): id is string => !!id);
}
