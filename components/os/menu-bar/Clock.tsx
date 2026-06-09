"use client";

import { useEffect, useState } from "react";
import { useMounted } from "@/hooks/useMounted";

export function Clock() {
  const mounted = useMounted();
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
    return (
      <span
        className="font-mono text-xs tabular-nums text-text-secondary"
        suppressHydrationWarning
      />
    );
  }

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <span className="font-mono text-xs tabular-nums text-text-secondary">
      {time}
    </span>
  );
}
