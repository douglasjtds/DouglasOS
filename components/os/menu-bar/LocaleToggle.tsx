"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
] as const;

const STORAGE_KEY = "douglasos-locale";

export function LocaleToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

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
    <div className="flex items-center rounded-full border border-white/10 bg-base-2/60 p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => switchTo(l.code)}
          aria-pressed={locale === l.code}
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            locale === l.code
              ? "bg-accent text-base-0"
              : "text-text-muted hover:text-text-primary",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
