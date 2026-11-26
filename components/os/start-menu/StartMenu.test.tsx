import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { StartMenu } from "@/components/os/start-menu/StartMenu";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { useShellStore } from "@/lib/store/shellStore";
import { PROJECTS } from "@/lib/content/projects";

const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));
const openLinkSpy = vi.fn();
vi.mock("@/lib/openLink", () => ({
  openLink: (...args: unknown[]) => openLinkSpy(...args),
}));

// While the (modal) menu is open Radix hides the rest of the page from the
// accessibility tree, so the trigger is queried with `hidden: true`.
const startButton = () => screen.getByRole("button", { name: "Start", hidden: true });

describe("StartMenu", () => {
  beforeEach(() => {
    downloadSpy.mockClear();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
  });

  it("opens from the Start button and closes on Esc, returning focus", async () => {
    renderWithIntl(<StartMenu />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await userEvent.click(startButton());
    const menu = screen.getByRole("menu", { name: "Start menu" });
    expect(within(menu).getByText("Douglas")).toBeInTheDocument();
    expect(startButton()).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(useShellStore.getState().startMenuOpen).toBe(false);
    expect(startButton()).toHaveFocus();
  });

  it("is driven by the shell store (keyboard shortcuts toggle it)", () => {
    renderWithIntl(<StartMenu />);
    act(() => useShellStore.getState().toggleStartMenu());
    expect(screen.getByRole("menu", { name: "Start menu" })).toBeInTheDocument();
    act(() => useShellStore.getState().toggleStartMenu());
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Résumé (CV) downloads the PDF and closes the menu", async () => {
    renderWithIntl(<StartMenu />);
    await userEvent.click(startButton());
    await userEvent.click(screen.getByRole("menuitem", { name: "Résumé (CV)" }));
    expect(downloadSpy).toHaveBeenCalledWith("/resume.pdf", "Douglas-Tertuliano-CV.pdf");
    expect(useWindowStore.getState().windows).toEqual({});
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Contact opens the Contact window", async () => {
    renderWithIntl(<StartMenu />);
    await userEvent.click(startButton());
    // Contact is both pinned (left) and a place (right); either opens it.
    const items = screen.getAllByRole("menuitem", { name: /^Contact/ });
    await userEvent.click(items[items.length - 1]);
    expect(useWindowStore.getState().windows.contact).toBeDefined();
    expect(useWindowStore.getState().focusedId).toBe("contact");
  });

  it("All Programs lists the external shortcuts after the apps and follows them", async () => {
    renderWithIntl(<StartMenu />);
    await userEvent.click(startButton());
    const trigger = screen.getByRole("menuitem", { name: /All Programs/ });
    trigger.focus();
    await userEvent.keyboard("{ArrowRight}");
    const programs = document.querySelectorAll("[data-all-programs] [data-program]");
    expect([...programs].map((p) => p.getAttribute("data-program")).slice(-4)).toEqual([
      "linkedin",
      "github",
      "whatsapp",
      "email",
    ]);
    await userEvent.click(screen.getByRole("menuitem", { name: "whatsapp.exe" }));
    expect(openLinkSpy).toHaveBeenCalledWith("https://wa.me/5531991848090?text=Hey%20Douglas!", true);
    expect(useWindowStore.getState().windows).toEqual({});
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("All Programs → Accessories ▸ Retro Cam opens the camera window", async () => {
    renderWithIntl(<StartMenu />);
    await userEvent.click(startButton());
    screen.getByRole("menuitem", { name: /All Programs/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    // Retro Cam isn't in the flat list, only inside its folder.
    expect(document.querySelector('[data-all-programs] [data-program="camera"]')).toBeNull();
    const folder = document.querySelector<HTMLElement>('[data-program-folder="accessories"]')!;
    expect(folder).toHaveAttribute("aria-haspopup", "menu");
    folder.focus();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.click(screen.getByRole("menuitem", { name: "Retro Cam" }));
    expect(useWindowStore.getState().focusedId).toBe("camera");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("All Programs ▸ Accessories ▸ DouglasOS Paint opens Paint (not listed at the top level)", async () => {
    renderWithIntl(<StartMenu />);
    await userEvent.click(startButton());
    screen.getByRole("menuitem", { name: /All Programs/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.querySelector('[data-all-programs] [data-program="paint"]')).toBeNull();
    const folder = document.querySelector<HTMLElement>('[data-program-folder="accessories"]')!;
    expect(folder).toHaveAttribute("aria-haspopup", "menu");
    // Folders come first, like the classic layout.
    expect(document.querySelector("[data-all-programs] [role='menuitem']")).toBe(folder);
    folder.focus();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.click(screen.getByRole("menuitem", { name: "DouglasOS Paint" }));
    expect(useWindowStore.getState().focusedId).toBe("paint");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("My Projects ▸ lists the case studies and opens the Explorer at one", async () => {
    renderWithIntl(<StartMenu />);
    await userEvent.click(startButton());
    const trigger = document.querySelector<HTMLElement>('[data-start-item="my-projects"]')!;
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    trigger.focus();
    await userEvent.keyboard("{ArrowRight}");
    const entries = [...document.querySelectorAll("[data-projects-submenu] [data-project-entry]")];
    expect(entries.map((e) => e.getAttribute("data-project-entry"))).toEqual(["home", ...PROJECTS.map((p) => p.slug)]);
    await userEvent.click(screen.getByRole("menuitem", { name: "The Wedding Post" }));
    const { windows, focusedId } = useWindowStore.getState();
    expect(focusedId).toBe("projects");
    expect(windows.projects.history).toEqual({ entries: ["the-wedding-post"], index: 0 });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("lists pinned programs and the places column", async () => {
    renderWithIntl(<StartMenu />);
    await userEvent.click(startButton());
    for (const name of [/About Douglas/, /How I Work With AI/, "Display Properties", "Help", "Log Off", "Turn Off"]) {
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("menuitem", { name: /All Programs/ })).toHaveAttribute(
      "aria-haspopup",
      "menu",
    );
  });

  it("keyboard: arrows move through items, → crosses to the places column", async () => {
    renderWithIntl(<StartMenu />);
    startButton().focus();
    await userEvent.keyboard("{Enter}");
    const menu = screen.getByRole("menu", { name: "Start menu" });
    // Opening from the keyboard lands on the first item.
    expect(screen.getByRole("menuitem", { name: /About Douglas/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    // Pinned "My Projects" (with its description) — the places one has no description.
    expect(
      screen.getByRole("menuitem", { name: /^My Projects.*built/ }),
    ).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    const places = menu.querySelector('[data-start-column="right"]')!;
    expect(places.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("menuitem", { name: /About Douglas/ })).toHaveFocus();
  });

  it("Log Off returns to the logon screen; Turn Off asks for confirmation", async () => {
    renderWithIntl(<StartMenu />);
    await userEvent.click(startButton());
    await userEvent.click(screen.getByRole("menuitem", { name: "Turn Off" }));
    expect(useShellStore.getState().dialog).toEqual({ kind: "turnOff" });

    act(() => useShellStore.getState().closeDialog());
    await userEvent.click(startButton());
    await userEvent.click(screen.getByRole("menuitem", { name: "Log Off" }));
    expect(useShellStore.getState().phase).toBe("logon");
  });
});
