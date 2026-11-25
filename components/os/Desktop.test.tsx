import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { Desktop } from "@/components/os/Desktop";
import { ShellDialogs } from "@/components/os/ShellDialogs";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { useShellStore } from "@/lib/store/shellStore";
import { useDesktopStore } from "@/lib/store/desktopStore";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { useTrashNoticeStore } from "@/lib/store/trashNoticeStore";
import { binCell, iconRect } from "@/lib/store/recycleBin";
import { cellToPixel } from "@/lib/store/desktopGrid";

const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));
const openLinkSpy = vi.fn();
vi.mock("@/lib/openLink", () => ({
  openLink: (...args: unknown[]) => openLinkSpy(...args),
}));

const icon = (name: string) => screen.getByRole("option", { name });

describe("Desktop icons", () => {
  beforeEach(() => {
    downloadSpy.mockClear();
    openLinkSpy.mockClear();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
    useDesktopStore.getState().resetLayout();
    useDesktopStore.setState({ selectedIds: [], drag: null, rescue: null, binFull: false, trashCounts: {} });
  });

  it("renders the launchers as one listbox, in CTA order, links last, the Recycle Bin pinned, without Display Properties", () => {
    renderWithIntl(<Desktop />);
    // The label is the last child (the glyph is aria-hidden SVG).
    const options = screen
      .getAllByRole("option")
      .map((o) => o.lastElementChild?.textContent);
    expect(options).toEqual([
      "About Douglas",
      "resume.pdf",
      "Contact",
      "My Projects",
      "Experience",
      "Skills",
      "How I Work With AI",
      "DouglasOS Messenger",
      "linkedin.url",
      "github.url",
      "whatsapp.exe",
      "write-me.eml",
      "Recycle Bin",
    ]);
    expect(screen.getByRole("listbox", { name: "Desktop icons" })).toHaveAttribute("aria-multiselectable", "true");
  });

  it("opens an app on a single click and selects it", async () => {
    renderWithIntl(<Desktop />);
    await userEvent.click(icon("About Douglas"));
    expect(useWindowStore.getState().windows.about).toBeDefined();
    expect(icon("About Douglas")).toHaveAttribute("aria-selected", "true");
  });

  it("downloads the CV on a single click of resume.pdf", async () => {
    renderWithIntl(<Desktop />);
    await userEvent.click(icon("resume.pdf"));
    expect(downloadSpy).toHaveBeenCalledWith("/resume.pdf", "Douglas-Tertuliano-CV.pdf");
  });

  it("follows an external shortcut on a single click, without opening a window", async () => {
    renderWithIntl(<Desktop />);
    await userEvent.click(icon("linkedin.url"));
    expect(openLinkSpy).toHaveBeenCalledWith("https://www.linkedin.com/in/douglasjtds", true);
    await userEvent.click(icon("write-me.eml"));
    expect(openLinkSpy).toHaveBeenLastCalledWith("mailto:douglasjtds@gmail.com", false);
    expect(useWindowStore.getState().windows).toEqual({});
    expect(icon("linkedin.url")).toHaveAttribute("title", "LinkedIn profile (opens in a new tab)");
  });

  it("→ from the apps column reaches the links column", async () => {
    renderWithIntl(<Desktop />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(icon("linkedin.url")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(openLinkSpy).toHaveBeenCalledWith("https://github.com/douglasjtds", true);
  });

  it("a press that turns into a drag does not open the app", () => {
    renderWithIntl(<Desktop />);
    const target = icon("About Douglas");
    const wrapper = target.parentElement!;
    fireEvent.pointerDown(wrapper, { button: 0, pointerId: 1, clientX: 20, clientY: 20 });
    fireEvent.pointerMove(wrapper, { pointerId: 1, clientX: 300, clientY: 260 });
    fireEvent.pointerUp(wrapper, { pointerId: 1, clientX: 300, clientY: 260 });
    fireEvent.click(target);
    expect(useWindowStore.getState().windows.about).toBeUndefined();
    expect(useDesktopStore.getState().iconCells.about).not.toEqual({ col: 0, row: 0 });
  });

  it("is a single tab stop with arrow / Home / End navigation and Enter to open", async () => {
    renderWithIntl(<Desktop />);
    const tabbable = screen.getAllByRole("option").filter((o) => o.tabIndex === 0);
    expect(tabbable).toHaveLength(1);

    await userEvent.tab();
    expect(icon("About Douglas")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(icon("resume.pdf")).toHaveFocus();
    expect(icon("resume.pdf")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{End}");
    // The Recycle Bin is pinned to the bottom-right cell: last in grid order.
    expect(icon("Recycle Bin")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(icon("About Douglas")).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(useWindowStore.getState().windows.contact).toBeDefined();
  });

  it("F2 shows the protected-file joke and never renames", async () => {
    renderWithIntl(
      <>
        <Desktop />
        <ShellDialogs />
      </>,
    );
    await userEvent.tab();
    await userEvent.keyboard("{F2}");
    const dialog = screen.getByRole("alertdialog", { name: "Protected file" });
    expect(dialog).toHaveTextContent("“About Douglas” refused to be renamed");
    await userEvent.click(screen.getByRole("button", { name: "Fair enough" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(icon("About Douglas")).toHaveTextContent("About Douglas");
  });
});

describe("Desktop: multi-select, lasso and the Recycle Bin (stage 6)", () => {
  const VP = { width: 1440, height: 900 };
  const selected = () => useDesktopStore.getState().selectedIds;

  beforeEach(() => {
    downloadSpy.mockClear();
    openLinkSpy.mockClear();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
    useDesktopStore.getState().resetLayout();
    useDesktopStore.setState({ selectedIds: [], drag: null, rescue: null, binFull: false, trashCounts: {} });
    // As in a session where "Not now" was picked: the bin's balloon takes the line.
    useAssistantStore.setState({ dismissed: true, visible: false, queue: [], state: "idle" });
    useTrashNoticeStore.setState({ notice: null, seq: 0 });
  });

  it("Ctrl/Cmd+click toggles the selection without opening", async () => {
    renderWithIntl(<Desktop />);
    const user = userEvent.setup();
    await user.click(icon("Skills"));
    expect(useWindowStore.getState().windows.skills).toBeDefined();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null });
    await user.keyboard("{Control>}");
    await user.click(icon("linkedin.url"));
    await user.click(icon("github.url"));
    await user.keyboard("{/Control}");
    expect(selected()).toEqual(["skills", "linkedin", "github"]);
    expect(openLinkSpy).not.toHaveBeenCalled();
    await user.keyboard("{Meta>}");
    await user.click(icon("Skills"));
    await user.keyboard("{/Meta}");
    expect(selected()).toEqual(["linkedin", "github"]);
    expect(icon("Skills")).toHaveAttribute("aria-selected", "false");
    expect(icon("github.url")).toHaveAttribute("aria-selected", "true");
  });

  it("keyboard: Ctrl+A selects every icon but the bin, Esc clears, Space / Ctrl+Space select", async () => {
    renderWithIntl(<Desktop />);
    await userEvent.tab();
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(selected()).toHaveLength(12);
    expect(selected()).not.toContain("recycle-bin");
    expect(icon("Recycle Bin")).toHaveAttribute("aria-selected", "false");
    await userEvent.keyboard("{Escape}");
    expect(selected()).toEqual([]);
    // Ctrl+arrow moves focus only; Ctrl+Space adds the focused icon.
    await userEvent.keyboard(" ");
    expect(selected()).toEqual(["about"]);
    await userEvent.keyboard("{Control>}{ArrowDown}{/Control}");
    expect(icon("resume.pdf")).toHaveFocus();
    expect(selected()).toEqual(["about"]);
    await userEvent.keyboard("{Control>} {/Control}");
    expect(selected()).toEqual(["about", "resume"]);
  });

  it("Delete 'deletes' the selection: nothing moves, the rescue line shows", async () => {
    renderWithIntl(<Desktop />);
    const before = useDesktopStore.getState().iconCells;
    await userEvent.tab();
    await userEvent.keyboard("{Delete}");
    expect(useDesktopStore.getState().rescue?.ids).toEqual(["about"]);
    expect(useDesktopStore.getState().iconCells).toEqual(before);
    expect(useTrashNoticeStore.getState().notice?.textKey).toBe("assistant.trash.lines.about.v1");
    // Bin focused + Delete: the bin can't be deleted.
    await userEvent.keyboard("{End}{Delete}");
    expect(useDesktopStore.getState().rescue?.seq).toBe(1);
  });

  it("dropping an icon on the bin rescues it back to its own cell", () => {
    renderWithIntl(<Desktop />);
    const origin = useDesktopStore.getState().iconCells.whatsapp;
    const from = cellToPixel(origin, VP);
    const bin = iconRect(binCell(VP), VP);
    const wrapper = icon("whatsapp.exe").parentElement!;
    fireEvent.pointerDown(icon("whatsapp.exe"), { button: 0, pointerId: 1, clientX: from.x + 30, clientY: from.y + 20 });
    fireEvent.pointerDown(wrapper, { button: 0, pointerId: 1, clientX: from.x + 30, clientY: from.y + 20 });
    fireEvent.pointerMove(wrapper, { pointerId: 1, clientX: bin.x + 30, clientY: bin.y + 30 });
    expect(useDesktopStore.getState().drag?.overBin).toBe(true);
    expect(icon("Recycle Bin")).toHaveAttribute("data-drop-target", "true");
    fireEvent.pointerUp(wrapper, { pointerId: 1, clientX: bin.x + 30, clientY: bin.y + 30 });
    fireEvent.click(icon("whatsapp.exe"));
    expect(openLinkSpy).not.toHaveBeenCalled();
    expect(useDesktopStore.getState().iconCells.whatsapp).toEqual(origin);
    expect(useDesktopStore.getState().rescue?.ids).toEqual(["whatsapp"]);
    expect(useDesktopStore.getState().binFull).toBe(true);
    expect(useTrashNoticeStore.getState().notice?.textKey).toMatch(/^assistant\.trash\.lines\.whatsapp\./);
  });

  it("a fast first move that already left the icon still starts the drag", () => {
    renderWithIntl(<Desktop />);
    const wrapper = icon("Skills").parentElement!;
    fireEvent.pointerDown(wrapper, { button: 0, pointerId: 9, clientX: 40, clientY: 500 });
    // Far outside the icon: only the window listener sees this move.
    fireEvent.pointerMove(document.body, { pointerId: 9, clientX: 640, clientY: 500 });
    expect(useDesktopStore.getState().drag?.ids).toEqual(["skills"]);
    fireEvent.pointerUp(wrapper, { pointerId: 9, clientX: 640, clientY: 500 });
    expect(useDesktopStore.getState().drag).toBeNull();
    expect(useDesktopStore.getState().iconCells.skills.col).toBeGreaterThan(5);
  });

  it("the lasso selects the icons it touches; dragging one moves the group", () => {
    renderWithIntl(<Desktop />);
    const desktop = document.querySelector<HTMLElement>("[data-desktop]")!;
    const surface = screen.getByRole("listbox");
    const linkedin = cellToPixel(useDesktopStore.getState().iconCells.linkedin, VP);
    const whatsapp = cellToPixel(useDesktopStore.getState().iconCells.whatsapp, VP);
    // From the empty area right of the links column, up-left over three links.
    fireEvent.pointerDown(surface, { button: 0, pointerId: 2, clientX: linkedin.x + 120, clientY: 2 });
    fireEvent.pointerMove(desktop, { pointerId: 2, clientX: linkedin.x + 10, clientY: whatsapp.y + 40 });
    expect(document.querySelector("[data-lasso]")).not.toBeNull();
    fireEvent.pointerUp(desktop, { pointerId: 2, clientX: linkedin.x + 10, clientY: whatsapp.y + 40 });
    expect(document.querySelector("[data-lasso]")).toBeNull();
    expect(selected()).toEqual(["linkedin", "github", "whatsapp"]);

    const github = icon("github.url");
    const wrapper = github.parentElement!;
    fireEvent.pointerDown(github, { button: 0, pointerId: 3, clientX: 200, clientY: 120 });
    fireEvent.pointerDown(wrapper, { button: 0, pointerId: 3, clientX: 200, clientY: 120 });
    fireEvent.pointerMove(wrapper, { pointerId: 3, clientX: 200 + 88 * 3, clientY: 120 });
    fireEvent.pointerUp(wrapper, { pointerId: 3, clientX: 200 + 88 * 3, clientY: 120 });
    const cells = useDesktopStore.getState().iconCells;
    expect(cells.linkedin).toEqual({ col: 4, row: 0 });
    expect(cells.github).toEqual({ col: 4, row: 1 });
    expect(cells.whatsapp).toEqual({ col: 4, row: 2 });
    expect(cells.email).toEqual({ col: 1, row: 3 });
  });

  it("a click on empty desktop clears the selection", () => {
    renderWithIntl(<Desktop />);
    useDesktopStore.getState().select(["about", "resume"]);
    fireEvent.pointerDown(screen.getByRole("listbox"), { button: 0, pointerId: 4, clientX: 700, clientY: 400 });
    expect(selected()).toEqual([]);
  });

  it("the context menu offers Open and Delete; Delete runs the same joke", async () => {
    renderWithIntl(<Desktop />);
    fireEvent.contextMenu(icon("Contact"));
    const del = await screen.findByRole("menuitem", { name: "Delete" });
    expect(screen.getByRole("menuitem", { name: "Open" })).toBeInTheDocument();
    await userEvent.click(del);
    expect(useDesktopStore.getState().rescue?.ids).toEqual(["contact"]);
    expect(useWindowStore.getState().windows.contact).toBeUndefined();
  });

  it("the bin opens its (empty) window on a single click and has no Delete", async () => {
    renderWithIntl(<Desktop />);
    await userEvent.click(icon("Recycle Bin"));
    expect(useWindowStore.getState().windows["recycle-bin"]).toBeDefined();
    fireEvent.contextMenu(icon("Recycle Bin"));
    await screen.findByRole("menuitem", { name: "Open" });
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
  });
});
