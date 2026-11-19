import { beforeEach, describe, expect, it } from "vitest";
import { act, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { WelcomeBalloon } from "@/components/os/taskbar/WelcomeBalloon";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { useShellStore } from "@/lib/store/shellStore";

describe("WelcomeBalloon", () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
  });

  it("shows once per session", () => {
    renderWithIntl(<WelcomeBalloon />);
    expect(screen.getByRole("status")).toHaveTextContent("Welcome to DouglasOS");
    expect(sessionStorage.getItem("douglasos-welcomed")).toBe("1");
  });

  it("gets out of the way when the Start menu opens", () => {
    renderWithIntl(<WelcomeBalloon />);
    act(() => useShellStore.getState().setStartMenuOpen(true));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("gets out of the way when a window opens", () => {
    renderWithIntl(<WelcomeBalloon />);
    act(() => useWindowStore.getState().openWindow("about"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
