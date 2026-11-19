import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { MESSENGER_TOAST_KEY, MessengerToast } from "@/components/os/taskbar/MessengerToast";
import { MessengerTray } from "@/components/os/taskbar/MessengerTray";
import { initialMessengerData, useMessengerStore } from "@/lib/store/messengerStore";
import { useBalloonStore } from "@/lib/store/balloonStore";
import { useShellStore } from "@/lib/store/shellStore";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { MESSENGER_TIMING } from "@/lib/messenger/types";

const DELAY = MESSENGER_TIMING.toastDelay.desktop;

function toast() {
  return document.querySelector("[data-messenger-toast]");
}

describe("MessengerToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMessengerStore.setState(initialMessengerData());
    useBalloonStore.setState({ queue: [] });
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("appears once, after a delay, without taking focus", () => {
    renderWithIntl(<MessengerToast />);
    expect(toast()).toBeNull();
    act(() => vi.advanceTimersByTime(DELAY));
    expect(toast()).toHaveAttribute("aria-live", "polite");
    expect(toast()).toHaveTextContent("Douglas says:");
    expect(document.activeElement).toBe(document.body);
    expect(sessionStorage.getItem(MESSENGER_TOAST_KEY)).toBe("1");
    // It closes itself.
    act(() => vi.advanceTimersByTime(MESSENGER_TIMING.toastAutoHide));
    expect(toast()).toBeNull();
    expect(useBalloonStore.getState().queue).toEqual([]);
  });

  it("is skipped for the rest of the session once shown", () => {
    sessionStorage.setItem(MESSENGER_TOAST_KEY, "1");
    renderWithIntl(<MessengerToast />);
    act(() => vi.advanceTimersByTime(DELAY * 2));
    expect(toast()).toBeNull();
  });

  it("waits for the balloon slot (never on screen with the assistant bubble)", () => {
    useBalloonStore.getState().request("assistant");
    renderWithIntl(<MessengerToast />);
    act(() => vi.advanceTimersByTime(DELAY));
    expect(toast()).toBeNull();
    expect(useBalloonStore.getState().queue).toEqual(["assistant", "messenger"]);
    act(() => useBalloonStore.getState().release("assistant"));
    expect(toast()).not.toBeNull();
  });

  it("a click opens the conversation", () => {
    renderWithIntl(<MessengerToast />);
    act(() => vi.advanceTimersByTime(DELAY));
    fireEvent.click(document.querySelector("[data-messenger-toast-open]")!);
    expect(useWindowStore.getState().focusedId).toBe("messenger");
    expect(useMessengerStore.getState().view).toBe("conversation");
    expect(toast()).toBeNull();
  });

  it("never shows once the visitor opened the Messenger", () => {
    renderWithIntl(<MessengerToast />);
    act(() => useWindowStore.getState().openWindow("messenger"));
    act(() => vi.advanceTimersByTime(DELAY));
    expect(toast()).toBeNull();
  });

  it("doesn't show over the Start menu", () => {
    renderWithIntl(<MessengerToast />);
    act(() => useShellStore.getState().setStartMenuOpen(true));
    act(() => vi.advanceTimersByTime(DELAY));
    expect(toast()).toBeNull();
    act(() => useShellStore.getState().setStartMenuOpen(false));
    expect(toast()).not.toBeNull();
  });
});

describe("MessengerTray", () => {
  beforeEach(() => {
    useMessengerStore.setState(initialMessengerData());
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
  });

  it("opens (or focuses) the Messenger", () => {
    renderWithIntl(<MessengerTray />);
    fireEvent.click(screen.getByRole("button", { name: "Douglas is online. Open DouglasOS Messenger" }));
    expect(useWindowStore.getState().focusedId).toBe("messenger");
    expect(useMessengerStore.getState().view).toBe("contacts");
  });

  it("announces unread lines and jumps to the conversation", () => {
    useMessengerStore.setState({ unread: 2 });
    renderWithIntl(<MessengerTray />);
    fireEvent.click(screen.getByRole("button", { name: /2 new messages/ }));
    expect(useMessengerStore.getState().view).toBe("conversation");
  });
});
