"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { FaqAccordion } from "@/components/FaqAccordion";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function FaqPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8">
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
        <h1 className="gradient-text-signature text-3xl font-extrabold tracking-tight">{t.faq.title}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{t.faq.subtitle}</p>
      </div>

      <FaqAccordion />
    </div>
  );
}
