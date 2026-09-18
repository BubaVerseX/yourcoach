import Link from "next/link";
import { Dumbbell, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { format } from "@/lib/i18n/format";
import { currentWeekStart, dayKeyForDate } from "@/lib/plan/generatePlan";
import { getOrCreateWeekPlans } from "@/lib/plan/getWeekPlans";
import { DAYS_OF_WEEK } from "@/lib/plan/mealPlan";
import { dayLabel } from "@/lib/plan/dayLabel";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaywallLock } from "@/components/PaywallLock";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const { t } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = currentWeekStart();
  const todayKey = dayKeyForDate();
  const { workoutPlan, isEphemeral } = await getOrCreateWeekPlans(user.id, weekStart);

  if (!workoutPlan) {
    return (
      <div className="flex flex-col gap-6 py-10">
        <EmptyState icon={Dumbbell} title={t.workouts.emptyTitle} description={t.workouts.emptyBody} />
        <Link href="/workouts/templates">
          <Card className="flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px]">
            <LayoutGrid strokeWidth={1.8} className="h-4 w-4 text-[var(--color-accent)]" />
            <span className="text-sm font-bold">{t.workouts.browseTemplates}</span>
          </Card>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <h1 className="gradient-text-signature text-3xl font-extrabold tracking-tight">{t.workouts.title}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {format(t.workouts.weekOf, { date: weekStart })} ·{" "}
          {workoutPlan.setting === "home"
            ? t.workouts.settingHome
            : workoutPlan.setting === "gym"
              ? t.workouts.settingGym
              : `${t.workouts.settingHome} / ${t.workouts.settingGym}`}
        </p>
      </div>

      {isEphemeral ? (
        <PaywallLock>
          <Card className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold">
              <LayoutGrid strokeWidth={1.8} className="h-4 w-4 text-[var(--color-accent)]" />
              {t.workouts.browseTemplates}
            </span>
          </Card>
        </PaywallLock>
      ) : (
        <Link href="/workouts/templates">
          <Card className="flex items-center justify-between transition-all hover:translate-y-[-1px]">
            <span className="flex items-center gap-2 text-sm font-bold">
              <LayoutGrid strokeWidth={1.8} className="h-4 w-4 text-[var(--color-accent)]" />
              {t.workouts.browseTemplates}
            </span>
          </Card>
        </Link>
      )}

      <div className="flex flex-col gap-3">
        {DAYS_OF_WEEK.map((day) => {
          const dayPlan = workoutPlan.planData.days[day];
          const card = (
            <Card className="flex items-center justify-between transition-all hover:translate-y-[-1px]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    {dayLabel(day, t)}
                  </span>
                  {day === todayKey && (
                    <span className="soft-raised rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase text-[var(--color-accent)]">
                      {t.common.today}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {dayPlan.type === "rest"
                    ? t.workouts.restDay
                    : t.workouts.muscleGroups[
                        dayPlan.focus as keyof typeof t.workouts.muscleGroups
                      ] ?? dayPlan.focus}
                </div>
              </div>
              {dayPlan.type === "workout" && (
                <div className="flex items-center gap-1 text-sm font-bold text-[var(--color-accent-2)]">
                  <Dumbbell strokeWidth={1.8} className="h-4 w-4" />
                  {dayPlan.exercises.length}
                </div>
              )}
            </Card>
          );

          if (isEphemeral) {
            return <PaywallLock key={day}>{card}</PaywallLock>;
          }
          return (
            <Link key={day} href={`/workouts/${day}`} className="block">
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
