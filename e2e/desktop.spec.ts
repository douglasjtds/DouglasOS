import { test, expect } from "@playwright/test";
import { desktopIcon, gotoDesktop, startButton, startItem, windowById, windows } from "./helpers";

test.describe("desktop", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("keyboard: one tab stop, arrows move the selection, Enter opens", async ({ page }) => {
    await desktopIcon(page, "about").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(desktopIcon(page, "contact")).toBeFocused();
    await expect(desktopIcon(page, "contact")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(windowById(page, "contact")).toBeVisible();
  });

  test("F2 shows the protected-file dialog and never renames", async ({ page }) => {
    await desktopIcon(page, "resume").focus();
    await page.keyboard.press("F2");
    const dialog = page.getByRole("alertdialog", { name: "Protected file" });
    await expect(dialog).toContainText("resume.pdf");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(desktopIcon(page, "resume")).toHaveAccessibleName("resume.pdf");
  });

  test("dragging an icon moves it without opening it", async ({ page }) => {
    const icon = desktopIcon(page, "skills");
    const before = (await icon.boundingBox())!;
    await page.mouse.move(before.x + before.width / 2, before.y + 20);
    await page.mouse.down();
    await page.mouse.move(before.x + 200, before.y + 30, { steps: 10 });
    await page.mouse.move(before.x + 300, before.y + 40, { steps: 10 });
    await page.mouse.up();
    await expect.poll(async () => (await icon.boundingBox())!.x).toBeGreaterThan(before.x + 150);
    await expect(windows(page)).toHaveCount(0);
  });

  test("Display Properties: picking a wallpaper applies and persists it", async ({ page }) => {
    await startButton(page).click();
    await startItem(page, "display").click();
    const win = windowById(page, "display");
    await win.getByText("Blueprint").click();
    await win.getByRole("button", { name: "OK" }).click();
    await expect(win).toHaveCount(0);
    await expect(page.locator("[data-wallpaper]")).toHaveAttribute("data-wallpaper", "blueprint");

    await page.reload();
    await expect(page.locator("[data-wallpaper]")).toHaveAttribute("data-wallpaper", "blueprint");
  });

  test("the animated 3D wallpaper is disabled under reduced motion", async ({ page }) => {
    await startButton(page).click();
    await startItem(page, "display").click();
    const option = page.locator('[data-wallpaper-option="3d"]');
    await expect(option).toBeDisabled();
    await expect(windowById(page, "display")).toContainText("reduced motion");
  });
});
