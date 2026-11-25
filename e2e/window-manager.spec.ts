import { test, expect } from "@playwright/test";
import { desktopIcon, gotoDesktop, taskButton, windowById, windows } from "./helpers";

test.describe("window manager", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("opens an app window and adds a pressed taskbar button", async ({ page }) => {
    await desktopIcon(page, "about").click();
    await expect(windows(page)).toHaveCount(1);
    await expect(taskButton(page, "about")).toHaveAttribute("aria-pressed", "true");
  });

  test("focuses the clicked window so it stacks on top", async ({ page }) => {
    await desktopIcon(page, "about").click();
    await desktopIcon(page, "projects").click();
    await expect(windows(page)).toHaveCount(2);

    const about = windowById(page, "about");
    const projects = windowById(page, "projects");
    const z = async (loc: typeof about) =>
      Number(await loc.evaluate((el) => getComputedStyle(el).zIndex));

    // Projects opened last → currently on top.
    expect(await z(projects)).toBeGreaterThan(await z(about));

    // Windows cascade down-right, so About's centre is covered by Projects.
    // Click the strip of About exposed above Projects' top edge (computed from
    // the live boxes so it's viewport-independent).
    const aboutBox = (await about.boundingBox())!;
    const projectsBox = (await projects.boundingBox())!;
    await page.mouse.click(
      aboutBox.x + aboutBox.width / 2,
      (aboutBox.y + projectsBox.y) / 2,
    );
    await expect.poll(() => z(about)).toBeGreaterThan(101);
    expect(await z(about)).toBeGreaterThan(await z(projects));
  });

  test("minimize via the title bar, restore via the taskbar", async ({ page }) => {
    await desktopIcon(page, "about").click();
    const win = windowById(page, "about");
    await win.getByRole("button", { name: "Minimize" }).click();
    await expect(win).toHaveCSS("opacity", "0");
    await expect(taskButton(page, "about")).toHaveAttribute("aria-pressed", "false");

    await taskButton(page, "about").click();
    await expect(win).toHaveCSS("opacity", "1");
    await expect(taskButton(page, "about")).toHaveAttribute("aria-pressed", "true");
  });

  test("minimize/restore via the taskbar never scrolls the shell", async ({ page }) => {
    // A minimized window is tweened onto its taskbar button and hangs partly
    // below the viewport. The shell must stay pinned: it once got scrolled
    // up on restore, leaving an empty band under the taskbar.
    const shell = page.locator("[data-shell]");
    await desktopIcon(page, "about").click();
    await desktopIcon(page, "projects").click();
    const projects = windowById(page, "projects");

    for (let i = 0; i < 2; i++) {
      await taskButton(page, "projects").click();
      await expect(projects).toHaveCSS("opacity", "0");
      await taskButton(page, "projects").click();
      await expect(projects).toHaveCSS("opacity", "1");
      await expect(projects).toBeFocused();
    }
    await taskButton(page, "about").click();
    await expect(windowById(page, "about")).toBeFocused();
    await taskButton(page, "projects").click();
    await expect(projects).toBeFocused();
    expect(await shell.evaluate((el) => el.scrollTop)).toBe(0);

    // The shell is not a scroll container at all, so nothing can offset it.
    await taskButton(page, "projects").click();
    await expect(projects).toHaveCSS("opacity", "0");
    expect(
      await shell.evaluate((el) => {
        el.scrollTop = 200;
        return el.scrollTop;
      }),
    ).toBe(0);
    const viewport = page.viewportSize()!;
    const taskbarBottom = await page
      .locator("[data-taskbar]")
      .evaluate((el) => el.getBoundingClientRect().bottom);
    expect(Math.round(taskbarBottom)).toBe(viewport.height);
  });

  test("clicking the focused window's taskbar button minimizes it", async ({ page }) => {
    await desktopIcon(page, "about").click();
    await taskButton(page, "about").click();
    await expect(windowById(page, "about")).toHaveCSS("opacity", "0");
    await expect(taskButton(page, "about")).toHaveAttribute("aria-pressed", "false");
  });

  test("close removes the window and its taskbar button", async ({ page }) => {
    await desktopIcon(page, "about").click();
    await windowById(page, "about").getByRole("button", { name: "Close" }).click();
    await expect(windows(page)).toHaveCount(0);
    await expect(taskButton(page, "about")).toHaveCount(0);
  });

  test("Esc closes the focused window", async ({ page }) => {
    await desktopIcon(page, "about").click();
    await expect(windowById(page, "about")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(windows(page)).toHaveCount(0);
  });

  /**
   * Drag a window's east-edge resize handle by `dx` px. Grabs the centre of the
   * 6px strip at the vertical midpoint (clear of the corner zones) and nudges
   * the pointer once after pressing so capture engages before the big move —
   * keeps the drag reliable under parallel load.
   */
  async function dragEastEdge(
    page: Parameters<typeof gotoDesktop>[0],
    win: ReturnType<typeof windows>,
    dx: number,
  ) {
    const box = (await win.boundingBox())!;
    const x = box.x + box.width - 4;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + Math.sign(dx) * 6, y);
    await page.mouse.move(x + dx, y, { steps: 16 });
    await page.mouse.up();
  }

  test("resizing the east edge grows then shrinks the window width", async ({
    page,
  }) => {
    await desktopIcon(page, "about").click();
    const win = windows(page).first();
    const width = async () => (await win.boundingBox())!.width;
    const original = await width();

    // `toPass` retries the drag if a synthetic pointer sequence is dropped —
    // a genuinely broken resize would still fail every attempt.
    await expect(async () => {
      await dragEastEdge(page, win, 160);
      expect(await width()).toBeGreaterThan(original + 100);
    }).toPass();

    // Drag well past the 400px minimum; it should floor, not vanish.
    await expect(async () => {
      await dragEastEdge(page, win, -600);
      expect(await width()).toBeLessThan(original);
    }).toPass();
    expect(await width()).toBeGreaterThanOrEqual(399);
  });

  test("windows and their sizes persist across a reload", async ({ page }) => {
    await desktopIcon(page, "about").click();
    const win = windows(page).first();
    const width = async () => (await win.boundingBox())!.width;
    const original = await width();

    await expect(async () => {
      await dragEastEdge(page, win, 150);
      expect(await width()).toBeGreaterThan(original + 100);
    }).toPass();

    await page.reload();

    // The same window reopens at (about) its resized width, not the default.
    const winAfter = windows(page).first();
    await expect(winAfter).toBeVisible();
    await expect
      .poll(async () => (await winAfter.boundingBox())!.width)
      .toBeGreaterThan(original + 100);
  });

  test("maximize fills the work area; Restore reverts the size", async ({ page }) => {
    await desktopIcon(page, "about").click();
    const win = windows(page).first();
    const box = async () => (await win.boundingBox())!;
    const viewport = page.viewportSize()!;
    const taskbar = (await page.locator("[data-taskbar]").boundingBox())!;

    const original = (await box()).width;
    await win.getByRole("button", { name: "Maximize" }).click();
    await expect.poll(async () => (await box()).width).toBe(viewport.width);
    const max = await box();
    expect(max.x).toBe(0);
    expect(max.y).toBe(0);
    expect(Math.round(max.y + max.height)).toBe(Math.round(taskbar.y));

    // The same button is now labelled "Restore".
    await win.getByRole("button", { name: "Restore" }).click();
    await expect.poll(async () => (await box()).width).toBeLessThan(original + 50);
  });

  test("double-clicking the title bar toggles maximize", async ({ page }) => {
    await desktopIcon(page, "about").click();
    const win = windows(page).first();
    await win.locator("[data-titlebar]").dblclick({ position: { x: 150, y: 12 } });
    await expect(win.getByRole("button", { name: "Restore" })).toBeVisible();
  });
});
