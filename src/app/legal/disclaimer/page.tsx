"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";

export default function DisclaimerPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8">
      <Link
        href="/"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]"
      >
        <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
        {t.common.back}
      </Link>
      <Card>
        <h1 className="gradient-text-signature mb-4 text-2xl font-extrabold tracking-tight">{t.disclaimer.title}</h1>
        <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          {t.disclaimer.body}
        </p>
      </Card>
      <Card>
        <h2 className="mb-4 text-2xl font-extrabold tracking-tight">{t.disclaimer.aiTitle}</h2>
        <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          {t.disclaimer.aiBody}
        </p>
      </Card>
    </div>
  );
}
