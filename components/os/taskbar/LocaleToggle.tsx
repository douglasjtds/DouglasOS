"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
] as const;

const STORAGE_KEY = "douglasos-locale";

/**
 * EN/PT switch for the tray (white text on blue chrome). Switches the locale
 * in place via the URL; open windows survive because their state is in the
 * persisted window store. On touch screens it collapses into one 44px button
 * that shows the current language and switches to the other one (two buttons
 * wouldn't leave room for the window buttons on a 360px phone).
 */
export function LocaleToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("taskbar");
  const mobile = useIsMobile();

  function switchTo(next: string) {
    if (next === locale) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode, etc.) — URL stays the source of truth.
    }
    router.replace(pathname, { locale: next });
  }

  if (mobile) {
    const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
    const next = LOCALES.find((l) => l.code !== current.code) ?? LOCALES[1];
    return (
      <button
        type="button"
        data-locale-switch
        onClick={() => switchTo(next.code)}
        aria-label={t("languageSwitch", { next: t(`languageNames.${next.code}`) })}
        className="flex size-touch-target items-center justify-center text-system font-bold text-text-inverse focus-inverse"
      >
        <span className="rounded-button bg-task-button-active px-1.5 py-0.5 shadow-task-button-active">
          {current.label}
        </span>
      </button>
    );
  }

  return (
    <div role="group" aria-label={t("language")} className="flex items-center gap-px">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => switchTo(l.code)}
          aria-pressed={locale === l.code}
          className={cn(
            "rounded-button px-1 text-system font-bold text-text-inverse focus-inverse",
            locale === l.code
              ? "bg-task-button-active shadow-task-button-active"
              : "hover:bg-task-button-hover",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
