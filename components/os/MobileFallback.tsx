"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { LocaleToggle } from "@/components/os/taskbar/LocaleToggle";
import { DouglasOSLogo, UserAvatar } from "@/components/icons/SystemIcons";
import { AboutSummary } from "@/components/apps/AboutApp";
import ExperienceApp from "@/components/apps/ExperienceApp";
import ProjectsApp from "@/components/apps/ProjectsApp";
import SkillsApp from "@/components/apps/SkillsApp";
import HowIWorkWithAiApp from "@/components/apps/HowIWorkWithAiApp";
import ContactApp from "@/components/apps/ContactApp";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Below 768px the linear page stays until stage 2 replaces it with the
 * touchable XP desktop (DESKTOP-INTERFACE-SPEC §11). Restyled with the Luna
 * tokens so it matches the new identity in the meantime: same content, no
 * windows, no 3D.
 */
export function MobileFallback() {
  const t = useTranslations();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const downloadCv = (
    <a
      href="/resume.pdf"
      download="Douglas-Tertuliano-CV.pdf"
      className={cn(buttonVariants({ variant: "primary" }), "min-h-touch-target gap-2")}
    >
      <Download className="size-4" aria-hidden />
      {t("resume.download")}
    </a>
  );

  return (
    <div className="min-h-dvh bg-button-face">
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between bg-taskbar-gradient px-3">
        <p className="flex items-center gap-2 font-title text-start text-text-inverse">
          <DouglasOSLogo size={24} />
          <span>
            Douglas<span className="text-hot">OS</span>
          </span>
        </p>
        <div className="rounded-button bg-tray-gradient px-2 py-1">
          <LocaleToggle />
        </div>
      </header>

      {!bannerDismissed && (
        <div className="flex items-center justify-between gap-3 border-b border-info-border bg-info px-3 py-2">
          <p className="text-system text-text">{t("mobile.banner")}</p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label={t("mobile.dismiss")}
            className="flex size-touch-target shrink-0 items-center justify-center text-text focus-light"
          >
            <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden>
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      )}

      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-12 pt-6">
        <section className="flex flex-col items-start gap-3 border border-field-border bg-surface p-4">
          <UserAvatar size={64} />
          <div>
            <h1 className="text-heading-lg text-text">{t("apps.about.name")}</h1>
            <p className="text-heading text-text">{t("apps.about.headline")}</p>
            <p className="text-system text-text-muted">{t("apps.about.location")}</p>
          </div>
          <p className="text-body text-text">{t("mobile.heroTagline")}</p>
          {downloadCv}
        </section>

        <Section title={t("mobile.nav.about")}>
          <div className="flex flex-col gap-4">
            <AboutSummary />
          </div>
        </Section>

        <Section title={t("mobile.nav.experience")}>
          <ExperienceApp />
        </Section>

        <Section title={t("mobile.nav.projects")}>
          <ProjectsApp />
        </Section>

        <Section title={t("mobile.nav.skills")}>
          <SkillsApp />
        </Section>

        <Section title={t("mobile.nav.ai")}>
          <HowIWorkWithAiApp />
        </Section>

        <Section title={t("mobile.nav.contact")}>
          <div className="flex flex-col gap-4">
            <ContactApp />
            {downloadCv}
          </div>
        </Section>

        <footer className="pt-2 text-center text-system text-text-muted">
          DouglasOS — {t("apps.about.headline")}
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col border border-window-frame bg-window-frame">
      <h2 className="bg-titlebar-gradient px-2 py-1 font-title text-title text-titlebar-text">
        {title}
      </h2>
      <div className="bg-surface p-4">{children}</div>
    </section>
  );
}
