import { create } from "zustand";
import type { DesktopIconId } from "@/lib/apps/registry";

/**
 * Where the visitor is in the session lifecycle (DESKTOP-INTERFACE-SPEC §1–2,
 * §9): boot → logon → desktop, with Log Off (→ logon) and Turn Off
 * (→ shutdown → boot/desktop) as reversible detours.
 */
export type SessionPhase = "boot" | "logon" | "desktop" | "shutdown";

/** sessionStorage flag: boot + logon already seen in this browser session. */
export const BOOTED_KEY = "douglasos-booted";

/** Modal dialogs owned by the shell (one at a time). */
export type ShellDialog =
  | { kind: "turnOff" }
  | { kind: "protectedFile"; iconId: DesktopIconId | "recycle-bin" };

function sessionStore(): Pick<Storage, "getItem" | "setItem"> | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Storage can throw in locked-down/private contexts — treat as absent.
    return null;
  }
}

/** First phase for this page load: returning visitors skip boot + logon. */
export function initialPhase(
  storage: Pick<Storage, "getItem"> | null,
): SessionPhase {
  try {
    return storage?.getItem(BOOTED_KEY) === "1" ? "desktop" : "boot";
  } catch {
    return "boot";
  }
}

function markBooted() {
  try {
    sessionStore()?.setItem(BOOTED_KEY, "1");
  } catch {
    // Non-fatal: boot/logon may simply replay on the next load.
  }
}

interface ShellState {
  phase: SessionPhase;
  startMenuOpen: boolean;
  dialog: ShellDialog | null;

  /** Boot finished on its own → show the logon screen. */
  finishBoot: () => void;
  /** Logon tile activated → desktop. */
  logOn: () => void;
  /** Skip (boot or logon) → straight to the desktop. */
  skipToDesktop: () => void;
  /** Start → Log Off: back to logon, nothing is lost. */
  logOff: () => void;
  /** Turn Off confirmed: shows the shutdown screen. */
  shutDown: () => void;
  /** "Turn on" from the shutdown screen: replay boot (or go straight in). */
  turnOn: (opts?: { instant?: boolean }) => void;

  setStartMenuOpen: (open: boolean) => void;
  toggleStartMenu: () => void;
  openDialog: (dialog: ShellDialog) => void;
  closeDialog: () => void;
}

export const useShellStore = create<ShellState>()((set) => ({
  phase: initialPhase(sessionStore()),
  startMenuOpen: false,
  dialog: null,

  finishBoot: () => set((s) => (s.phase === "boot" ? { phase: "logon" } : s)),
  logOn: () => {
    markBooted();
    set({ phase: "desktop" });
  },
  skipToDesktop: () => {
    markBooted();
    set({ phase: "desktop" });
  },
  logOff: () => set({ phase: "logon", startMenuOpen: false, dialog: null }),
  shutDown: () => set({ phase: "shutdown", startMenuOpen: false, dialog: null }),
  turnOn: (opts) => set({ phase: opts?.instant ? "desktop" : "boot" }),

  setStartMenuOpen: (open) => set({ startMenuOpen: open }),
  toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),
  openDialog: (dialog) => set({ dialog, startMenuOpen: false }),
  closeDialog: () => set({ dialog: null }),
}));
