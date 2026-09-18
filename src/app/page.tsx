import Link from "next/link";
import { Utensils, Dumbbell, LineChart } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { ensureFeatureImages } from "@/lib/images/ensureFeatureImages";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DuotonePhoto } from "@/components/ui/DuotonePhoto";
import { EquipmentSilhouette } from "@/components/ui/EquipmentSilhouette";
import { ImageAttribution } from "@/components/ui/ImageAttribution";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default async function LandingPage() {
  const { t } = await getServerDictionary();
  const images = await ensureFeatureImages([
    { id: "hero_landing", query: "strength training athlete workout gym" },
  ]);
  const hero = images.get("hero_landing");

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="relative overflow-hidden">
        <EquipmentSilhouette
          shape="dumbbell"
          className="pointer-events-none absolute -left-16 top-[380px] h-[220px] w-[220px] opacity-90 md:top-[420px] md:h-[300px] md:w-[300px]"
        />
        <EquipmentSilhouette
          shape="kettlebell"
          rotate={18}
          className="pointer-events-none absolute -right-12 top-[520px] h-[170px] w-[170px] opacity-90 md:top-[560px] md:h-[240px] md:w-[240px]"
        />
        <EquipmentSilhouette
          shape="stopwatch"
          className="pointer-events-none absolute -bottom-12 left-1/4 h-[150px] w-[150px] opacity-80 md:h-[210px] md:w-[210px]"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <span className="text-display gradient-text-signature text-xl tracking-[0.04em]">
            {t.common.appName.toUpperCase()}
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <Link href="/login">
              <Button variant="ghost" className="!px-4 !py-2 text-sm">
                {t.landing.login}
              </Button>
            </Link>
          </div>
        </div>

        <div
          className="relative z-10 h-[46vh] min-h-[320px] w-full md:h-[54vh]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 46%, 0 66%)" }}
        >
          <DuotonePhoto src={hero?.url} alt="" className="h-full w-full" sizes="100vw" preload />
        </div>

        <div className="relative z-10 mx-auto -mt-6 w-full max-w-6xl px-5 pb-16 md:px-8">
          <h1 className="text-display gradient-text-signature -ml-1 text-[56px] md:-ml-2 md:text-[92px]">
            NO OFF SEASON
          </h1>
          <span className="mt-5 block h-[3px] w-16 bg-[var(--color-accent)]" />
          <h2 className="mt-5 max-w-lg text-[22px] leading-tight font-black tracking-[-0.03em] md:text-[27px]">
            {t.landing.heroHeadline}
          </h2>
          <p className="mt-3 max-w-md text-[13px] text-[var(--color-text-secondary)]">{t.landing.subhead}</p>
          <Link href="/get-started" className="mt-8 block max-w-md">
            <Button variant="primary" className="w-full py-4 text-base">
              {t.landing.cta}
            </Button>
          </Link>
          <ImageAttribution
            name={hero?.attributionName}
            url={hero?.attributionUrl}
            className="mt-3"
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 md:px-8">
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
          <Card className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center border border-[var(--color-border)]">
              <Utensils strokeWidth={1.8} className="h-6 w-6 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-lg font-bold">{t.landing.feature1Title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{t.landing.feature1Body}</p>
          </Card>
          <Card className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center border border-[var(--color-border)]">
              <Dumbbell strokeWidth={1.8} className="h-6 w-6 text-[var(--color-accent-2)]" />
            </div>
            <h3 className="text-lg font-bold">{t.landing.feature2Title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{t.landing.feature2Body}</p>
          </Card>
          <Card className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center border border-[var(--color-border)]">
              <LineChart strokeWidth={1.8} className="h-6 w-6 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-lg font-bold">{t.landing.feature3Title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{t.landing.feature3Body}</p>
          </Card>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 border-t border-[var(--color-border)] px-5 py-6 text-center text-xs text-[var(--color-text-tertiary)] sm:flex-row sm:justify-center sm:gap-5 md:px-8">
        <Link href="/tips" className="underline underline-offset-2">
          {t.nav.tips}
        </Link>
        <Link href="/faq" className="underline underline-offset-2">
          {t.nav.faq}
        </Link>
        <Link href="/legal/disclaimer" className="underline underline-offset-2">
          {t.nav.disclaimer}
        </Link>
      </footer>
    </div>
  );
}
