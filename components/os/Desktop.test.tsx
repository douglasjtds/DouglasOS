import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { Desktop } from "@/components/os/Desktop";
import { ShellDialogs } from "@/components/os/ShellDialogs";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { useShellStore } from "@/lib/store/shellStore";
import { useDesktopStore } from "@/lib/store/desktopStore";

const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));

const icon = (name: string) => screen.getByRole("option", { name });

describe("Desktop icons", () => {
  beforeEach(() => {
    downloadSpy.mockClear();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
    useDesktopStore.getState().resetLayout();
  });

  it("renders the launchers as one listbox, in CTA order, without Display Properties", () => {
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
    ]);
    expect(screen.getByRole("listbox", { name: "Desktop icons" })).toBeInTheDocument();
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
    expect(icon("How I Work With AI")).toHaveFocus();
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
