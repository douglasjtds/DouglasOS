import { beforeEach, describe, expect, it } from "vitest";
import { BOOTED_KEY, initialPhase, useShellStore } from "@/lib/store/shellStore";

const store = () => useShellStore.getState();

describe("initialPhase", () => {
  it("boots on a fresh session and skips straight to the desktop when returning", () => {
    expect(initialPhase(null)).toBe("boot");
    expect(initialPhase({ getItem: () => null })).toBe("boot");
    expect(initialPhase({ getItem: (k) => (k === BOOTED_KEY ? "1" : null) })).toBe("desktop");
  });

  it("treats a throwing storage as a fresh session", () => {
    expect(
      initialPhase({
        getItem: () => {
          throw new Error("denied");
        },
      }),
    ).toBe("boot");
  });
});

describe("shellStore lifecycle", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useShellStore.setState({ phase: "boot", startMenuOpen: false, dialog: null });
  });

  it("boot → logon → desktop, marking the session as booted", () => {
    store().finishBoot();
    expect(store().phase).toBe("logon");
    store().logOn();
    expect(store().phase).toBe("desktop");
    expect(sessionStorage.getItem(BOOTED_KEY)).toBe("1");
  });

  it("skipToDesktop jumps over boot and logon", () => {
    store().skipToDesktop();
    expect(store().phase).toBe("desktop");
    expect(sessionStorage.getItem(BOOTED_KEY)).toBe("1");
  });

  it("finishBoot is ignored once past the boot screen", () => {
    store().skipToDesktop();
    store().finishBoot();
    expect(store().phase).toBe("desktop");
  });

  it("log off returns to logon and closes transient UI", () => {
    store().skipToDesktop();
    store().setStartMenuOpen(true);
    store().logOff();
    expect(store().phase).toBe("logon");
    expect(store().startMenuOpen).toBe(false);
  });

  it("turn off → shutdown → turn on replays boot, or goes straight in when instant", () => {
    store().skipToDesktop();
    store().openDialog({ kind: "turnOff" });
    store().shutDown();
    expect(store().phase).toBe("shutdown");
    expect(store().dialog).toBeNull();
    store().turnOn();
    expect(store().phase).toBe("boot");
    store().shutDown();
    store().turnOn({ instant: true });
    expect(store().phase).toBe("desktop");
  });

  it("opening a dialog closes the Start menu", () => {
    store().setStartMenuOpen(true);
    store().openDialog({ kind: "protectedFile", iconId: "resume" });
    expect(store().startMenuOpen).toBe(false);
    expect(store().dialog).toEqual({ kind: "protectedFile", iconId: "resume" });
  });
});
