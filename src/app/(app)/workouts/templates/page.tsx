import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { isSubscriptionActive } from "@/lib/premium/access";
import { getTemplateImages } from "@/lib/images/ensureTemplateImages";
import { TemplateGallery } from "@/components/TemplateGallery";

export default async function WorkoutTemplatesPage() {
  const supabase = await createClient();
  const { t } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, templateImages] = await Promise.all([
    supabase.from("profiles").select("equipment_setting, subscription_status, subscription_expires_at").eq("id", user.id).single(),
    getTemplateImages(),
  ]);

  // Applying a template is a persistent mutation, gated by requireActivePremium
  // server-side — redirect before rendering rather than showing a page whose
  // only action always fails.
  if (!isSubscriptionActive(profile)) redirect("/workouts");

  return (
    <div className="flex flex-col gap-6 py-6">
      <Link
        href="/workouts"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]"
      >
        <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
        {t.workouts.title}
      </Link>

      <div>
        <h1 className="gradient-text-signature text-3xl font-extrabold tracking-tight">{t.templates.title}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{t.templates.subtitle}</p>
      </div>

      <TemplateGallery
        userEquipment={profile?.equipment_setting ?? null}
        templateImages={Object.fromEntries(templateImages)}
      />
    </div>
  );
}
