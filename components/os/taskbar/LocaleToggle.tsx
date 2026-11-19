"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
] as const;

const STORAGE_KEY = "douglasos-locale";

/**
 * EN/PT switch for the tray (white text on blue chrome). Switches the locale
 * in place via the URL; open windows survive because their state is in the
 * persisted window store.
 */
export function LocaleToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("taskbar");

  function switchTo(next: string) {
    if (next === locale) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode, etc.) — URL stays the source of truth.
    }
    router.replace(pathname, { locale: next });
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
