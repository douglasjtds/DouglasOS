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
  const parts = new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale !== "pt",
  }).formatToParts(now);
  const time = parts.map((p) => p.value).join("");
  // Phones hide the AM/PM marker (and the space before it) so the tray fits
  // its media + Messenger + language buttons on a 390px screen; the
  // accessible label and tooltip keep the full time and date.
  const periodAt = parts.findIndex((p) => p.type === "dayPeriod");
  const clock =
    periodAt === -1 ? (
      time
    ) : (
      <>
        {parts
          .slice(0, periodAt - 1)
          .map((p) => p.value)
          .join("")}
        <span className="max-md:hidden">
          {parts
            .slice(periodAt - 1)
            .map((p) => p.value)
            .join("")}
        </span>
      </>
    );
  const date = now.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
    dateStyle: "full",
  });

  return (
    <Tooltip content={date}>
      <time
        dateTime={now.toISOString()}
        tabIndex={0}
        aria-label={`${time}, ${date}`}
        className="whitespace-nowrap px-1 text-system text-text-inverse tabular-nums focus-inverse max-md:px-0"
      >
        {clock}
      </time>
    </Tooltip>
  );
}
