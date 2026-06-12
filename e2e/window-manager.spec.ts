import { test, expect } from "@playwright/test";
import { dockButton, gotoDesktop, windows } from "./helpers";

test.describe("window manager", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("opens an app window from the dock", async ({ page }) => {
    await dockButton(page, "about").click();
    await expect(windows(page)).toHaveCount(1);
    await expect(dockButton(page, "about")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("focuses the clicked window so it stacks on top", async ({ page }) => {
    await dockButton(page, "about").click();
    await dockButton(page, "projects").click();
    await expect(windows(page)).toHaveCount(2);

    // Address windows by their accessible name (order-independent).
    const about = page.getByRole("dialog", { name: /about/i });
    const projects = page.getByRole("dialog", { name: /project/i });
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

  test("minimize hides the window, restoring via the dock brings it back", async ({
    page,
  }) => {
    await dockButton(page, "about").click();
    const win = windows(page).first();
    await win.getByRole("button", { name: "Minimize" }).click();
    await expect(win).toBeHidden();

    await dockButton(page, "about").click();
    await expect(windows(page).first()).toBeVisible();
  });

  test("close removes the window", async ({ page }) => {
    await dockButton(page, "about").click();
    await windows(page).first().getByRole("button", { name: "Close" }).click();
    await expect(windows(page)).toHaveCount(0);
    await expect(dockButton(page, "about")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
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
    await dockButton(page, "about").click();
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
    await dockButton(page, "about").click();
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

  test("maximize then restore changes and reverts the window size", async ({
    page,
  }) => {
    await dockButton(page, "about").click();
    const win = windows(page).first();
    const width = async () => (await win.boundingBox())?.width ?? 0;

    const original = await width();
    await win.getByRole("button", { name: "Maximize" }).click();
    // Poll past the open/maximize animation until it has grown.
    await expect.poll(width).toBeGreaterThan(original + 50);

    await win.getByRole("button", { name: "Maximize" }).click();
    // And shrinks back to roughly the original width.
    await expect.poll(width).toBeLessThan(original + 50);
  });
});
