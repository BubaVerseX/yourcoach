import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { currentWeekStart } from "@/lib/plan/generatePlan";
import { dateForDay } from "@/lib/plan/weekDate";
import { getOrCreateWeekPlans } from "@/lib/plan/getWeekPlans";
import { DAYS_OF_WEEK, type DayKey } from "@/lib/plan/mealPlan";
import { getExercisesByIds } from "@/lib/plan/lookups";
import { localizedField } from "@/lib/plan/localized";
import { dayLabel } from "@/lib/plan/dayLabel";
import { getFavoriteIds } from "@/lib/actions/favorites";
import { Card } from "@/components/ui/Card";
import { BlobImage } from "@/components/ui/BlobImage";
import { ImageAttribution } from "@/components/ui/ImageAttribution";
import { WorkoutCompleteButton } from "@/components/WorkoutCompleteButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ExerciseSwapPanel } from "@/components/ExerciseSwapPanel";
import { WorkoutDayFrictionControls } from "@/components/WorkoutDayFrictionControls";
import { ExerciseMuscleDiagram } from "@/components/ExerciseMuscleDiagram";
import { ExerciseAvatarAnimation } from "@/components/ExerciseAvatarAnimation";
import { ExerciseGifDemo } from "@/components/ExerciseGifDemo";
import type { MovementPattern } from "@/lib/avatar/animation";

export default async function WorkoutDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  if (!DAYS_OF_WEEK.includes(day as DayKey)) notFound();
  const dayKey = day as DayKey;

  const supabase = await createClient();
  const { t, locale } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = currentWeekStart();
  const { workoutPlan, isEphemeral } = await getOrCreateWeekPlans(user.id, weekStart);
  if (!workoutPlan) notFound();

  // The full workout plan is entirely locked pre-subscription — no sample
  // day, unlike meals. /workouts already shows the locked week list.
  if (isEphemeral) redirect("/workouts");

  const dayPlan = workoutPlan.planData.days[dayKey];
  const date = dateForDay(weekStart, dayKey);

  const { data: log } = await supabase
    .from("progress_logs")
    .select("workout_completed")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  const exerciseIds = dayPlan.type === "workout" ? dayPlan.exercises.map((e) => e.exerciseId) : [];
  const [exerciseMap, favoriteIds] = await Promise.all([
    getExercisesByIds(exerciseIds),
    getFavoriteIds(user.id, "exercise"),
  ]);

  return (
    <div className="flex flex-col gap-6 py-6">
      <Link
        href="/workouts"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]"
      >
        <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
        {t.workouts.title}
      </Link>

      <h1 className="gradient-text-signature text-3xl font-extrabold tracking-tight">{dayLabel(dayKey, t)}</h1>

      {dayPlan.type === "rest" ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="soft-pressed flex h-16 w-16 items-center justify-center rounded-2xl">
            <Dumbbell strokeWidth={1.8} className="h-7 w-7 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-lg font-extrabold">{t.workouts.restDay}</h3>
          <p className="max-w-xs text-sm text-[var(--color-text-secondary)]">
            {t.workouts.restDayBody}
          </p>
        </Card>
      ) : (
        <>
          <span className="text-sm font-bold text-[var(--color-accent-2)]">
            {t.workouts.muscleGroups[dayPlan.focus as keyof typeof t.workouts.muscleGroups] ??
              dayPlan.focus}
          </span>

          <div className="flex flex-col gap-4">
            {dayPlan.exercises.map((ex, i) => {
              const exercise = exerciseMap.get(ex.exerciseId);
              if (!exercise) return null;
              return (
                <Card key={ex.exerciseId} className="flex gap-4">
                  <div className="flex shrink-0 flex-col gap-1">
                    <BlobImage
                      src={exercise.image_url}
                      alt={exercise.name}
                      icon={Dumbbell}
                      variant={((i % 3) + 1) as 1 | 2 | 3}
                      className="h-20 w-20"
                      sizes="80px"
                    />
                    <ImageAttribution
                      name={exercise.image_attribution_name}
                      url={exercise.image_attribution_url}
                      className="w-20 text-center"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-extrabold tracking-tight">
                        {localizedField(exercise, "name", "name_ka", locale)}
                      </h3>
                      <FavoriteButton
                        itemType="exercise"
                        itemId={exercise.id}
                        initialFavorited={favoriteIds.has(exercise.id)}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-accent-2)]">
                      {ex.sets} {t.workouts.sets} × {ex.reps} {t.workouts.reps}
                    </span>
                    {exercise.instructions && (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {localizedField(exercise, "instructions", "instructions_ka", locale)}
                      </p>
                    )}
                    <ExerciseGifDemo exerciseGifUrl={exercise.exercise_gif_url} />
                    <ExerciseMuscleDiagram
                      primaryMuscles={exercise.primary_muscles}
                      secondaryMuscles={exercise.secondary_muscles}
                    />
                    <ExerciseAvatarAnimation
                      pattern={exercise.movement_pattern as MovementPattern}
                      primaryMuscles={exercise.primary_muscles}
                      secondaryMuscles={exercise.secondary_muscles}
                    />
                    <div className="mt-1">
                      <ExerciseSwapPanel weekStart={weekStart} day={dayKey} exerciseIndex={i} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <WorkoutCompleteButton date={date} initialCompleted={!!log?.workout_completed} />
          <WorkoutDayFrictionControls
            weekStart={weekStart}
            day={dayKey}
            restDays={DAYS_OF_WEEK.filter(
              (d) => d !== dayKey && workoutPlan.planData.days[d].type === "rest"
            )}
          />
        </>
      )}
    </div>
  );
}
