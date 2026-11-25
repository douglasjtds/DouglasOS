import { test, expect, type Locator, type Page } from "@playwright/test";
import { assistantBubble, desktopIcon, gotoDesktop, windowById, windows } from "./helpers";

/** The Recycle Bin's own balloon (mini Douglas dismissed, as `gotoDesktop` leaves him). */
function trashNotice(page: Page) {
  return page.locator("[data-trash-notice]");
}

function recycleBin(page: Page) {
  return desktopIcon(page, "recycle-bin");
}

async function center(locator: Locator) {
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Press on `from`, drag in steps and release over the bin. */
async function dragToBin(page: Page, from: Locator) {
  const start = (await from.boundingBox())!;
  const bin = await center(recycleBin(page));
  await page.mouse.move(start.x + start.width / 2, start.y + 20);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 40, start.y + 40, { steps: 5 });
  await page.mouse.move(bin.x, bin.y, { steps: 15 });
  await expect(recycleBin(page)).toHaveAttribute("data-drop-target", "true");
  await page.mouse.up();
}

test.describe("Recycle Bin + lasso", () => {
  test("dragging WhatsApp into the bin: mini Douglas rescues it to the same spot with its own line", async ({
    page,
  }) => {
    await gotoDesktop(page, "en", { assistant: true });
    const whatsapp = desktopIcon(page, "whatsapp");
    const before = (await whatsapp.boundingBox())!;
    const popup = page.waitForEvent("popup", { timeout: 1500 }).catch(() => null);

    await dragToBin(page, whatsapp);

    const bubble = assistantBubble(page);
    await expect(bubble).toBeVisible({ timeout: 10_000 });
    await expect(bubble).toHaveAttribute("data-message", "trash");
    await expect(bubble).toContainText("Rescued from the Recycle Bin");
    await expect(bubble).toContainText(/WhatsApp|hey, got a minute/);
    await expect.poll(async () => (await whatsapp.boundingBox())!).toEqual(before);
    // Nothing was opened by the drop.
    expect(await popup).toBeNull();
    await expect(windows(page)).toHaveCount(0);
  });

  test("lasso over three icons → drop the group in the bin → all come back, cleanup line", async ({ page }) => {
    await gotoDesktop(page);
    const ids = ["linkedin", "github", "whatsapp"] as const;
    const boxes = await Promise.all(ids.map(async (id) => (await desktopIcon(page, id).boundingBox())!));
    const linkedin = boxes[0];
    const whatsapp = boxes[2];

    // From empty desktop right of the links column, up-left over the three links.
    await page.mouse.move(linkedin.x + linkedin.width + 40, 3);
    await page.mouse.down();
    await page.mouse.move(linkedin.x + linkedin.width / 2, whatsapp.y + whatsapp.height / 2, { steps: 10 });
    await expect(page.locator("[data-lasso]")).toBeVisible();
    await page.mouse.up();
    await expect(page.locator("[data-lasso]")).toHaveCount(0);
    for (const id of ids) await expect(desktopIcon(page, id)).toHaveAttribute("aria-selected", "true");
    await expect(desktopIcon(page, "email")).toHaveAttribute("aria-selected", "false");

    await dragToBin(page, desktopIcon(page, "github"));

    const notice = trashNotice(page);
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("Everything rescued");
    await expect(notice).toContainText("3");
    for (const [i, id] of ids.entries()) {
      await expect.poll(async () => (await desktopIcon(page, id).boundingBox())!).toEqual(boxes[i]);
    }
    await expect(windows(page)).toHaveCount(0);
    // CV and Contact stay one click away from the line.
    await expect(notice.locator('[data-assistant-action="downloadCv"]')).toBeVisible();
  });

  test("keyboard: Delete on the selected icon tells the same joke; the bin opens an empty window", async ({ page }) => {
    await gotoDesktop(page, "pt");
    await desktopIcon(page, "resume").focus();
    await page.keyboard.press("Delete");
    const notice = trashNotice(page);
    await expect(notice).toContainText("Resgatado da Lixeira");
    await expect(notice.locator('[data-assistant-action="downloadCv"]')).toBeVisible();
    await expect(desktopIcon(page, "resume")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(notice).toHaveCount(0);

    await recycleBin(page).click();
    const win = windowById(page, "recycle-bin");
    await expect(win).toBeVisible();
    await expect(win).toContainText("Esta pasta está vazia.");
  });

  test("right-click → Delete on an icon runs the rescue too", async ({ page }) => {
    await gotoDesktop(page);
    await desktopIcon(page, "linkedin").click({ button: "right" });
    await page.locator('[data-icon-menu-item="delete"]').click();
    await expect(trashNotice(page)).toContainText(/LinkedIn|linkedin\.url/);
    await expect(windows(page)).toHaveCount(0);
  });
});
