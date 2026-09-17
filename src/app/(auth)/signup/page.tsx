"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

export default function SignupPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accepted) {
      setError(t.disclaimer.mustAccept);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    setCheckEmail(true);
    setLoading(false);
  }

  if (checkEmail) {
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-xl font-extrabold tracking-tight">{t.auth.signupTitle}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{t.auth.checkEmail}</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{t.auth.signupTitle}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="password">{t.auth.password}</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">{t.auth.passwordHint}</p>
        </div>

        <div className="soft-pressed flex gap-3 rounded-2xl p-4">
          <input
            id="disclaimer"
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
          />
          <label htmlFor="disclaimer" className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            <span className="mb-1 block font-bold text-[var(--color-text-primary)]">
              {t.disclaimer.title}
            </span>
            {t.disclaimer.body}
            <br />
            <span className="mt-2 block">{t.disclaimer.aiShortNote}</span>
            <Link href="/legal/disclaimer" className="font-semibold text-[var(--color-accent)]">
              {t.nav.disclaimer}
            </Link>
          </label>
        </div>

        {error && <p className="text-sm font-medium text-[var(--color-accent)]">{error}</p>}

        <Button type="submit" disabled={loading || !accepted} className="mt-2">
          {loading ? t.common.loading : t.auth.signupButton}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-secondary)]">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-[var(--color-accent)]">
          {t.auth.loginLink}
        </Link>
      </p>
    </Card>
  );
}
