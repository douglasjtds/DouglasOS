"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { useShellStore } from "@/lib/store/shellStore";
import { DouglasOSLogo, UserAvatar } from "@/components/icons/SystemIcons";
import { Wordmark } from "@/components/os/session/Wordmark";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * Luna-style logon (DESKTOP-INTERFACE-SPEC §2): dark bands, blue body, brand on
 * the left, a single user tile on the right. Click / Enter / Esc logs on.
 * No password, no auto-advance. On touch screens the layout stacks (brand
 * above the tile, thinner bands) and the hint says "tap".
 */
export function LogonScreen() {
  const t = useTranslations("logon");
  const logOn = useShellStore((s) => s.logOn);
  const tileRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const mobile = useIsMobile();

  useEffect(() => {
    tileRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        logOn();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [logOn]);

  return (
    <main
      data-testid="logon-screen"
      aria-labelledby={headingId}
      className="fixed inset-0 z-2000 flex flex-col bg-logon-bg"
    >
      <div className="h-20 shrink-0 border-b-2 border-logon-divider bg-logon-band max-md:h-[calc(3rem+env(safe-area-inset-top,0px))]" />

      <div className="flex flex-1 items-center justify-center bg-logon-gradient px-8 max-md:px-4">
        <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-10 max-md:grid-cols-1 max-md:justify-items-center max-md:gap-8">
          <div className="flex flex-col items-end gap-2 text-right max-md:items-center max-md:text-center">
            <DouglasOSLogo size={72} />
            <Wordmark />
            <h1 id={headingId} className="text-logon italic text-text-inverse">
              {t("welcome")}
            </h1>
          </div>

          <div aria-hidden className="h-72 w-px bg-logon-divider-gradient max-md:hidden" />

          <div>
            <button
              ref={tileRef}
              type="button"
              data-logon-user
              aria-label={t("tileLabel")}
              onClick={logOn}
              className="flex items-center gap-4 rounded-balloon bg-logon-band p-3 pr-6 text-left shadow-balloon hover:bg-startmenu-header focus-inverse"
            >
              <span className="rounded-balloon border-2 border-hot">
                <UserAvatar size={64} priority />
              </span>
              <span className="flex flex-col">
                <span className="text-logon text-text-inverse">Douglas</span>
                <span className="text-body text-text-inverse">{t("subtitle")}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-20 shrink-0 items-center justify-between gap-6 border-t-2 border-logon-divider bg-logon-band px-8 max-md:h-auto max-md:flex-col max-md:items-start max-md:gap-1 max-md:px-4 max-md:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] max-md:pt-3">
        <p className="text-body text-text-inverse">{t("intro")}</p>
        <p className="text-body text-text-inverse">{t(mobile ? "hintTouch" : "hint")}</p>
      </div>
    </main>
  );
}
