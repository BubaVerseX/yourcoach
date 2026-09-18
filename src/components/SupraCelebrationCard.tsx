"use client";

import { useLocale } from "@/lib/i18n";

/** Supra mode — celebration framing for a social/feast meal, never a diet
 * infraction. Deliberately warm palette (#1a0f07 / amber), tonally
 * distinct from the standard dark logging surface. No calorie or
 * macro figure appears anywhere on this card. */
export function SupraCelebrationCard({
  logged,
  onConfirm,
}: {
  logged: boolean;
  onConfirm: () => void;
}) {
  const { t } = useLocale();
  const occasions = [t.meals.occasionFamily, t.meals.occasionBirthday, t.meals.occasionWedding];

  return (
    <div className="relative overflow-hidden bg-[var(--color-supra-surface)] p-5 text-white">
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 h-[26px] bg-[var(--color-bg)]"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 40%)" }}
      />
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rotate-[20deg] bg-[var(--color-supra-accent)] opacity-[0.14]"
        aria-hidden
      />

      <div className="relative flex flex-col gap-3 pt-3">
        <div className="flex items-center gap-2">
          <span className="h-[10px] w-[10px] rotate-45 bg-[var(--color-supra-accent)]" />
          <span className="text-mono-label text-[10px] tracking-[0.18em] text-[var(--color-supra-accent)]">
            SUPRA MODE
          </span>
        </div>

        <div>
          <h3 className="text-[34px] leading-[0.95] font-black tracking-[-0.03em] text-white">
            {t.meals.social}
          </h3>
          <p className="text-display mt-1 text-[21px] text-[var(--color-supra-accent)]">
            A TABLE, NOT A SETBACK
          </p>
        </div>

        <p className="text-sm leading-relaxed text-white/75">{t.meals.supraBody}</p>

        <div className="flex flex-wrap gap-2">
          {occasions.map((occasion) => (
            <span
              key={occasion}
              className="text-mono-label border border-[var(--color-supra-accent)]/60 px-2.5 py-1 text-[9px] text-[var(--color-supra-accent)]"
            >
              {occasion}
            </span>
          ))}
        </div>

        {logged ? (
          <p className="text-mono-label text-[10px] text-[var(--color-supra-accent)]">
            {t.meals.supraReassurance}
          </p>
        ) : (
          <button
            type="button"
            onClick={onConfirm}
            className="mt-1 w-full bg-[var(--color-supra-accent)] px-6 py-3 text-[15px] font-bold text-[var(--color-supra-surface)] transition-transform duration-150 active:translate-y-0.5"
          >
            {t.meals.supraCta}
          </button>
        )}
      </div>
    </div>
  );
}
