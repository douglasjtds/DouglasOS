"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useShellStore } from "@/lib/store/shellStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DouglasOSLogo } from "@/components/icons/SystemIcons";
import { Button } from "@/components/ui/button";

/** How long "shutting down…" shows before the goodbye (skipped when reduced). */
export const SHUTDOWN_MS = 1200;

/**
 * Turn Off (DESKTOP-INTERFACE-SPEC §5/§9): a short original "shutting down"
 * screen, then "See you soon" with a Turn on button — reversible in one click.
 */
export function ShutdownScreen() {
  const t = useTranslations("shutdown");
  const reduced = useReducedMotion();
  const turnOn = useShellStore((s) => s.turnOn);
  const [done, setDone] = useState(reduced);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (done) {
      buttonRef.current?.focus();
      return;
    }
    const timer = setTimeout(() => setDone(true), SHUTDOWN_MS);
    return () => clearTimeout(timer);
  }, [done]);

  return (
    <div
      data-testid="shutdown-screen"
      className="fixed inset-0 z-2000 flex flex-col items-center justify-center gap-6 bg-logon-band"
    >
      <DouglasOSLogo size={64} />
      <p role="status" className="text-logon text-text-inverse">
        {done ? t("goodbye") : t("shuttingDown")}
      </p>
      {done && (
        <Button
          ref={buttonRef}
          variant="primary"
          data-turn-on
          onClick={() => turnOn({ instant: reduced })}
        >
          {t("turnOn")}
        </Button>
      )}
    </div>
  );
}
