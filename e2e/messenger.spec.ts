import { test, expect } from "@playwright/test";
import { gotoDesktop, messengerToast, messengerTray, startButton, startItem, windowById } from "./helpers";

/** Decode one query parameter of a mailto:/wa.me link. */
function param(href: string, name: string): string | null {
  const query = href.slice(href.indexOf("?") + 1);
  for (const pair of query.split("&")) {
    const [key, value = ""] = pair.split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}

test.describe("DouglasOS Messenger", () => {
  test('tray → conversation → "cv" downloads the PDF → leave a message builds the mailto link', async ({ page }) => {
    await gotoDesktop(page);

    await messengerTray(page).click();
    const messenger = windowById(page, "messenger");
    await expect(messenger).toBeVisible();
    await messenger.locator('[data-messenger-contact="douglas"]').click();

    // The opening lines (instant under the reduced motion gotoDesktop sets).
    const log = messenger.getByRole("log");
    await expect(log).toContainText("Hi! I saw you're looking around my portfolio");
    await expect(messenger.locator("[data-messenger-disclaimer]")).toBeVisible();

    const field = messenger.getByLabel("Your message");
    await field.fill("cv");
    await field.press("Enter");
    await expect(log).toContainText("You say:");
    const cvLink = log.locator('[data-messenger-action="downloadCv"]').last();
    await expect(cvLink).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await cvLink.click();
    expect((await downloadPromise).suggestedFilename()).toContain(".pdf");

    await messenger.locator('[data-quick-reply="leaveMessage"]').click();
    const form = messenger.locator("[data-messenger-form]");
    await expect(form).toBeVisible();
    await form.getByLabel("Your name (optional)").fill("Ana Recruiter");
    await form.getByLabel("Message").fill("Hi Douglas! Are you open to a remote role?\nCheers");

    const href = (await form.locator('[data-messenger-send-via="email"]').getAttribute("href"))!;
    expect(href).toMatch(/^mailto:[^?]+@[^?]+\?subject=/);
    expect(param(href, "subject")).toBe("Ana Recruiter, via the DouglasOS Messenger");
    expect(param(href, "body")).toBe(
      "Hi Douglas,\r\n\r\nHi Douglas! Are you open to a remote role?\r\nCheers\r\n\r\nAna Recruiter\r\n(Sent from the DouglasOS Messenger)",
    );
    const wa = (await form.locator('[data-messenger-send-via="whatsapp"]').getAttribute("href"))!;
    expect(wa).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(param(wa, "text")).toContain("Are you open to a remote role?\nCheers");

    // Esc closes the form, then (from the composer) the window.
    await form.getByLabel("Message").press("Escape");
    await expect(form).toHaveCount(0);
    await field.press("Escape");
    await expect(messenger).toHaveCount(0);

    // Same session: the history is still there when it reopens.
    await messengerTray(page).click();
    await expect(windowById(page, "messenger").getByRole("log")).toContainText("looking around my portfolio");
  });

  test("Portuguese: Start menu → All Programs → Messenger, free text in PT, honest fallback", async ({ page }) => {
    await gotoDesktop(page, "pt");
    await startButton(page).click();
    await startItem(page, "all-programs").hover();
    await page.locator('[data-program="messenger"]').click();
    const messenger = windowById(page, "messenger");
    await messenger.locator('[data-messenger-contact="douglas"]').click();
    const log = messenger.getByRole("log");
    await expect(log).toContainText("Oi! Vi que você está olhando meu portfólio");

    const field = messenger.getByLabel("Sua mensagem");
    await field.fill("Você trabalha remoto?");
    await field.press("Enter");
    await expect(log).toContainText("Moro em Lagoa Santa");

    await field.fill("qual é o seu signo?");
    await field.press("Enter");
    await expect(log).toContainText("Essa eu vou ter que responder pessoalmente");
    await log.locator('[data-messenger-action="leaveMessage"]').last().click();
    await expect(messenger.locator("[data-messenger-form]")).toBeVisible();
  });

  test("the toast shows once per session and opens the conversation", async ({ page }) => {
    test.setTimeout(60_000);
    await gotoDesktop(page, "en", { messengerToast: true });
    const toast = messengerToast(page);
    await expect(toast).toBeVisible({ timeout: 30_000 });
    await expect(toast).toContainText("Douglas says:");
    // It never takes focus.
    await expect(page.locator("[data-messenger-toast] :focus")).toHaveCount(0);
    await toast.locator("[data-messenger-toast-open]").click();
    await expect(windowById(page, "messenger").getByRole("log")).toContainText("looking around my portfolio");

    await page.reload();
    await page.waitForTimeout(1000);
    await expect(toast).toHaveCount(0);
  });

  test("nudge shakes the window (motion allowed) and is answered", async ({ page }) => {
    await gotoDesktop(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    await messengerTray(page).click();
    const messenger = windowById(page, "messenger");
    await messenger.locator('[data-messenger-contact="douglas"]').click();
    await expect(messenger.locator("[data-messenger-typing]")).toBeVisible();
    await expect(messenger.getByRole("log")).toContainText("looking around my portfolio", { timeout: 8000 });

    await messenger.locator("[data-messenger-nudge]").click();
    await expect(messenger.getByRole("log")).toContainText("You sent a nudge.");
    await expect(messenger.getByRole("log")).toContainText("I'm here, I'm here", { timeout: 8000 });
    await messenger.locator("[data-messenger-nudge]").click();
    await expect(messenger.getByRole("log")).toContainText("Wait a few seconds before nudging again.");
  });
});
