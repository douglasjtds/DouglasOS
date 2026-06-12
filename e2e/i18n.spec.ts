import { test, expect } from "@playwright/test";
import { gotoDesktop } from "./helpers";

test.describe("i18n locale toggle", () => {
  test("switching EN → PT updates the URL and persists the choice", async ({
    page,
  }) => {
    await gotoDesktop(page, "en");
    await expect(page).toHaveURL(/\/en$/);

    await page.getByRole("button", { name: "PT", exact: true }).click();
    await expect(page).toHaveURL(/\/pt(\/|$)/);
    await expect(
      page.getByRole("button", { name: "PT", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("a direct /pt visit loads the Portuguese shell", async ({ page }) => {
    await gotoDesktop(page, "pt");
    await expect(page).toHaveURL(/\/pt$/);
    await expect(
      page.getByRole("button", { name: "PT", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
