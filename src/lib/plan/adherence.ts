import { createClient } from "@/lib/supabase/server";
import { DAYS_OF_WEEK, type MealPlanData, type MealSlotKey } from "./mealPlan";
import type { WorkoutPlanData } from "./workoutPlan";
import { dateForDay } from "./weekDate";

const MAIN_SLOTS: MealSlotKey[] = ["breakfast", "lunch", "dinner"];

export type AdherenceLogs = {
  mealLogs: { date: string; slot: string }[];
  workoutLogs: { date: string; workout_completed: boolean | null }[];
};

export type AdherenceResult = {
  mealsLogged: number;
  mealsExpected: number;
  workoutsCompleted: number;
  workoutsExpected: number;
  /** null when nothing was due yet (e.g. plan not generated) — never a
   * fabricated 0%, which would read as "you failed" rather than "no data". */
  percent: number | null;
  hasData: boolean;
};

/**
 * Real adherence for the days of `weekStart`'s week that have already
 * elapsed (weekStart..todayDate inclusive, never a future day). Expected
 * counts come only from what the plan actually scheduled (main meal slots
 * that are filled, days marked as a workout); logged counts come only from
 * meal_logs/progress_logs rows the user actually created — nothing here is
 * estimated or inferred.
 */
export function computeAdherence(
  mealPlanDays: MealPlanData["days"] | null | undefined,
  workoutPlanDays: WorkoutPlanData["days"] | null | undefined,
  weekStart: string,
  todayDate: string,
  logs: AdherenceLogs
): AdherenceResult {
  const mealLoggedKeys = new Set(logs.mealLogs.map((l) => `${l.date}:${l.slot}`));
  const workoutCompletedDates = new Set(
    logs.workoutLogs.filter((l) => l.workout_completed === true).map((l) => l.date)
  );

  let mealsExpected = 0;
  let mealsLogged = 0;
  let workoutsExpected = 0;
  let workoutsCompleted = 0;

  for (const day of DAYS_OF_WEEK) {
    const date = dateForDay(weekStart, day);
    if (date > todayDate) continue;

    const mealDay = mealPlanDays?.[day];
    if (mealDay) {
      for (const slot of MAIN_SLOTS) {
        if (!mealDay[slot]) continue;
        mealsExpected++;
        if (mealLoggedKeys.has(`${date}:${slot}`)) mealsLogged++;
      }
    }

    const workoutDay = workoutPlanDays?.[day];
    if (workoutDay?.type === "workout") {
      workoutsExpected++;
      if (workoutCompletedDates.has(date)) workoutsCompleted++;
    }
  }

  const totalExpected = mealsExpected + workoutsExpected;
  const totalLogged = mealsLogged + workoutsCompleted;
  const percent = totalExpected > 0 ? Math.round((totalLogged / totalExpected) * 100) : null;

  return { mealsLogged, mealsExpected, workoutsCompleted, workoutsExpected, percent, hasData: totalExpected > 0 };
}

/**
 * Fetches this week's plan + logs for `userId` and computes real adherence
 * over the days elapsed so far. Returns hasData: false (never a fabricated
 * percentage) when this week's plan hasn't been generated yet.
 */
export async function getWeekAdherence(userId: string, weekStart: string): Promise<AdherenceResult> {
  const supabase = await createClient();
  const todayDate = new Date().toISOString().slice(0, 10);

  const [{ data: mealRow }, { data: workoutRow }, { data: mealLogs }, { data: workoutLogs }] =
    await Promise.all([
      supabase.from("meal_plans").select("plan_data").eq("user_id", userId).eq("week_start", weekStart).maybeSingle(),
      supabase.from("workout_plans").select("plan_data").eq("user_id", userId).eq("week_start", weekStart).maybeSingle(),
      supabase.from("meal_logs").select("date, slot").eq("user_id", userId).gte("date", weekStart).lte("date", todayDate),
      supabase
        .from("progress_logs")
        .select("date, workout_completed")
        .eq("user_id", userId)
        .gte("date", weekStart)
        .lte("date", todayDate),
    ]);

  const mealPlanDays = (mealRow?.plan_data as unknown as MealPlanData | undefined)?.days;
  const workoutPlanDays = (workoutRow?.plan_data as unknown as WorkoutPlanData | undefined)?.days;

  return computeAdherence(mealPlanDays, workoutPlanDays, weekStart, todayDate, {
    mealLogs: mealLogs ?? [],
    workoutLogs: workoutLogs ?? [],
  });
}
