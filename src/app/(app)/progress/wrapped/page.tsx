import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { currentWeekStart, dateForDay } from "@/lib/plan/weekDate";
import { DAYS_OF_WEEK } from "@/lib/plan/mealPlan";
import { computeWorkoutStreak } from "@/lib/plan/streak";
import { getOrCreateWeekPlans } from "@/lib/plan/getWeekPlans";
import { WeeklyWrappedCard } from "@/components/WeeklyWrappedCard";

export default async function WrappedPage() {
  const supabase = await createClient();
  const { t } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = currentWeekStart();
  const weekDates = DAYS_OF_WEEK.map((day) => dateForDay(weekStart, day));
  const weekEnd = weekDates[weekDates.length - 1];

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [{ data: weekLogs }, { data: streakLogs }, { data: weekMealLogs }, { mealPlan }] = await Promise.all([
    supabase
      .from("progress_logs")
      .select("date, workout_completed")
      .eq("user_id", user.id)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    supabase
      .from("progress_logs")
      .select("date, workout_completed")
      .eq("user_id", user.id)
      .gte("date", sixtyDaysAgo.toISOString().slice(0, 10)),
    supabase
      .from("meal_logs")
      .select("status")
      .eq("user_id", user.id)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    getOrCreateWeekPlans(user.id, weekStart),
  ]);

  const workoutsThisWeek = (weekLogs ?? []).filter((l) => l.workout_completed).length;
  const streak = computeWorkoutStreak(streakLogs ?? [], new Date().toISOString().slice(0, 10));

  const totalLoggedMeals = (weekMealLogs ?? []).length;
  const mealsOnTarget = (weekMealLogs ?? []).filter((l) => l.status === "eaten").length;
  const mealsOnTargetPercent =
    totalLoggedMeals > 0 ? Math.round((mealsOnTarget / totalLoggedMeals) * 100) : null;

  const dateRangeLabel = `${new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(
    weekEnd
  ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`.toUpperCase();

  return (
    <div className="flex flex-col gap-6 py-6">
      <Link
        href="/progress"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]"
      >
        <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
        {t.progress.title}
      </Link>

      <div>
        <h1 className="gradient-text-signature text-3xl font-extrabold tracking-tight">{t.progress.wrappedTitle}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{t.progress.wrappedSubtitle}</p>
      </div>

      <WeeklyWrappedCard
        workoutsThisWeek={workoutsThisWeek}
        mealsOnTargetPercent={mealsOnTargetPercent}
        streak={streak}
        calorieTarget={mealPlan?.calorieTarget ?? null}
        dateRangeLabel={dateRangeLabel}
      />
    </div>
  );
}
