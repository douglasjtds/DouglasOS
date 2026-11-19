"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useMounted } from "@/hooks/useMounted";
import { Tooltip } from "@/components/ui/tooltip";

/** Tray clock (HH:mm), with the full localized date as tooltip and label. */
export function Clock() {
  const mounted = useMounted();
  const locale = useLocale();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    // Align the first tick to the next minute boundary, then tick every minute.
    const timeout = setTimeout(
      () => {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  // Render an empty slot on the server / first paint to avoid time mismatch.
  if (!mounted) {
    return <span className="min-w-10 text-system" suppressHydrationWarning />;
  }

  // PT uses the 24h clock convention; EN keeps 12h with AM/PM.
  const time = now.toLocaleTimeString(locale === "pt" ? "pt-BR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale !== "pt",
  });
  const date = now.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
    dateStyle: "full",
  });

  return (
    <Tooltip content={date}>
      <time
        dateTime={now.toISOString()}
        tabIndex={0}
        aria-label={`${time}, ${date}`}
        className="whitespace-nowrap px-1 text-system text-text-inverse tabular-nums focus-inverse"
      >
        {time}
      </time>
    </Tooltip>
  );
}
