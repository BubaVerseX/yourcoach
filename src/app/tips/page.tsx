"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { TIPS } from "@/lib/content/tips";
import { Card } from "@/components/ui/Card";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function TipsPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]"
        >
          <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
          {t.common.back}
        </Link>
        <LanguageSwitch />
      </div>

      <div>
        <h1 className="gradient-text-signature text-3xl font-extrabold tracking-tight">{t.tips.title}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{t.tips.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TIPS.map((tip) => {
          const Icon = tip.icon;
          const content = t.tips.items[tip.id as keyof typeof t.tips.items];
          return (
            <Card key={tip.id} className="flex flex-col gap-3">
              <div className="soft-pressed flex h-11 w-11 items-center justify-center rounded-2xl">
                <Icon strokeWidth={1.8} className="h-5 w-5 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-base font-extrabold tracking-tight">{content.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{content.body}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
