import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import ProjectsApp from "@/components/apps/ProjectsApp";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";

const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));

const store = () => useWindowStore.getState();
const route = () => {
  const h = store().windows.projects!.history!;
  return h.entries[h.index];
};
const address = () => screen.getByRole("textbox", { name: "Address" });

async function typeAddress(value: string) {
  await userEvent.clear(address());
  await userEvent.type(address(), `${value}{Enter}`);
}

describe("ProjectsApp (DouglasOS Explorer)", () => {
  beforeEach(() => {
    downloadSpy.mockClear();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    act(() => store().openWindow("projects"));
  });

  it("home lists every project and shows the root address", () => {
    renderWithIntl(<ProjectsApp />);
    expect(screen.getByRole("heading", { level: 3, name: "My Projects" })).toBeInTheDocument();
    for (const name of ["Gasolinha", "DouglasOS", "The Wedding Post"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(address()).toHaveValue("C:\\DouglasOS\\Projects\\");
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("opening a project shows its case study, moves focus to its heading and announces it", async () => {
    renderWithIntl(<ProjectsApp />);
    await userEvent.click(screen.getByRole("button", { name: "Gasolinha" }));
    expect(route()).toBe("gasolinha");
    const heading = screen.getByRole("heading", { level: 3, name: "Gasolinha" });
    expect(heading).toHaveFocus();
    expect(address()).toHaveValue("C:\\DouglasOS\\Projects\\gasolinha");
    for (const section of ["Problem", "Approach", "Role & stack", "Result"]) {
      expect(screen.getByRole("heading", { level: 4, name: section })).toBeInTheDocument();
    }
    // Pending sections say so instead of inventing content.
    expect(document.querySelectorAll("[data-coming-soon]").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Live site/ })).toHaveAttribute(
      "href",
      "https://www.gasolinha.com.br",
    );
    expect(screen.getByText("Gasolinha — DouglasOS Explorer")).toHaveAttribute("aria-live", "polite");
  });

  it("Enter in the address bar resolves names case-insensitively; Back/Forward/Home work", async () => {
    renderWithIntl(<ProjectsApp />);
    await typeAddress("the wedding POST");
    expect(route()).toBe("the-wedding-post");

    await typeAddress("douglasos");
    expect(route()).toBe("douglasos");

    const back = screen.getByRole("button", { name: "Back" });
    const forward = screen.getByRole("button", { name: "Forward" });
    expect(forward).toBeDisabled();
    await userEvent.click(back);
    expect(route()).toBe("the-wedding-post");
    expect(forward).toBeEnabled();
    await userEvent.click(forward);
    expect(route()).toBe("douglasos");
    await userEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(route()).toBe("home");
  });

  it("Esc in the address bar reverts the typed text", async () => {
    renderWithIntl(<ProjectsApp />);
    await userEvent.clear(address());
    await userEvent.type(address(), "something{Escape}");
    expect(address()).toHaveValue("C:\\DouglasOS\\Projects\\");
    expect(route()).toBe("home");
  });

  it("an unknown address opens the not-found dialog; its buttons lead home or to Contact", async () => {
    renderWithIntl(<ProjectsApp />);
    await userEvent.click(screen.getByRole("button", { name: "Gasolinha" }));
    await typeAddress("netflix");
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/Can't find “netflix”/)).toBeInTheDocument();
    expect(route()).toBe("gasolinha");

    await userEvent.click(within(dialog).getByRole("button", { name: "Project list" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(route()).toBe("home");

    await typeAddress("nope");
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Contact Douglas" }));
    expect(store().windows.contact).toBeDefined();
    expect(store().focusedId).toBe("contact");
  });

  it("OK / Esc just closes the dialog and keeps the page", async () => {
    renderWithIntl(<ProjectsApp />);
    await typeAddress("nope");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(route()).toBe("home");
    expect(store().windows.projects).toBeDefined();
  });

  it("Favorites lists the projects; File → Download CV downloads it", async () => {
    renderWithIntl(<ProjectsApp />);
    await userEvent.click(screen.getByRole("menuitem", { name: "Favorites" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "DouglasOS" }));
    expect(route()).toBe("douglasos");

    await userEvent.click(screen.getByRole("menuitem", { name: "File" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Download CV" }));
    expect(downloadSpy).toHaveBeenCalled();
  });

  it("follows routes set from outside (openWindow with a destination)", () => {
    renderWithIntl(<ProjectsApp />);
    act(() => store().openWindow("projects", { route: "the-wedding-post" }));
    expect(screen.getByRole("heading", { level: 3, name: "The Wedding Post" })).toBeInTheDocument();
    expect(address()).toHaveValue("C:\\DouglasOS\\Projects\\the-wedding-post");
  });

  it("touch: compact toolbar with a More menu instead of the menu bar", async () => {
    window.innerWidth = 390;
    renderWithIntl(<ProjectsApp />);
    expect(screen.queryByRole("menubar")).not.toBeInTheDocument();
    expect(address()).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "More" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Gasolinha" }));
    expect(route()).toBe("gasolinha");
  });
});
