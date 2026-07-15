"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Download, X } from "lucide-react";
import { LocaleToggle } from "@/components/os/menu-bar/LocaleToggle";
import { AboutSummary } from "@/components/apps/AboutApp";
import ExperienceApp from "@/components/apps/ExperienceApp";
import ProjectsApp from "@/components/apps/ProjectsApp";
import SkillsApp from "@/components/apps/SkillsApp";
import HowIWorkWithAiApp from "@/components/apps/HowIWorkWithAiApp";
import ContactApp from "@/components/apps/ContactApp";

/**
 * Below 768px the OS metaphor is intentionally dropped (see
 * DESKTOP-INTERFACE-SPEC.md): the same content renders as a clean linear
 * page reusing the app components and design tokens — no windows, no 3D.
 */
export function MobileFallback() {
  const t = useTranslations();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="min-h-dvh bg-base-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgb(0_217_255/0.08),transparent)]">
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-white/[0.08] bg-glass-chrome px-4 backdrop-blur-glass-strong">
        <p className="font-mono text-sm font-semibold">
          <span className="text-text-primary">Douglas</span>
          <span className="text-accent">OS</span>
        </p>
        <LocaleToggle />
      </header>

      {!bannerDismissed && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-base-2/60 px-4 py-2">
          <p className="text-xs text-text-muted">{t("mobile.banner")}</p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label={t("mobile.dismiss")}
            className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}

      <main className="mx-auto flex max-w-xl flex-col gap-12 px-5 pb-16 pt-10">
        {/* Hero */}
        <section className="flex flex-col items-start gap-4">
          <div
            className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 via-base-2 to-accent-purple/25 shadow-glow-subtle ring-1 ring-accent/30"
            aria-hidden
          >
            <span className="font-mono text-xl font-bold text-accent">DT</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              {t("apps.about.name")}
            </h1>
            <p className="mt-1 text-lg font-medium text-accent">
              {t("apps.about.headline")}
            </p>
            <p className="mt-1 font-mono text-xs text-text-muted">
              {t("apps.about.location")}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {t("mobile.heroTagline")}
          </p>
          <a
            href="/resume.pdf"
            download="Douglas-Tertuliano-CV.pdf"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base-0 shadow-glow-subtle transition hover:bg-accent-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-base-0"
          >
            <Download className="size-4" aria-hidden />
            {t("resume.download")}
          </a>
        </section>

        <Section title={t("mobile.nav.about")}>
          <div className="flex flex-col gap-5">
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
          <div className="flex flex-col gap-5">
            <ContactApp />
            <a
              href="/resume.pdf"
              download="Douglas-Tertuliano-CV.pdf"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base-0 shadow-glow-subtle transition hover:bg-accent-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-base-0"
            >
              <Download className="size-4" aria-hidden />
              {t("resume.download")}
            </a>
          </div>
        </Section>

        <footer className="border-t border-white/[0.06] pt-6 text-center font-mono text-xs text-text-muted">
          Douglas<span className="text-accent">OS</span> —{" "}
          {t("apps.about.headline")}
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
        <span className="size-1.5 rounded-full bg-accent shadow-glow-subtle" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}
