"use client";

import { useLocale, useTranslations } from "next-intl";
import { BlueScreen, blueScreenActionClass } from "@/components/os/easter-egg/BlueScreen";
import { RESUME } from "@/lib/profile";
import { openHash } from "@/lib/apps/deepLink";
import { RealNotFoundDiscovery } from "@/components/os/easter-egg/RealNotFoundDiscovery";

/**
 * The site's real 404 page (stage 10): the same DouglasOS blue screen as
 * egg A, server-rendered with plain links because there's no shell here —
 * Download CV (`public/resume.pdf`), Talk to Douglas (the home page with
 * `#open=contact`, which opens the Contact window once the shell mounts) and
 * Back to desktop (the locale's home).
 */
export function NotFoundPage() {
  const t = useTranslations("easterEgg.blueScreen");
  const locale = useLocale();
  const home = `/${locale}`;

  return (
    <main data-not-found-page className="min-h-dvh bg-titlebar">
      <title>{t("pageTitle")}</title>
      <RealNotFoundDiscovery />
      <BlueScreen
        variant="page"
        actions={
          <>
            <a href={RESUME.href} download={RESUME.filename} data-not-found-action="cv" className={blueScreenActionClass}>
              {t("cv")}
            </a>
            <a href={`${home}${openHash("contact")}`} data-not-found-action="contact" className={blueScreenActionClass}>
              {t("contact")}
            </a>
            <a href={home} data-not-found-action="desktop" className={blueScreenActionClass}>
              {t("desktop")}
            </a>
          </>
        }
      />
    </main>
  );
}
