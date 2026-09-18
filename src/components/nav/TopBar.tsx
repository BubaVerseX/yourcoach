"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Settings, ShieldAlert, LogOut, ChevronDown, Lightbulb, HelpCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { DesktopNav } from "./DesktopNav";

export function TopBar({ fullName }: { fullName?: string | null }) {
  const { t } = useLocale();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-5 md:px-8">
      <Link href="/home" className="text-display gradient-text-signature text-xl tracking-[0.04em]">
        {t.common.appName.toUpperCase()}
      </Link>

      <div className="hidden flex-1 justify-center md:flex">
        <DesktopNav />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t.nav.notifications}
          className="flex h-11 w-11 items-center justify-center border border-[var(--color-border-strong)] transition-colors duration-150 hover:border-white"
        >
          <Bell strokeWidth={1.8} className="h-5 w-5 text-[var(--color-text-secondary)]" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 border border-[var(--color-border-strong)] p-1.5 pr-2.5 transition-colors duration-150 hover:border-white"
          >
            <Avatar name={fullName} size={32} />
            <ChevronDown strokeWidth={1.8} className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-56 border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-1">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-white/[0.05]"
                >
                  <Avatar name={fullName} size={20} />
                  {t.nav.profile}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-white/[0.05]"
                >
                  <Settings strokeWidth={1.8} className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  {t.nav.settings}
                </Link>
                <Link
                  href="/tips"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-white/[0.05]"
                >
                  <Lightbulb strokeWidth={1.8} className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  {t.nav.tips}
                </Link>
                <Link
                  href="/faq"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-white/[0.05]"
                >
                  <HelpCircle strokeWidth={1.8} className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  {t.nav.faq}
                </Link>
                <Link
                  href="/legal/disclaimer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-white/[0.05]"
                >
                  <ShieldAlert strokeWidth={1.8} className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  {t.nav.disclaimer}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[var(--color-accent)] hover:bg-white/[0.05]"
                >
                  <LogOut strokeWidth={1.8} className="h-4 w-4" />
                  {t.nav.signOut}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
