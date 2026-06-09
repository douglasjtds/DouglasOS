"use client";

import { Logo } from "@/components/os/menu-bar/Logo";
import { ActiveAppName } from "@/components/os/menu-bar/ActiveAppName";
import { LocaleToggle } from "@/components/os/menu-bar/LocaleToggle";
import { Clock } from "@/components/os/menu-bar/Clock";

export function MenuBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-[5000] flex h-9 items-center gap-3 border-b border-white/[0.08] bg-glass-chrome px-4 backdrop-blur-glass-strong">
      <Logo />
      <ActiveAppName />
      <div className="flex-1" />
      <LocaleToggle />
      <Clock />
    </header>
  );
}
