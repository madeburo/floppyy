import { test, expect, type Page } from "@playwright/test";

async function gameMenu(page: Page) {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const menu = page.getByRole("navigation", { name: "Start menu" });
  await menu.getByRole("button", { name: /^Games/ }).click();
  return menu;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start", exact: true })).toBeVisible({ timeout: 30_000 });
});

test("Notepad protects text and Save downloads it before New", async ({ page }) => {
  await page.getByRole("button", { name: "Notepad", exact: true }).dblclick();
  const win = page.getByRole("dialog", { name: "Untitled - Notepad", exact: true });
  const editor = win.getByRole("textbox", { name: "Text editor" });
  await editor.fill("Keep this regression draft.");
  await win.getByRole("button", { name: "Close", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Notepad", exact: true });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editor).toHaveValue("Keep this regression draft.");
  await win.getByRole("button", { name: "File", exact: true }).click();
  await win.getByRole("button", { name: "New", exact: true }).click();
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("Untitled.txt");
  await expect(editor).toHaveValue("");
});

test("all Start games remain reachable and Checkers can move", async ({ page }) => {
  const menu = await gameMenu(page);
  const last = menu.getByRole("button", { name: "Checkers", exact: true });
  await last.scrollIntoViewIfNeeded();
  const box = await last.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height - 28);
  await last.click();
  await page.getByRole("button", { name: "Square 41, white piece", exact: true }).click();
  await page.getByRole("button", { name: "Square 34", exact: true }).click();
  await expect(page.getByRole("button", { name: "Square 34, white piece", exact: true })).toBeVisible();
});

test("minimized games do not consume editor arrow keys", async ({ page }) => {
  const menu = await gameMenu(page);
  await menu.getByRole("button", { name: "Snake", exact: true }).click();
  await page.getByRole("dialog", { name: "Snake", exact: true }).getByRole("button", { name: "Minimize" }).click();
  await page.getByRole("button", { name: "Notepad", exact: true }).dblclick();
  const editor = page.getByRole("textbox", { name: "Text editor" });
  await editor.fill("abcde");
  await editor.press("End");
  await editor.press("ArrowLeft");
  expect(await editor.evaluate((node: HTMLTextAreaElement) => node.selectionStart)).toBe(4);
});

test("Typing Tutor clock advances during continuous input", async ({ page }) => {
  const menu = await gameMenu(page);
  await menu.getByRole("button", { name: "Typing Tutor", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Type the word" });
  await input.pressSequentially("zzzzzzzzzzzzzzzzzzzz", { delay: 150 });
  const label = await page.getByText(/^Time: \d+s$/).innerText();
  expect(Number(label.match(/\d+/)![0])).toBeLessThanOrEqual(43);
});

test("Solitaire fits narrow viewports without a grey footer", async ({ page }) => {
  await page.getByRole("button", { name: "Solitaire", exact: true }).dblclick();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 568 });
    const table = page.getByTestId("solitaire-table");
    await expect(table).toBeVisible();
    await expect.poll(() => table.evaluate(node => node.closest('[role="dialog"]')!.getBoundingClientRect().right)).toBeLessThanOrEqual(width);
    await expect.poll(() => table.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
    const geometry = await table.evaluate(node => {
      const win = node.closest('[role="dialog"]')!;
      return { gap: win.getBoundingClientRect().bottom - node.nextElementSibling!.getBoundingClientRect().bottom, right: win.getBoundingClientRect().right, images: [...node.querySelectorAll("img")].every(image => image.complete && image.naturalWidth > 0) };
    });
    expect(geometry.gap).toBeLessThanOrEqual(10);
    expect(geometry.right).toBeLessThanOrEqual(width);
    expect(geometry.images).toBe(true);
  }
});

test("open windows reflow after a desktop-to-phone resize", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Notepad", exact: true }).dblclick();
  await page.setViewportSize({ width: 320, height: 568 });
  const close = page.getByRole("dialog", { name: "Untitled - Notepad", exact: true }).getByRole("button", { name: "Close", exact: true });
  const box = await close.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await close.click();
  await expect(page.getByRole("dialog", { name: "Untitled - Notepad", exact: true })).toBeHidden();
});

test("Display Properties keeps actions reachable and persists the wait setting", async ({ page }) => {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const menu = page.getByRole("navigation", { name: "Start menu" });
  await menu.getByRole("button", { name: /^Settings/ }).click();
  await menu.getByRole("button", { name: "Display Settings", exact: true }).click();
  const win = page.getByRole("dialog", { name: "Display Properties", exact: true });
  await win.getByRole("button", { name: "Screen Saver", exact: true }).click();
  await win.getByRole("spinbutton", { name: "Screen saver wait in minutes" }).fill("5");
  await win.getByRole("button", { name: "Apply", exact: true }).click();
  await win.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await menu.getByRole("button", { name: /^Settings/ }).click();
  await menu.getByRole("button", { name: "Display Settings", exact: true }).click();
  await win.getByRole("button", { name: "Screen Saver", exact: true }).click();
  await expect(win.getByRole("spinbutton", { name: "Screen saver wait in minutes" })).toHaveValue("5");
  const rect = await win.getByRole("button", { name: "OK", exact: true }).boundingBox();
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height - 28);
});
