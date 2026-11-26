import { test, expect, type Page } from "@playwright/test";
import { desktopIcon, gotoDesktop, startButton, startItem, windowById } from "./helpers";

/**
 * Easter-egg discovery counter (stage 11, DESKTOP-INTERFACE-SPEC → Easter
 * eggs): toast through the balloon slot, Achievements via Start, progress
 * that survives a reload, the reward and the secret wallpaper.
 */

const ALL_BUT_PROTECTED_FILE = [
  "assistant-dance",
  "messenger-nudge",
  "trash-rescue",
  "trash-cleanup",
  "run-cmd",
  "desktop-new",
  "music-dance",
  "egg-404",
  "egg-runaway",
  "egg-scold",
  "real-404",
];

/** Seed saved progress before the app loads (only on the first load of the test). */
async function seedProgress(page: Page, ids: string[]) {
  await page.addInitScript((found) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    const state = { found: Object.fromEntries(found.map((id, i) => [id, Date.UTC(2026, 10, 1 + i)])), pending: [] };
    localStorage.setItem("douglasos:easter-eggs", JSON.stringify({ state, version: 1 }));
  }, ids);
}

const toast = (page: Page) => page.locator("[data-easter-egg-toast]");

async function pressF2OnAbout(page: Page) {
  await desktopIcon(page, "about").focus();
  await page.keyboard.press("F2");
  const dialog = page.getByTestId("protected-file-dialog");
  await expect(dialog).toBeVisible();
  // The toast waits for the message box that earned it.
  await expect(toast(page)).toHaveCount(0);
  await dialog.getByRole("button").last().click();
  await expect(dialog).toHaveCount(0);
}

test.describe("easter eggs", () => {
  test("F2 → toast 1/12 → Achievements via Start shows it → progress survives a reload", async ({ page }) => {
    await gotoDesktop(page);
    await pressF2OnAbout(page);

    const balloon = toast(page);
    await expect(balloon).toBeVisible();
    await expect(balloon).toHaveAttribute("data-easter-egg-toast", "protected-file");
    await expect(balloon).toContainText("Easter egg found! (1/12)");
    await expect(balloon).toContainText("Protected file");
    await expect(balloon).toHaveAttribute("aria-live", "polite");
    // It never steals focus.
    expect(await balloon.evaluate((el) => el.contains(document.activeElement))).toBe(false);
    await balloon.getByRole("button", { name: "Close" }).click();
    await expect(balloon).toHaveCount(0);

    await startButton(page).click();
    const item = startItem(page, "achievements");
    await expect(item).toContainText("1/12");
    await item.click();
    const win = windowById(page, "achievements");
    await expect(win).toBeVisible();
    await expect(win).toContainText("Easter eggs found: 1 of 12");
    await expect(win.locator("[data-egg][data-found]")).toHaveCount(1);
    await expect(win.locator('[data-egg="protected-file"]')).toContainText("Protected file");
    await expect(win.locator('[data-egg="run-cmd"]')).toContainText("???");

    await page.reload();
    await expect(startButton(page)).toBeVisible();
    await expect(windowById(page, "achievements")).toContainText("Easter eggs found: 1 of 12");
    // Already announced: no second toast after the reload.
    await expect(toast(page)).toHaveCount(0);
    // Finding it again changes nothing.
    await pressF2OnAbout(page);
    await expect(toast(page)).toHaveCount(0);
  });

  test("Reset progress asks first, then clears the counter", async ({ page }) => {
    await seedProgress(page, ["trash-rescue", "messenger-nudge"]);
    await gotoDesktop(page, "pt");
    await startButton(page).click();
    await expect(startItem(page, "achievements")).toContainText("2/12");
    await startItem(page, "achievements").click();
    const win = windowById(page, "achievements");
    await expect(win).toContainText("Easter eggs encontrados: 2 de 12");
    await win.locator("[data-achievements-reset]").click();
    const dialog = page.getByTestId("reset-achievements-dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator("[data-confirm-reset]").click();
    await expect(win).toContainText("Easter eggs encontrados: 0 de 12");
  });

  test("the last egg brings the reward and unlocks the secret wallpaper", async ({ page }) => {
    await seedProgress(page, ALL_BUT_PROTECTED_FILE);
    await gotoDesktop(page);

    // Locked: listed as ??? and not selectable.
    await startButton(page).click();
    await startItem(page, "display").click();
    const display = windowById(page, "display");
    const secret = display.locator('[data-wallpaper-option="golden-egg"]');
    await expect(secret).toBeDisabled();
    await expect(display).toContainText("???");
    await display.getByRole("button", { name: "Cancel" }).click();

    await pressF2OnAbout(page);
    await expect(toast(page)).toContainText("(12/12)");
    await toast(page).getByRole("button", { name: "Close" }).click();
    // mini Douglas was dismissed ("Not now"), so the toast carries his reward line.
    const reward = page.locator("[data-easter-egg-reward]");
    await expect(reward).toBeVisible();
    await expect(reward.locator('[data-assistant-action="downloadCv"]')).toBeVisible();
    await reward.locator('[data-assistant-action="open-display"]').click();
    await expect(reward).toHaveCount(0);

    await expect(display).toBeVisible();
    await expect(secret).toBeEnabled();
    await display.getByText("Golden Egg (secret)").click();
    await display.locator("[data-display-ok]").click();
    await expect(page.locator("[data-wallpaper]")).toHaveAttribute("data-wallpaper", "golden-egg");
  });
});
