import Link from "next/link";
import { Flame, UtensilsCrossed, Dumbbell, Scale, Utensils, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import en from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import { currentWeekStart, dayKeyForDate } from "@/lib/plan/generatePlan";
import { getOrCreateWeekPlans } from "@/lib/plan/getWeekPlans";
import { getRecipesByIds, getExercisesByIds, mealIdsFromDay } from "@/lib/plan/lookups";
import { portionFor } from "@/lib/plan/mealPlan";
import { localizedField } from "@/lib/plan/localized";
import { computeWorkoutStreak } from "@/lib/plan/streak";
import { getWeekAdherence } from "@/lib/plan/adherence";
import { caloriesToKhinkali, estimateWorkoutCalories } from "@/lib/plan/culturalUnits";
import type { MealLogStatus } from "@/lib/actions/mealFriction";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { BlobImage } from "@/components/ui/BlobImage";
import { DuotonePhoto } from "@/components/ui/DuotonePhoto";
import { ImageAttribution } from "@/components/ui/ImageAttribution";
import { PaywallLock } from "@/components/PaywallLock";
import { QuickMealLogToggle } from "@/components/QuickMealLogToggle";
import { WorkoutCompleteButton } from "@/components/WorkoutCompleteButton";
import { RotatingBanner } from "@/components/RotatingBanner";
import { MacroDonutChart } from "@/components/charts/MacroDonutChart";
import { ensureFeatureImages } from "@/lib/images/ensureFeatureImages";

const MAIN_SLOTS = ["breakfast", "lunch", "dinner"] as const;

export default async function HomePage() {
  const supabase = await createClient();
  const { t, locale } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const weekStart = currentWeekStart();
  const todayKey = dayKeyForDate();
  const { mealPlan, workoutPlan, isEphemeral } = await getOrCreateWeekPlans(user.id, weekStart);
  const adherence = isEphemeral ? null : await getWeekAdherence(user.id, weekStart);

  const todayMeals = mealPlan?.planData.days[todayKey];
  const todayWorkout = workoutPlan?.planData.days[todayKey];

  const recipeMap = await getRecipesByIds(todayMeals ? mealIdsFromDay(todayMeals) : []);
  const exerciseIds =
    todayWorkout?.type === "workout" ? todayWorkout.exercises.map((e) => e.exerciseId) : [];
  const exerciseMap = await getExercisesByIds(exerciseIds);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const streakWindowStart = new Date();
  streakWindowStart.setDate(streakWindowStart.getDate() - 60);
  const { data: recentLogs } = await supabase
    .from("progress_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", streakWindowStart.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
  const workoutsCompleted = (recentLogs ?? []).filter(
    (l) => l.workout_completed && l.date >= sevenDaysAgoStr
  ).length;
  const latestWeight = [...(recentLogs ?? [])].reverse().find((l) => l.weight_kg != null)?.weight_kg;

  const todayDate = new Date().toISOString().slice(0, 10);
  const workoutStreak = computeWorkoutStreak(recentLogs ?? [], todayDate);
  const todayProgressLog = (recentLogs ?? []).find((l) => l.date === todayDate);
  const { data: todayMealLogs } = await supabase
    .from("meal_logs")
    .select("slot, status")
    .eq("user_id", user.id)
    .eq("date", todayDate);
  const mealLogBySlot = new Map(
    (todayMealLogs ?? []).map((row) => [row.slot, row.status as MealLogStatus])
  );

  const bannerImages = await ensureFeatureImages([
    { id: "banner_strength", query: "strength training weightlifting" },
    { id: "banner_cardio", query: "cardio running fitness" },
    { id: "banner_home", query: "home workout bodyweight exercise" },
    { id: "banner_outdoor", query: "outdoor training athlete" },
  ]);
  const bannerSlides = [
    { id: "banner_strength", label: t.home.trainStrength },
    { id: "banner_cardio", label: t.home.trainCardio },
    { id: "banner_home", label: t.home.trainHome },
    { id: "banner_outdoor", label: t.home.trainOutdoor },
  ].map(({ id, label }) => {
    const img = bannerImages.get(id);
    return { label, url: img?.url, attributionName: img?.attributionName, attributionUrl: img?.attributionUrl };
  });

  const featuredExercise =
    todayWorkout?.type === "workout" && todayWorkout.exercises.length > 0
      ? exerciseMap.get(todayWorkout.exercises[0].exerciseId)
      : undefined;

  const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-mono-label block text-[10px] text-[var(--color-text-tertiary)]">{weekday}</span>
          <h1 className="gradient-text-signature text-[26px] font-black tracking-[-0.03em]">
            {t.common.today}
          </h1>
        </div>
        {workoutStreak > 0 && (
          <div className="flex items-center gap-2 rounded-full border-[1.5px] border-[var(--color-accent)] bg-[var(--color-surface)] px-3 py-1.5">
            <span className="text-display text-xl text-[var(--color-accent)]">{workoutStreak}</span>
            <span className="flex flex-col leading-[1.15]">
              <span className="text-mono-label text-[8.5px] text-[var(--color-text-secondary)]">DAY</span>
              <span className="text-mono-label text-[8.5px] text-[var(--color-text-secondary)]">STREAK</span>
            </span>
          </div>
        )}
      </div>

      <p className="-mt-4 text-sm text-[var(--color-text-secondary)]">
        {format(t.home.greeting, { name: profile?.full_name?.split(" ")[0] ?? "" })}
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          value={mealPlan?.calorieTarget ?? "—"}
          label={t.home.calorieTarget}
          accent="primary"
        />
        <StatCard
          value={latestWeight ?? (profile?.weight_kg ?? "—")}
          label={t.progress.currentWeight}
          accent="secondary"
        />
        <StatCard value={workoutsCompleted} label={t.progress.workoutsThisWeek} />
        <StatCard value={profile?.goal ? t.onboarding[goalLabelKey(profile.goal)] : "—"} label={t.onboarding.goal} />
      </div>

      {adherence && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-secondary)]">{t.progress.adherenceLabel}</h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {adherence.hasData
                  ? format(t.progress.adherenceDetail, {
                      logged: adherence.mealsLogged + adherence.workoutsCompleted,
                      expected: adherence.mealsExpected + adherence.workoutsExpected,
                    })
                  : t.progress.adherenceNoData}
              </p>
            </div>
            <span className="text-display text-3xl text-[var(--color-accent)]">
              {adherence.percent != null ? `${adherence.percent}%` : "—"}
            </span>
          </div>
        </Card>
      )}

      {todayWorkout?.type === "workout" && (
        <MaybeLocked locked={!!isEphemeral}>
          <div className="flex flex-col gap-3">
            <div className="card-activity relative h-[250px] w-full">
              <DuotonePhoto
                src={featuredExercise?.image_url}
                alt=""
                className="h-full w-full"
                sizes="(min-width: 768px) 700px, 100vw"
              />
              <span className="text-mono-label absolute top-4 left-4 z-10 bg-[var(--color-accent)] px-2.5 py-1 text-[9px] text-[var(--color-bg)]">
                TODAY&apos;S SESSION
              </span>
              <span className="text-mono-label absolute top-4 right-4 z-10 flex items-center gap-1 bg-black/60 px-2.5 py-1 text-[9px] text-[var(--color-text-primary)]">
                <Clock strokeWidth={2} className="h-3 w-3" />
                {format(t.home.approxDuration, { minutes: profile?.time_available_minutes ?? 30 })}
              </span>
              <div className="absolute right-0 bottom-0 left-0 z-10 p-4">
                <h2 className="text-display gradient-text-signature text-[36px] md:text-[44px]">
                  {(en.workouts.muscleGroups[todayWorkout.focus as keyof typeof en.workouts.muscleGroups] ??
                    todayWorkout.focus
                  ).toUpperCase()}
                </h2>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  {t.workouts.muscleGroups[todayWorkout.focus as keyof typeof t.workouts.muscleGroups] ??
                    todayWorkout.focus}
                  {" · "}
                  {format(t.home.approxDuration, { minutes: profile?.time_available_minutes ?? 30 })}
                </p>
              </div>
              <div
                className="absolute right-0 bottom-0 left-0 z-10 h-[56px] bg-[var(--color-bg)]"
                style={{ clipPath: "polygon(0 100%, 100% 45%, 100% 100%)" }}
              />
            </div>
            <div className="flex gap-3">
              {isEphemeral ? (
                <>
                  <Button variant="primary" className="w-full flex-1">
                    {t.home.startSession}
                  </Button>
                  <Button variant="ghost" className="w-full flex-1">
                    {t.home.skipSession}
                  </Button>
                </>
              ) : (
                <>
                  <Link href={`/workouts/${todayKey}`} className="flex-1">
                    <Button variant="primary" className="w-full">
                      {t.home.startSession}
                    </Button>
                  </Link>
                  <Link href={`/workouts/${todayKey}`} className="flex-1">
                    <Button variant="ghost" className="w-full">
                      {t.home.skipSession}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </MaybeLocked>
      )}

      <RotatingBanner slides={bannerSlides} />

      {mealPlan && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold tracking-tight">{t.home.macros}</h2>
          <div className="flex items-center gap-6">
            <MacroDonutChart
              proteinG={mealPlan.macros.proteinG}
              carbsG={mealPlan.macros.carbsG}
              fatG={mealPlan.macros.fatG}
            >
              <span className="text-display text-2xl text-[var(--color-text-primary)]">
                {mealPlan.calorieTarget}
              </span>
              <span className="text-mono-label text-[8px] text-[var(--color-text-tertiary)]">KCAL</span>
            </MacroDonutChart>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 bg-[var(--color-accent)]" />
                <span className="text-[var(--color-text-secondary)]">{t.meals.protein}</span>
                <span className="text-mono-label ml-auto text-[11px] text-[var(--color-text-primary)]">
                  {mealPlan.macros.proteinG}G
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 bg-[var(--color-accent-2)]" />
                <span className="text-[var(--color-text-secondary)]">{t.meals.carbs}</span>
                <span className="text-mono-label ml-auto text-[11px] text-[var(--color-text-primary)]">
                  {mealPlan.macros.carbsG}G
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 bg-[var(--color-neutral-3)]" />
                <span className="text-[var(--color-text-secondary)]">{t.meals.fat}</span>
                <span className="text-mono-label ml-auto text-[11px] text-[var(--color-text-primary)]">
                  {mealPlan.macros.fatG}G
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <UtensilsCrossed strokeWidth={1.8} className="h-5 w-5 text-[var(--color-accent)]" />
            {t.home.todaysMeals}
          </h2>
          <Link href="/meals" className="text-sm font-semibold text-[var(--color-accent)]">
            {t.home.viewMealPlan}
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {todayMeals && mealIdsFromDay(todayMeals).length > 0 ? (
            <>
              {MAIN_SLOTS.map((slot) => {
                const id = todayMeals[slot];
                const recipe = id ? recipeMap.get(id) : undefined;
                if (!recipe) return null;
                const displayCalories = Math.round(recipe.calories * portionFor(todayMeals, slot));
                return (
                  <MaybeLocked key={slot} locked={!!isEphemeral && slot !== "breakfast"}>
                    <div className="soft-pressed flex items-center justify-between gap-2 rounded-xl px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <BlobImage
                          src={recipe.image_url}
                          alt={recipe.name}
                          icon={Utensils}
                          variant={1}
                          className="h-10 w-10 shrink-0"
                          sizes="40px"
                        />
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">
                            {t.meals[slot]}
                          </span>
                          <span className="block truncate text-sm font-semibold">
                            {localizedField(recipe, "name", "name_ka", locale)}
                          </span>
                          <ImageAttribution
                            name={recipe.image_attribution_name}
                            url={recipe.image_attribution_url}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                          <Flame strokeWidth={1.8} className="h-3.5 w-3.5" />
                          {displayCalories}
                        </span>
                        {(!isEphemeral || slot === "breakfast") && (
                          <QuickMealLogToggle
                            date={todayDate}
                            slot={slot}
                            initialStatus={mealLogBySlot.get(slot) ?? null}
                          />
                        )}
                      </div>
                    </div>
                  </MaybeLocked>
                );
              })}
              {todayMeals.snacks.map((id) => {
                const recipe = recipeMap.get(id);
                if (!recipe) return null;
                return (
                  <MaybeLocked key={id} locked={!!isEphemeral}>
                    <div className="soft-pressed flex items-center justify-between rounded-xl px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <BlobImage
                          src={recipe.image_url}
                          alt={recipe.name}
                          icon={Utensils}
                          variant={2}
                          className="h-10 w-10 shrink-0"
                          sizes="40px"
                        />
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {localizedField(recipe, "name", "name_ka", locale)}
                          </span>
                          <ImageAttribution
                            name={recipe.image_attribution_name}
                            url={recipe.image_attribution_url}
                          />
                        </div>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                        <Flame strokeWidth={1.8} className="h-3.5 w-3.5" />
                        {recipe.calories} {t.meals.calories}
                      </span>
                    </div>
                  </MaybeLocked>
                );
              })}
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">{t.meals.emptyBody}</p>
          )}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <Dumbbell strokeWidth={1.8} className="h-5 w-5 text-[var(--color-accent-2)]" />
            {t.home.todaysWorkout}
          </h2>
          <Link href="/workouts" className="text-sm font-semibold text-[var(--color-accent)]">
            {t.home.viewWorkoutPlan}
          </Link>
        </div>
        {todayWorkout?.type === "workout" ? (
          <MaybeLocked locked={!!isEphemeral}>
            <div className="flex flex-col gap-3">
              <div className="text-mono-label flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--color-text-tertiary)]">
                <span>{format(t.home.featuredExercises, { count: todayWorkout.exercises.length })}</span>
                <span>{format(t.home.approxDuration, { minutes: profile?.time_available_minutes ?? 30 })}</span>
                <span>
                  {format(t.common.khinkaliBurned, {
                    count: caloriesToKhinkali(estimateWorkoutCalories(profile?.time_available_minutes ?? 30)),
                  })}
                </span>
              </div>
              {todayWorkout.exercises.map((ex) => {
                const exercise = exerciseMap.get(ex.exerciseId);
                if (!exercise) return null;
                return (
                  <div key={ex.exerciseId} className="soft-pressed flex items-center justify-between rounded-xl px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <BlobImage
                        src={exercise.image_url}
                        alt={exercise.name}
                        icon={Dumbbell}
                        variant={3}
                        className="h-10 w-10 shrink-0"
                        sizes="40px"
                      />
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {localizedField(exercise, "name", "name_ka", locale)}
                        </span>
                        <ImageAttribution
                          name={exercise.image_attribution_name}
                          url={exercise.image_attribution_url}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--color-text-tertiary)]">
                      {ex.sets} {t.workouts.sets} × {ex.reps}
                    </span>
                  </div>
                );
              })}
              {!isEphemeral && (
                <div className="mt-1">
                  <WorkoutCompleteButton
                    date={todayDate}
                    initialCompleted={!!todayProgressLog?.workout_completed}
                  />
                </div>
              )}
            </div>
          </MaybeLocked>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">{t.workouts.restDayBody}</p>
        )}
      </Card>

      <Link href="/progress">
        <Button variant="ghost" className="flex w-full items-center justify-center gap-2 !py-4">
          <Scale strokeWidth={1.8} className="h-4 w-4" />
          {t.home.logWeight}
        </Button>
      </Link>
    </div>
  );
}

function goalLabelKey(goal: string): "goalLose" | "goalGain" | "goalMaintain" | "goalMuscle" {
  if (goal === "lose_weight") return "goalLose";
  if (goal === "gain_weight") return "goalGain";
  if (goal === "build_muscle") return "goalMuscle";
  return "goalMaintain";
}

async function MaybeLocked({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  if (!locked) return <>{children}</>;
  return <PaywallLock>{children}</PaywallLock>;
}
