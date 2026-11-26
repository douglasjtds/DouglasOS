import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, startButton, startItem, windowById, windows } from "./helpers";

/**
 * "DON'T OPEN THIS.exe" (stage 10) from Start → All Programs → Accessories.
 * (Run / the command palette, stage 7, get their own entry at integration.)
 */
async function openEgg(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-program-folder="accessories"]').hover();
  await page.locator('[data-program="dont-open-this"]').click();
}

const egg = (page: Page) => page.locator("[data-easter-egg]");

test.describe("DON'T OPEN THIS.exe", () => {
  test("plays A, B, C on successive opens; Esc leaves each one, nothing moves for good", async ({ page }) => {
    await gotoDesktop(page);
    const cv = page.locator('[data-desktop-icon="resume"]');
    const before = await cv.boundingBox();

    // A: the 404 blue screen.
    await openEgg(page);
    await expect(egg(page)).toHaveAttribute("data-easter-egg", "not-found");
    await expect(page.getByText("Error 404: PAGE_NOT_FOUND")).toBeVisible();
    await expect(page.locator('[data-egg-action="cv"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(egg(page)).toHaveCount(0);

    // B: the runaway desktop (static under reduced motion) + its balloon.
    await openEgg(page);
    await expect(egg(page)).toHaveAttribute("data-easter-egg", "scramble");
    await expect(page.getByText("Everything's back in place")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(egg(page)).toHaveCount(0);
    expect(await cv.boundingBox()).toEqual(before);

    // C: Access denied + mini Douglas's sticky note.
    await openEgg(page);
    await expect(egg(page)).toHaveAttribute("data-easter-egg", "access-denied");
    await expect(page.getByRole("alertdialog", { name: "Access denied" })).toBeVisible();
    await expect(page.locator("[data-egg-note]")).toContainText("NO!");
    await page.keyboard.press("Escape");
    await expect(egg(page)).toHaveCount(0);

    // Then the cycle starts over. Esc never closed a window on the way.
    await openEgg(page);
    await expect(egg(page)).toHaveAttribute("data-easter-egg", "not-found");
    await page.mouse.click(20, 20);
    await expect(egg(page)).toHaveCount(0);
  });

  test("Esc on the egg doesn't close the focused window behind it", async ({ page }) => {
    await gotoDesktop(page);
    await startButton(page).click();
    await startItem(page, "about").click();
    await expect(windowById(page, "about")).toBeVisible();
    await openEgg(page);
    await expect(egg(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(egg(page)).toHaveCount(0);
    await expect(windows(page)).toHaveCount(1);
  });

  test("the blue screen's Talk to Douglas opens Contact; the scramble balloon downloads the CV", async ({ page }) => {
    await gotoDesktop(page);
    await openEgg(page);
    await page.locator('[data-egg-action="contact"]').click();
    await expect(windowById(page, "contact")).toBeVisible();

    await openEgg(page);
    await expect(egg(page)).toHaveAttribute("data-easter-egg", "scramble");
    const download = page.waitForEvent("download");
    await page.locator('[data-egg-action="cv"]').click();
    expect((await download).suggestedFilename()).toBe("Douglas-Tertuliano-CV.pdf");
    await expect(egg(page)).toHaveCount(0);
  });

  test("with motion: the icons really run away and come back", async ({ page }) => {
    await gotoDesktop(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    await expect(startButton(page)).toBeVisible();
    await page.evaluate(() => sessionStorage.setItem("douglasos-dont-open-this", "1"));
    const icon = page.locator('[data-desktop-icon="about"]');
    await openEgg(page);
    await expect(egg(page)).toHaveAttribute("data-easter-egg", "scramble");
    await expect.poll(() => icon.evaluate((el) => el.style.transform), { timeout: 2000 }).not.toBe("");
    await expect(page.getByText("Everything's back in place")).toBeVisible({ timeout: 5000 });
    await expect.poll(() => icon.evaluate((el) => el.style.transform)).toMatch(/^$|none|scale\(1\)/);
  });
});
