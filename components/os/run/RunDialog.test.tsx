import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import RunDialog from "@/components/os/run/RunDialog";
import CommandPalette from "@/components/os/run/CommandPalette";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { useShellStore } from "@/lib/store/shellStore";
import { useEasterEggStore } from "@/lib/store/easterEggStore";

const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));
const openLinkSpy = vi.fn();
vi.mock("@/lib/openLink", () => ({
  openLink: (...args: unknown[]) => openLinkSpy(...args),
}));

const route = () => {
  const h = useWindowStore.getState().windows.projects?.history;
  return h ? h.entries[h.index] : undefined;
};

beforeEach(() => {
  downloadSpy.mockClear();
  openLinkSpy.mockClear();
  useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
  useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: { kind: "run" } });
});

describe("Run dialog", () => {
  const field = () => screen.getByRole("combobox", { name: "Open:" });

  it("focuses the Open: field; 'cv' + Enter downloads the CV and closes", async () => {
    renderWithIntl(<RunDialog />);
    expect(field()).toHaveFocus();
    await userEvent.type(field(), "cv{Enter}");
    expect(downloadSpy).toHaveBeenCalledWith("/resume.pdf", expect.any(String));
    expect(useShellStore.getState().dialog).toBeNull();
  });

  it("opens a project's case study by name", async () => {
    renderWithIntl(<RunDialog />);
    await userEvent.type(field(), "Gasolinha{Enter}");
    expect(route()).toBe("gasolinha");
  });

  it("suggests as you type; ↓ puts the highlighted command in the field", async () => {
    renderWithIntl(<RunDialog />);
    await userEvent.type(field(), "cont");
    expect(field()).toHaveAttribute("aria-expanded", "true");
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Contact");
    await userEvent.keyboard("{ArrowDown}");
    expect(field()).toHaveValue("contact");
    expect(field()).toHaveAttribute("aria-activedescendant", options[0].id);
    await userEvent.keyboard("{Enter}");
    expect(useWindowStore.getState().windows.contact).toBeDefined();
  });

  it("Esc closes the suggestion list before the dialog", async () => {
    renderWithIntl(<RunDialog />);
    await userEvent.type(field(), "pro");
    expect(field()).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    expect(field()).toHaveAttribute("aria-expanded", "false");
    expect(useShellStore.getState().dialog).toEqual({ kind: "run" });
    await userEvent.keyboard("{Escape}");
    expect(useShellStore.getState().dialog).toBeNull();
  });

  it("an unknown name shows the 'couldn't find' error, then returns to the field", async () => {
    renderWithIntl(<RunDialog />);
    await userEvent.type(field(), "xyz{Enter}");
    const error = await screen.findByRole("alertdialog");
    expect(error).toHaveTextContent("DouglasOS couldn't find “xyz”");
    expect(error).not.toHaveTextContent(/windows|microsoft/i);
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(field()).toHaveFocus();
    expect(useShellStore.getState().dialog).toEqual({ kind: "run" });
  });

  it("'cmd' shows the light easter egg instead of a terminal", async () => {
    renderWithIntl(<RunDialog />);
    await userEvent.type(field(), "cmd{Enter}");
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("No terminal in here");
  });

  it("'cmd' counts the run-cmd easter egg (stage 11); a normal run doesn't", async () => {
    useEasterEggStore.getState().reset();
    const first = renderWithIntl(<RunDialog />);
    await userEvent.type(field(), "linkedin{Enter}");
    expect(useEasterEggStore.getState().found).not.toHaveProperty("run-cmd");
    // Two mounted RunDialogs would both reopen, and one's modal layer would
    // block pointer events on the other's field: start from a single one.
    first.unmount();
    useShellStore.getState().openDialog({ kind: "run" });
    renderWithIntl(<RunDialog />);
    await userEvent.type(field(), "cmd{Enter}");
    await screen.findByRole("alertdialog");
    expect(useEasterEggStore.getState().found).toHaveProperty("run-cmd");
  });

  it("follows external shortcuts (linkedin)", async () => {
    renderWithIntl(<RunDialog />);
    await userEvent.type(field(), "linkedin{Enter}");
    expect(openLinkSpy).toHaveBeenCalledWith(expect.stringContaining("linkedin.com"), true);
  });
});

describe("Command palette", () => {
  beforeEach(() => {
    useShellStore.setState({ dialog: { kind: "palette" } });
  });

  const search = () => screen.getByRole("combobox", { name: "Command palette" });

  it("lists everything with an empty query, CV and Contact near the top", () => {
    renderWithIntl(<CommandPalette />);
    expect(search()).toHaveFocus();
    const names = screen.getAllByRole("option").map((o) => o.textContent);
    expect(names.slice(0, 3).join(" ")).toMatch(/resume\.pdf.*Contact/);
    expect(names.some((n) => n?.includes("Gasolinha"))).toBe(true);
  });

  it("filters as you type and opens the highlighted result with Enter", async () => {
    renderWithIntl(<CommandPalette />);
    await userEvent.type(search(), "experi");
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Enter}");
    expect(useWindowStore.getState().windows.experience).toBeDefined();
    expect(useShellStore.getState().dialog).toBeNull();
  });

  it("arrows move the highlight (wrapping)", async () => {
    renderWithIntl(<CommandPalette />);
    await userEvent.keyboard("{ArrowUp}");
    const options = screen.getAllByRole("option");
    expect(options[options.length - 1]).toHaveAttribute("aria-selected", "true");
    expect(search()).toHaveAttribute("aria-activedescendant", options[options.length - 1].id);
  });

  it("shows the not-found message when nothing matches", async () => {
    renderWithIntl(<CommandPalette />);
    await userEvent.type(search(), "xyzzy");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("DouglasOS couldn't find “xyzzy”");
  });

  it("Ctrl+K inside the palette closes it", async () => {
    renderWithIntl(<CommandPalette />);
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(useShellStore.getState().dialog).toBeNull();
  });
});
