import Link from "next/link";
import { ArrowLeft, Sparkles, Save, ListChecks, LineChart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { format } from "@/lib/i18n/format";
import { isSubscriptionActive } from "@/lib/premium/access";
import { PREMIUM_ANNUAL_PRICE } from "@/lib/payments/ipay";
import { Card } from "@/components/ui/Card";
import { OrnamentalLinework } from "@/components/ui/OrnamentalLinework";
import { UpgradeButton } from "@/components/UpgradeButton";

export default async function UpgradePage() {
  const supabase = await createClient();
  const { t } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_expires_at")
    .eq("id", user.id)
    .single();
  const active = isSubscriptionActive(profile);

  const benefits = [
    { icon: Sparkles, text: t.premium.benefitAiPlan },
    { icon: Save, text: t.premium.benefitSaved },
    { icon: ListChecks, text: t.premium.benefitTracking },
    { icon: LineChart, text: t.premium.benefitProjection },
  ];

  return (
    <div className="flex flex-col gap-6 py-6">
      <Link
        href="/profile"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]"
      >
        <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
        {t.profile.title}
      </Link>

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="card-info-icon h-16 w-16 rounded-2xl">
          <Sparkles strokeWidth={1.8} className="h-7 w-7" />
        </div>
        <h1 className="gradient-text-signature text-3xl font-extrabold tracking-tight">{t.premium.title}</h1>
        <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">{t.premium.subtitle}</p>
      </div>

      <Card className="flex flex-col gap-4">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {t.premium.whatYouGet}
        </span>
        <div className="flex flex-col gap-3">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="card-info-icon h-9 w-9 shrink-0 rounded-xl">
                <Icon strokeWidth={1.8} className="h-4 w-4" />
              </div>
              <span className="text-sm text-[var(--color-text-secondary)]">{text}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="relative flex flex-col items-center gap-4 overflow-hidden text-center">
        <OrnamentalLinework className="text-[var(--color-accent)] opacity-[0.05]" />
        <span className="text-mono-label relative text-[10px] text-[var(--color-text-tertiary)]">
          {t.premium.title}
        </span>
        <span className="relative text-3xl font-extrabold tracking-tight text-[var(--color-accent)]">
          {format(t.premium.priceLabel, {
            amount: PREMIUM_ANNUAL_PRICE.amount,
            currency: PREMIUM_ANNUAL_PRICE.currency,
          })}
        </span>
        <div className="relative">
          {active ? (
            <p className="text-sm font-semibold text-[var(--color-accent)]">{t.premium.alreadyActive}</p>
          ) : (
            <UpgradeButton />
          )}
        </div>
      </Card>
    </div>
  );
}
