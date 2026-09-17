import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Tables } from "@/lib/supabase/database.types";
import type { MacroTargets } from "@/lib/plan/nutrition";
import { DAYS_OF_WEEK, computeDayTotalCalories, filterRecipesForProfile, type DayKey, type MealPlanData } from "@/lib/plan/mealPlan";
import type { WorkoutPlanData, PlannedExercise } from "@/lib/plan/workoutPlan";
import { aiPlanSchema, type AiPlanResponse } from "./schema";

type Recipe = Tables<"recipes">;
type Exercise = Tables<"exercises">;
type Profile = Tables<"profiles">;

export type AiPlanResult = {
  mealPlanData: MealPlanData;
  workoutPlanData: WorkoutPlanData;
  milestones: { weekLabel: string; text: string }[];
  modelId: string;
};

const MODEL = "claude-opus-5";

function eligibleExercises(exercises: Exercise[], setting: "home" | "gym" | "both") {
  if (setting === "both") return exercises;
  return exercises.filter((e) => e.setting === setting || e.setting === "both");
}

function buildPrompt(
  profile: Profile,
  recipes: Recipe[],
  exercises: Exercise[],
  calorieTarget: number,
  macros: MacroTargets,
  weeklyDeltaKg: number,
  horizonWeeks: number,
  adherencePercent: number | null
) {
  const recipePool = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    meal_type: r.meal_type,
    calories: r.calories,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    prep_time_minutes: r.prep_time_minutes,
  }));
  const exercisePool = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    muscle_group: e.muscle_group,
    difficulty: e.difficulty,
    default_sets: e.default_sets,
    default_reps: e.default_reps,
  }));

  const trajectoryNote =
    weeklyDeltaKg === 0
      ? "The plan is calorie-neutral (maintenance) — do not project any weight change; ground milestones in consistency, strength, and energy instead."
      : `At this calorie target vs. estimated maintenance, the projected trajectory is about ${Math.abs(weeklyDeltaKg)} kg ${weeklyDeltaKg < 0 ? "lost" : "gained"} per week over ${horizonWeeks} weeks.`;

  // Only ever the real, logged-this-week percentage computed by
  // lib/plan/adherence.ts — null (no note at all) when there isn't enough
  // logged history yet, since a fabricated adherence claim would undercut
  // the whole point of grounding these in real data.
  const adherenceNote =
    adherencePercent === null
      ? ""
      : adherencePercent >= 80
        ? `\n\nThis person has actually followed their plan closely this week (${adherencePercent}% of planned meals/workouts logged) — you may warmly acknowledge that real follow-through in at most one milestone, briefly and without overstating it.`
        : adherencePercent <= 40
          ? `\n\nLogging has been sparse this week (${adherencePercent}% of planned meals/workouts logged) — you may gently note that showing up and logging matters more than the plan itself, in at most one milestone, without shaming or guilt-tripping.`
          : "";

  return `Build a 7-day meal plan and workout plan for this person, selecting only from the provided recipe/exercise pools by id — never invent an id.

Profile:
- Goal: ${profile.goal ?? "maintain"}
- Weight: ${profile.weight_kg ?? "unknown"} kg, height: ${profile.height_cm ?? "unknown"} cm, age: ${profile.age ?? "unknown"}, sex: ${profile.sex ?? "unspecified"}
- Activity level: ${profile.activity_level ?? "unspecified"}
- Allergies: ${profile.allergies?.length ? profile.allergies.join(", ") : "none"}
- Dietary restrictions: ${profile.dietary_restrictions?.length ? profile.dietary_restrictions.join(", ") : "none"}
- Restriction notes: ${profile.restrictions_notes ?? "none"}
- Equipment setting: ${profile.equipment_setting ?? "home"}
- Time available per workout: ${profile.time_available_minutes ?? 30} minutes
- Medical conditions noted: ${profile.medical_conditions ?? "none"}

Daily targets: ${calorieTarget} kcal, ${macros.proteinG}g protein, ${macros.carbsG}g carbs, ${macros.fatG}g fat. Each day's selected meals + snacks should land reasonably close to this target — exact math isn't required, you don't need to compute totals yourself.

Recipe pool (JSON, meal_type already filtered for allergens/restrictions):
${JSON.stringify(recipePool)}

Exercise pool (JSON, already filtered for the person's equipment setting):
${JSON.stringify(exercisePool)}

Workout guidance: pick a sensible number of training days for the stated time budget and goal (mix rest days in), and for each training day set "focus" to the dominant muscle group trained and list 3-6 exercise ids from the pool matching that focus (or a full_body mix for full_body days).

Progress milestones: ${trajectoryNote}${adherenceNote} Write 3-5 short, text-only milestones tied to realistic points in the plan (e.g. specific weeks or habits) — grounded in the plan and the numbers above. Frame each one like a short Georgian toast: open with a brief, warm, slightly poetic line (e.g. "To the week that pushed you further —"), then land on the real grounded number or fact it's tied to. Keep it brief — one toast-like sentence, not a speech. Never describe or imply a change in physical appearance.`;
}

/**
 * Calls Claude to generate a personalized week (meal + workout) using only
 * ids from the given recipe/exercise pools, plus grounded progress
 * milestones. Returns null on any failure (missing key, refusal, invalid/
 * out-of-pool ids, network error) so the caller falls back to the formula
 * generator — this is never the only path to a plan.
 */
export async function generateAiPlan(
  profile: Profile,
  recipes: Recipe[],
  exercises: Exercise[],
  calorieTarget: number,
  macros: MacroTargets,
  weeklyDeltaKg: number,
  horizonWeeks: number,
  adherencePercent: number | null = null
): Promise<AiPlanResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const eligibleRecipes = filterRecipesForProfile(recipes, profile);
  const setting = (profile.equipment_setting ?? "home") as "home" | "gym" | "both";
  const eligibleExerciseList = eligibleExercises(exercises, setting);
  if (eligibleRecipes.length === 0 || eligibleExerciseList.length === 0) return null;

  const client = new Anthropic();

  let response;
  try {
    response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(aiPlanSchema),
      },
      messages: [
        {
          role: "user",
          content: buildPrompt(
            profile,
            eligibleRecipes,
            eligibleExerciseList,
            calorieTarget,
            macros,
            weeklyDeltaKg,
            horizonWeeks,
            adherencePercent
          ),
        },
      ],
    });
  } catch (err) {
    console.error("generateAiPlan request failed", err);
    return null;
  }

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return null;
  }

  const parsed: AiPlanResponse = response.parsed_output;
  const recipeById = new Map(eligibleRecipes.map((r) => [r.id, r]));
  const exerciseById = new Map(eligibleExerciseList.map((e) => [e.id, e]));

  const recipeIdValid = (id: string, mealType: string) => recipeById.get(id)?.meal_type === mealType;

  const calorieById = new Map(eligibleRecipes.map((r) => [r.id, r.calories]));
  const mealDays = {} as MealPlanData["days"];
  const workoutDays = {} as WorkoutPlanData["days"];

  for (const day of DAYS_OF_WEEK) {
    const m = parsed.mealPlan[day];
    if (m.breakfast && !recipeIdValid(m.breakfast, "breakfast")) return null;
    if (m.lunch && !recipeIdValid(m.lunch, "lunch")) return null;
    if (m.dinner && !recipeIdValid(m.dinner, "dinner")) return null;
    if (!m.snacks.every((id) => recipeIdValid(id, "snack"))) return null;

    const dayPlan = {
      breakfast: m.breakfast,
      lunch: m.lunch,
      dinner: m.dinner,
      snacks: m.snacks,
      totalCalories: 0,
    };
    dayPlan.totalCalories = computeDayTotalCalories(dayPlan, calorieById);
    mealDays[day as DayKey] = dayPlan;

    const w = parsed.workoutPlan[day];
    if (w.type === "rest") {
      workoutDays[day as DayKey] = { type: "rest" };
    } else {
      const uniqueIds = [...new Set(w.exerciseIds)];
      if (uniqueIds.length === 0 || !uniqueIds.every((id) => exerciseById.has(id))) return null;
      const plannedExercises: PlannedExercise[] = uniqueIds.map((id) => {
        const exercise = exerciseById.get(id)!;
        return { exerciseId: id, sets: exercise.default_sets, reps: exercise.default_reps };
      });
      workoutDays[day as DayKey] = { type: "workout", focus: w.focus, exercises: plannedExercises };
    }
  }

  return {
    mealPlanData: { days: mealDays },
    workoutPlanData: { days: workoutDays },
    milestones: parsed.milestones.slice(0, 5),
    modelId: response.model,
  };
}
