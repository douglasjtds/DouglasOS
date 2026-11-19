import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { Taskbar } from "@/components/os/taskbar/Taskbar";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { useShellStore } from "@/lib/store/shellStore";

const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));
// The locale toggle uses next-intl's router, which needs the Next runtime.
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

const win = () => useWindowStore.getState();

function taskButton(name: RegExp) {
  const list = screen.getByRole("list", { name: "Open windows" });
  return within(list).getByRole("button", { name });
}

describe("Taskbar", () => {
  beforeEach(() => {
    downloadSpy.mockClear();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
  });

  it("is a labelled landmark with Start, Quick Launch, window list and tray", () => {
    renderWithIntl(<Taskbar />);
    const nav = screen.getByRole("navigation", { name: "Taskbar" });
    expect(within(nav).getByRole("button", { name: "Start" })).toHaveAttribute(
      "aria-haspopup",
      "menu",
    );
    expect(within(nav).getByRole("group", { name: "Quick Launch" })).toBeInTheDocument();
    expect(within(nav).getByRole("group", { name: "Notification area" })).toBeInTheDocument();
  });

  it("shows one button per open window, the focused one pressed", () => {
    act(() => {
      win().openWindow("about");
      win().openWindow("projects");
    });
    renderWithIntl(<Taskbar />);
    expect(taskButton(/About Douglas/)).toHaveAttribute("aria-pressed", "false");
    expect(taskButton(/My Projects/)).toHaveAttribute("aria-pressed", "true");
  });

  it("click: focused → minimize, minimized → restore, background → focus", async () => {
    act(() => {
      win().openWindow("about");
      win().openWindow("projects");
    });
    renderWithIntl(<Taskbar />);

    await userEvent.click(taskButton(/My Projects/));
    expect(win().windows.projects.minimized).toBe(true);
    expect(taskButton(/My Projects/)).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(taskButton(/My Projects/));
    expect(win().windows.projects.minimized).toBe(false);
    expect(win().focusedId).toBe("projects");

    await userEvent.click(taskButton(/About Douglas/));
    expect(win().focusedId).toBe("about");
    expect(taskButton(/About Douglas/)).toHaveAttribute("aria-pressed", "true");
  });

  it("removes a window's button when it closes", () => {
    act(() => win().openWindow("about"));
    renderWithIntl(<Taskbar />);
    act(() => win().closeWindow("about"));
    expect(
      within(screen.getByRole("list", { name: "Open windows" })).queryAllByRole("button"),
    ).toHaveLength(0);
  });

  it("Quick Launch downloads the CV and opens Contact in one click each", async () => {
    renderWithIntl(<Taskbar />);
    const quick = screen.getByRole("group", { name: "Quick Launch" });
    await userEvent.click(within(quick).getByRole("button", { name: "Download CV" }));
    expect(downloadSpy).toHaveBeenCalledWith("/resume.pdf", "Douglas-Tertuliano-CV.pdf");
    await userEvent.click(within(quick).getByRole("button", { name: "Contact" }));
    expect(win().windows.contact).toBeDefined();
  });
});
