import Link from "next/link";
import { ShieldAlert, Lightbulb, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { Card } from "@/components/ui/Card";
import { RemindersSettings } from "@/components/RemindersSettings";
import { SignOutButton } from "@/components/SignOutButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { t } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: reminders } = await supabase.from("reminders").select("*").eq("user_id", user.id);

  return (
    <div className="flex flex-col gap-6 py-6">
      <h1 className="gradient-text-signature text-3xl font-extrabold tracking-tight">{t.settings.title}</h1>

      <RemindersSettings reminders={reminders ?? []} />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold tracking-tight">{t.settings.legal}</h2>
        <Link href="/tips">
          <Card className="flex items-center gap-3">
            <Lightbulb strokeWidth={1.8} className="h-5 w-5 text-[var(--color-text-secondary)]" />
            <span className="text-sm font-semibold">{t.nav.tips}</span>
          </Card>
        </Link>
        <Link href="/faq">
          <Card className="flex items-center gap-3">
            <HelpCircle strokeWidth={1.8} className="h-5 w-5 text-[var(--color-text-secondary)]" />
            <span className="text-sm font-semibold">{t.nav.faq}</span>
          </Card>
        </Link>
        <Link href="/legal/disclaimer">
          <Card className="flex items-center gap-3">
            <ShieldAlert strokeWidth={1.8} className="h-5 w-5 text-[var(--color-text-secondary)]" />
            <span className="text-sm font-semibold">{t.nav.disclaimer}</span>
          </Card>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold tracking-tight">{t.settings.account}</h2>
        <SignOutButton />
      </div>
    </div>
  );
}
