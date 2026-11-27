import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, startButton, startItem, windowById } from "./helpers";

/** cmd.exe (stage 13): opened through Run, driven by the keyboard. */

async function openCmd(page: Page) {
  await gotoDesktop(page);
  await startButton(page).click();
  await startItem(page, "run").click();
  await page.locator("[data-run-input]").fill("cmd");
  await page.locator("[data-run-input]").press("Enter");
  const win = windowById(page, "cmd");
  await expect(win).toBeVisible();
  const input = win.getByRole("textbox", { name: "Command" });
  await expect(input).toBeFocused();
  return { win, input, log: win.getByRole("log") };
}

test.describe("cmd.exe", () => {
  test("Run → cmd opens the window; help and type about.txt print real content", async ({ page }) => {
    const { input, log } = await openCmd(page);
    await input.fill("help");
    await input.press("Enter");
    await expect(log).toContainText("type");
    await input.fill("type about.txt");
    await input.press("Enter");
    await expect(log).toContainText("AI-First Fullstack Developer");
  });

  test("an empty prompt still has a visible, clickable field", async ({ page }) => {
    const { win, input } = await openCmd(page);
    const mirror = win.locator("[data-cmd-mirror]");
    expect((await mirror.boundingBox())!.height).toBeGreaterThan(0);
    expect((await input.boundingBox())!.height).toBeGreaterThan(0);
    await win.getByRole("log").click();
    await input.click();
    await expect(input).toBeFocused();
  });

  test("start resume.pdf downloads the CV", async ({ page }) => {
    const { input } = await openCmd(page);
    const download = page.waitForEvent("download");
    await input.fill("start resume.pdf");
    await input.press("Enter");
    expect((await download).suggestedFilename()).toContain(".pdf");
  });

  test("sudo counts an easter egg (2 with the Run → cmd discovery)", async ({ page }) => {
    const { input, log } = await openCmd(page);
    await input.fill("sudo x");
    await input.press("Enter");
    await expect(log).toContainText("sudo");
    await page.keyboard.press("Escape");
    await startButton(page).click();
    await expect(page.locator("[data-egg-counter]")).toHaveText("2/14");
  });

  test("a line wider than the field keeps its end visible in the mirror", async ({ page }) => {
    const { win, input } = await openCmd(page);
    await input.pressSequentially(`echo ${"abcdefghij".repeat(20)}END`);
    const mirror = win.locator("[data-cmd-mirror]");
    await expect.poll(() => input.evaluate((el) => (el as HTMLInputElement).scrollLeft)).toBeGreaterThan(0);
    await expect
      .poll(async () => {
        const [m, i] = await Promise.all([
          mirror.evaluate((el) => el.scrollLeft),
          input.evaluate((el) => (el as HTMLInputElement).scrollLeft),
        ]);
        // WebKit lays text out a few px differently in a field vs a div: stay within one character.
        return m > 0 && Math.abs(m - i) <= 6;
      })
      .toBe(true);
  });
});
