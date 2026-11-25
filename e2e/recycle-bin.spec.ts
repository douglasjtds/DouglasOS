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

/** Press on `from` and drag it so its press point lands on `to` (no bin expected). */
async function dragTo(page: Page, from: Locator, to: { x: number; y: number }) {
  const start = (await from.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + 20);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 - 30, start.y + 40, { steps: 5 });
  await page.mouse.move(to.x, to.y, { steps: 15 });
  await page.mouse.up();
}

test.describe("Recycle Bin + lasso", () => {
  test("dragging WhatsApp into the bin: mini Douglas rescues it to the same spot with its own line", async ({
    page,
  }) => {
    await gotoDesktop(page, "en", { assistant: true });
    // The bin defaults to the top-right corner of the desktop.
    const viewport = page.viewportSize()!;
    const binBox = (await recycleBin(page).boundingBox())!;
    expect(binBox.y).toBeLessThan(20);
    expect(binBox.x + binBox.width).toBeGreaterThan(viewport.width - 140);
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
    // Anchored below the top-right bin and fully on screen.
    const noticeBox = (await notice.boundingBox())!;
    const binBox = (await recycleBin(page).boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(noticeBox.y).toBeGreaterThan(binBox.y + binBox.height - 10);
    expect(noticeBox.x).toBeGreaterThanOrEqual(0);
    expect(noticeBox.x + noticeBox.width).toBeLessThanOrEqual(viewport.width);
    expect(noticeBox.y + noticeBox.height).toBeLessThanOrEqual(viewport.height);
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

  test("the bin drags to another cell (no joke, nothing opens) and still takes drops there", async ({ page }) => {
    await gotoDesktop(page);
    const before = (await recycleBin(page).boundingBox())!;
    const skills = (await desktopIcon(page, "skills").boundingBox())!;
    // Several columns right of Skills, same row.
    const target = { x: skills.x + skills.width / 2 + 88 * 5, y: skills.y + 20 };

    await dragTo(page, recycleBin(page), target);
    await expect
      .poll(async () => {
        const box = (await recycleBin(page).boundingBox())!;
        return Math.abs(box.y - skills.y) < 2 && Math.abs(box.x - (skills.x + 88 * 5)) < 2;
      })
      .toBe(true);
    await expect(trashNotice(page)).toHaveCount(0);
    await expect(windows(page)).toHaveCount(0);

    // Drop WhatsApp on the bin's new spot: the rescue runs there.
    const whatsapp = desktopIcon(page, "whatsapp");
    const home = (await whatsapp.boundingBox())!;
    await dragToBin(page, whatsapp);
    await expect(trashNotice(page)).toContainText(/WhatsApp|hey, got a minute/);
    await expect.poll(async () => (await whatsapp.boundingBox())!).toEqual(home);

    // The position survives a reload; the old top-right cell is free.
    await page.reload();
    await expect(recycleBin(page)).toBeVisible();
    const after = (await recycleBin(page).boundingBox())!;
    expect(Math.abs(after.x - (skills.x + 88 * 5))).toBeLessThan(2);
    expect(after.x).not.toBe(before.x);
  });
});
