import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { Desktop } from "@/components/os/Desktop";
import { WindowManager } from "@/components/os/WindowManager";
import { StartMenu } from "@/components/os/start-menu/StartMenu";
import { Taskbar } from "@/components/os/taskbar/Taskbar";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { useShellStore } from "@/lib/store/shellStore";
import { useDesktopStore } from "@/lib/store/desktopStore";

const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

const win = () => useWindowStore.getState();

/** Touch shell (DESKTOP-INTERFACE-SPEC §11): any width below 768px. */
describe("touch shell (< 768px)", () => {
  beforeEach(() => {
    window.innerWidth = 390;
    window.innerHeight = 844;
    downloadSpy.mockClear();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
    useDesktopStore.getState().resetLayout();
  });

  it("lays the icons out row-first with resume.pdf in the first row, without touching the saved layout", () => {
    const saved = useDesktopStore.getState().iconCells;
    renderWithIntl(<Desktop />);
    expect(document.querySelector("[data-desktop]")).toHaveAttribute("data-layout", "touch");
    const y = (id: string) =>
      (document.querySelector(`[data-desktop-icon="${id}"]`)!.parentElement as HTMLElement).style
        .transform;
    // About, resume.pdf and Contact share the top row (same translateY).
    const rowOf = (id: string) => /,\s*([\d.]+)px\)/.exec(y(id))?.[1];
    expect(rowOf("resume")).toBe(rowOf("about"));
    expect(rowOf("contact")).toBe(rowOf("about"));
    expect(useDesktopStore.getState().iconCells).toBe(saved);
  });

  it("a single tap opens an icon and the CV icon downloads", async () => {
    renderWithIntl(<Desktop />);
    await userEvent.click(screen.getByRole("option", { name: "Contact" }));
    expect(win().windows.contact).toBeDefined();
    await userEvent.click(screen.getByRole("option", { name: "resume.pdf" }));
    expect(downloadSpy).toHaveBeenCalledTimes(1);
  });

  it("does not drag icons", () => {
    renderWithIntl(<Desktop />);
    const icon = screen.getByRole("option", { name: "Skills" });
    const before = useDesktopStore.getState().iconCells.skills;
    fireEvent.pointerDown(icon, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(icon, { pointerId: 1, clientX: 200, clientY: 300 });
    fireEvent.pointerUp(icon, { pointerId: 1, clientX: 200, clientY: 300 });
    expect(useDesktopStore.getState().iconCells.skills).toEqual(before);
  });

  it("shows one full-screen window at a time, with Minimize + Close only", () => {
    renderWithIntl(<WindowManager />);
    act(() => {
      win().openWindow("about");
      win().openWindow("contact");
    });
    const about = document.querySelector<HTMLElement>('[data-window="about"]')!;
    const contact = document.querySelector<HTMLElement>('[data-window="contact"]')!;
    expect(contact).toHaveAttribute("data-presentation", "fullscreen");
    expect(contact.style.width).toBe("100%");
    expect(contact).not.toHaveAttribute("aria-hidden", "true");
    expect(about).toHaveAttribute("aria-hidden", "true");
    expect(about).toHaveAttribute("inert");

    const controls = within(contact);
    expect(controls.getByRole("button", { name: "Minimize" })).toBeInTheDocument();
    expect(controls.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(controls.queryByRole("button", { name: "Maximize" })).not.toBeInTheDocument();
    // No resize handles on touch.
    expect(contact.querySelector("[data-resize-handle]")).toBeNull();

    // Closing the visible window reveals the previous one.
    act(() => win().closeWindow("contact"));
    expect(about).not.toHaveAttribute("aria-hidden", "true");
  });

  it("Start menu: places and an inline All Programs list, CV two taps from the desktop", async () => {
    renderWithIntl(<StartMenu />);
    await userEvent.click(screen.getByRole("button", { name: "Start", hidden: true }));
    const menu = screen.getByRole("menu", { name: "Start menu" });
    // All Programs is an inline group (no cascading submenu on a phone).
    const all = within(menu).getByRole("group", { name: "All Programs" });
    expect(within(all).getAllByRole("menuitem").length).toBeGreaterThanOrEqual(8);

    await userEvent.click(within(menu).getByRole("menuitem", { name: "Résumé (CV)" }));
    expect(downloadSpy).toHaveBeenCalledTimes(1);
  });

  it("taskbar keeps Quick Launch and collapses the language toggle into one button", () => {
    renderWithIntl(<Taskbar />);
    expect(screen.getByRole("button", { name: "Download CV" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Language: English. Switch to Português" }),
    ).toHaveTextContent("EN");
  });
});
