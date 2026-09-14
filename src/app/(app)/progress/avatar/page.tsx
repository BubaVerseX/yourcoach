import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { GoalAvatarPanel } from "@/components/avatar/GoalAvatarPanel";
import { isAvatarParams, type AvatarParams } from "@/lib/avatar/types";

export default async function GoalAvatarPage() {
  const supabase = await createClient();
  const { t } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_current, avatar_goal")
    .eq("id", user.id)
    .single();

  const initialCurrent: AvatarParams | null = isAvatarParams(profile?.avatar_current)
    ? profile.avatar_current
    : null;
  const initialGoal: AvatarParams | null = isAvatarParams(profile?.avatar_goal)
    ? profile.avatar_goal
    : null;

  return (
    <div className="flex flex-col gap-6 py-6">
      <Link
        href="/progress"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]"
      >
        <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
        {t.progress.title}
      </Link>

      <GoalAvatarPanel initialCurrent={initialCurrent} initialGoal={initialGoal} />
    </div>
  );
}
