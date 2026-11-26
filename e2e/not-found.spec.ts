import { test, expect } from "@playwright/test";
import { startButton, windowById } from "./helpers";

/** The real 404 page (stage 10): the DouglasOS blue screen, localized, HTTP 404. */
test.describe("404 page", () => {
  test("EN: unknown URL → 404 with the blue screen and working recovery links", async ({ page }) => {
    const response = await page.goto("/en/whatever");
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('[data-blue-screen="page"]')).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "DouglasOS couldn't find the page you were looking for.",
    );
    await expect(page).toHaveTitle("404 · Page not found · DouglasOS");

    const download = page.waitForEvent("download");
    await page.locator('[data-not-found-action="cv"]').click();
    expect((await download).suggestedFilename()).toBe("Douglas-Tertuliano-CV.pdf");

    await expect(page.locator('[data-not-found-action="desktop"]')).toHaveAttribute("href", "/en");
  });

  test("PT: unknown URL → 404 in Portuguese", async ({ page }) => {
    const response = await page.goto("/pt/qualquer/coisa");
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt");
    await expect(page.getByText("Erro 404: PAGE_NOT_FOUND")).toBeVisible();
    await expect(page.locator('[data-not-found-action="desktop"]')).toHaveText("Voltar ao desktop");
    await expect(page.locator('[data-not-found-action="desktop"]')).toHaveAttribute("href", "/pt");
  });

  test("Talk to Douglas lands on the desktop with Contact open", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("douglasos-booted", "1");
      sessionStorage.setItem("douglasos-welcomed", "1");
      sessionStorage.setItem("douglasos-assistant", JSON.stringify({ dismissed: true, fired: [] }));
      sessionStorage.setItem("douglasos-messenger-toast", "1");
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en/nope");
    await page.locator('[data-not-found-action="contact"]').click();
    await expect(startButton(page)).toBeVisible();
    await expect(windowById(page, "contact")).toBeVisible();
    // The hash is dropped so a reload doesn't reopen it.
    expect(new URL(page.url()).hash).toBe("");
  });
});
