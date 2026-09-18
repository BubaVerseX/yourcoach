import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LocaleProvider, type Locale } from "@/lib/i18n";
import { anton, notoSansGeorgian, jetbrainsMono } from "@/lib/fonts";
import { ParticleField } from "@/components/ui/ParticleField";

export const metadata: Metadata = {
  title: "YourCoach — Your body, your plan",
  description:
    "Personalized eating and workout plans built from your own data. Not medical advice — always consult a doctor.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("vellio-locale")?.value;
  const initialLocale: Locale | undefined =
    localeCookie === "en" || localeCookie === "ka" ? localeCookie : undefined;

  return (
    <html
      lang={initialLocale ?? "en"}
      className={`h-full antialiased ${anton.variable} ${notoSansGeorgian.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-full flex-col">
        <ParticleField />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
        </div>
      </body>
    </html>
  );
}
