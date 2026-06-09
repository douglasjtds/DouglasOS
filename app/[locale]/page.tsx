import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-base-0">
      <p className="font-mono text-sm text-text-muted">{t("booting")}</p>
      {/* Temporary token + i18n smoke test — removed when the OS shell lands. */}
      <p className="text-accent">{t("accent")}</p>
      <Button className="shadow-glow-accent">{t("cta")}</Button>
    </main>
  );
}
