import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { ShellDialogs } from "@/components/os/ShellDialogs";
import { WindowControls } from "@/components/os/window/WindowControls";
import { useShellShortcuts } from "@/hooks/useShellShortcuts";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { useShellStore } from "@/lib/store/shellStore";
import { hasUnsavedChanges, setUnsavedChanges } from "@/lib/windowClose";
import type { AppId } from "@/lib/apps/registry";

function Shell({ id }: { id: AppId }) {
  useShellShortcuts();
  return (
    <>
      <div data-window={id} tabIndex={-1}>
        <WindowControls id={id} active />
      </div>
      <ShellDialogs />
    </>
  );
}

const isOpen = (id: AppId) => Boolean(useWindowStore.getState().windows[id]);
const dialog = () => screen.queryByTestId("confirm-close-dialog");

function setup(id: AppId) {
  useWindowStore.getState().openWindow(id);
  renderWithIntl(<Shell id={id} />);
  document.querySelector<HTMLElement>(`[data-window="${id}"]`)!.focus();
  return userEvent.setup();
}

describe("closing a window with confirmation", () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
  });
  afterEach(() => setUnsavedChanges("paint", false));

  it("Esc asks “Close <app>?” instead of closing the window", async () => {
    const user = setup("paint");
    await user.keyboard("{Escape}");
    expect(isOpen("paint")).toBe(true);
    expect(await screen.findByRole("alertdialog", { name: "Close DouglasOS Paint" })).toHaveTextContent(
      "Close DouglasOS Paint?",
    );
    // No is the default button, so a stray Enter never closes anything.
    expect(screen.getByRole("button", { name: "No" })).toHaveFocus();
  });

  it("Yes closes the window", async () => {
    const user = setup("about");
    await user.keyboard("{Escape}");
    await user.click(await screen.findByRole("button", { name: "Yes" }));
    expect(isOpen("about")).toBe(false);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("No keeps the window and hands focus back to it", async () => {
    const user = setup("about");
    await user.keyboard("{Escape}");
    await user.click(await screen.findByRole("button", { name: "No" }));
    expect(isOpen("about")).toBe(true);
    expect(dialog()).not.toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[data-window="about"]')).toHaveFocus());
  });

  it("a second Esc cancels the dialog instead of closing the window", async () => {
    const user = setup("about");
    await user.keyboard("{Escape}");
    await screen.findByTestId("confirm-close-dialog");
    await user.keyboard("{Escape}");
    expect(dialog()).not.toBeInTheDocument();
    expect(useShellStore.getState().dialog).toBeNull();
    expect(isOpen("about")).toBe(true);
  });

  it("a click outside the box cancels it", async () => {
    const user = setup("about");
    await user.keyboard("{Escape}");
    await screen.findByTestId("confirm-close-dialog");
    await user.click(document.querySelector<HTMLElement>("[data-message-box-overlay]")!);
    expect(dialog()).not.toBeInTheDocument();
    expect(isOpen("about")).toBe(true);
  });

  it("the X button and Alt+F4 still close a window right away", async () => {
    const user = setup("about");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(isOpen("about")).toBe(false);
    expect(dialog()).not.toBeInTheDocument();

    useWindowStore.getState().openWindow("about");
    await user.keyboard("{Alt>}{F4}{/Alt}");
    expect(isOpen("about")).toBe(false);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("Paint without a drawing closes on X immediately", async () => {
    const user = setup("paint");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(isOpen("paint")).toBe(false);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("Paint with an unsaved drawing asks on X, and Yes discards it", async () => {
    setUnsavedChanges("paint", true);
    const user = setup("paint");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(isOpen("paint")).toBe(true);
    expect(await screen.findByTestId("confirm-close-dialog")).toHaveTextContent(
      "Your drawing hasn't been saved. Close DouglasOS Paint anyway?",
    );
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(isOpen("paint")).toBe(false);
    expect(hasUnsavedChanges("paint")).toBe(false);
  });

  it("Paint with an unsaved drawing asks on Alt+F4", async () => {
    setUnsavedChanges("paint", true);
    const user = setup("paint");
    await user.keyboard("{Alt>}{F4}{/Alt}");
    expect(isOpen("paint")).toBe(true);
    expect(await screen.findByTestId("confirm-close-dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(isOpen("paint")).toBe(true);
  });
});
