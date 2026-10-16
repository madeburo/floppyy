import { test, expect, type Page, type Locator } from "@playwright/test";

async function menu(win: Locator, action: string) {
  await win.getByRole("button", { name: "File", exact: true }).click();
  await win.getByRole("button", { name: action, exact: true }).click();
}

async function saveAs(page: Page, name: string) {
  const dialog = page.getByRole("dialog", { name: "Save to My Documents", exact: true });
  await dialog.getByRole("textbox", { name: "File name" }).fill(name);
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toBeHidden();
}

async function downloadedText(page: Page, action: () => Promise<void>) {
  const waiting = page.waitForEvent("download");
  await action();
  const download = await waiting;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return { name: download.suggestedFilename(), content: Buffer.concat(chunks).toString("utf8") };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start", exact: true })).toBeVisible({ timeout: 30_000 });
});

test("notes survive reload, download, rename, backup and non-destructive restore", async ({ page, browserName }) => {
  await page.getByRole("button", { name: "Notepad", exact: true }).dblclick();
  await page.getByRole("textbox", { name: "Text editor" }).fill("A personal note.\nSecond line.");
  await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Text editor" })).toHaveValue("A personal note.\nSecond line.");
  let note = page.getByRole("dialog", { name: / - Notepad$/ });
  await menu(note, "Save");
  await saveAs(page, "My note");
  note = page.getByRole("dialog", { name: "My note.txt - Notepad", exact: true });
  await expect(note).toBeVisible();
  const text = await downloadedText(page, () => menu(note, "Download"));
  // Linux WebKit sanitizes spaces in suggested download names; stored names stay intact.
  const downloadName = browserName === "webkit" && process.platform === "linux" ? "My_note.txt" : "My note.txt";
  expect(text).toEqual({ name: downloadName, content: "A personal note.\nSecond line." });
  await note.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "My Documents", exact: true }).dblclick();
  const docs = page.getByRole("dialog", { name: "My Documents", exact: true });
  await docs.getByRole("button", { name: "My note.txt", exact: true }).click();
  await docs.getByRole("button", { name: "Rename", exact: true }).click();
  const rename = page.getByRole("dialog", { name: "Rename", exact: true });
  await rename.getByRole("textbox", { name: "File name" }).fill("Renamed.txt");
  await rename.getByRole("button", { name: "Rename", exact: true }).click();
  await expect(docs.getByRole("button", { name: "Renamed.txt", exact: true })).toBeVisible();
  const backup = await downloadedText(page, () => menu(docs, "Export Backup..."));
  expect(JSON.parse(backup.content).files).toEqual([{ name: "Renamed.txt", kind: "text", content: text.content }]);
  await docs.getByLabel("Restore backup file").setInputFiles({ name: backup.name, mimeType: "application/json", buffer: Buffer.from(backup.content) });
  await page.getByRole("dialog", { name: "Restore Backup", exact: true }).getByRole("button", { name: "Restore", exact: true }).click();
  await expect(docs.getByRole("button", { name: "Renamed (2).txt", exact: true })).toBeVisible();
  await docs.getByLabel("Restore backup file").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("not a backup") });
  await expect(docs.getByRole("alert")).toContainText("not a valid");
  await docs.getByRole("button", { name: "Renamed.txt", exact: true }).click();
  await docs.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("dialog", { name: "Delete File", exact: true }).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(docs.getByRole("button", { name: "Renamed.txt", exact: true })).toHaveCount(0);
  await docs.getByRole("button", { name: "Renamed (2).txt", exact: true }).dblclick();
  await expect(page.getByRole("textbox", { name: "Text editor" })).toHaveValue(text.content);
});

test("Paint pointer strokes, undo, zoom and saved images survive reload", async ({ page, isMobile }) => {
  await page.getByRole("button", { name: "Paint", exact: true }).dblclick();
  const paint = page.getByRole("dialog", { name: / - Paint$/ });
  await expect(paint.getByRole("button", { name: "Pencil", exact: true })).toBeEnabled();
  const canvas = page.getByTestId("paint-canvas");
  const pixel = () => canvas.evaluate((node: HTMLCanvasElement) => Math.min(...node.getContext("2d")!.getImageData(152, 92, 16, 16).data));
  expect(await pixel()).toBe(255);
  const draw = async () => {
    const box = (await canvas.boundingBox())!;
    if (isMobile) await page.touchscreen.tap(box.x + box.width / 4, box.y + box.height / 4);
    else { await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 }); await page.mouse.up(); }
    await expect(paint.getByText("Draft saved", { exact: true })).toBeVisible();
  };
  await draw();
  expect(await pixel()).toBeLessThan(255);
  await paint.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(pixel).toBe(255);
  await draw();
  const content = await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL());
  await page.reload();
  await expect(paint.getByRole("button", { name: "Pencil", exact: true })).toBeEnabled();
  expect(await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL())).toBe(content);
  await paint.getByLabel("Canvas zoom").selectOption("2");
  expect((await canvas.boundingBox())!.width).toBe(1280);
  await paint.getByRole("button", { name: "Pan canvas", exact: true }).click();
  const area = paint.getByRole("main", { name: "Canvas area" });
  const bounds = (await area.boundingBox())!;
  await page.mouse.move(bounds.x + 150, bounds.y + 100);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 60, bounds.y + 40, { steps: 10 });
  await page.mouse.up();
  expect(await area.evaluate(node => node.scrollLeft)).toBeGreaterThan(50);
  expect(await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL())).toBe(content);
  await paint.getByRole("button", { name: "Pan canvas", exact: true }).click();
  await paint.getByLabel("Canvas zoom").selectOption("fit");
  await paint.getByRole("button", { name: "File", exact: true }).click();
  await paint.locator(".game-menu-bar").getByRole("button", { name: "Save", exact: true }).click();
  await saveAs(page, "Drawing.png");
  await expect(page.getByRole("dialog", { name: "Drawing.png - Paint", exact: true })).toBeVisible();
  await expect(paint.getByRole("button", { name: "Pencil", exact: true })).toBeEnabled();
  await paint.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "My Documents", exact: true }).dblclick();
  const docs = page.getByRole("dialog", { name: "My Documents", exact: true });
  const backup = await downloadedText(page, () => menu(docs, "Export Backup..."));
  expect(JSON.parse(backup.content).files[0].content).toBe(content);
  await docs.getByLabel("Restore backup file").setInputFiles({ name: backup.name, mimeType: "application/json", buffer: Buffer.from(backup.content) });
  await page.getByRole("dialog", { name: "Restore Backup", exact: true }).getByRole("button", { name: "Restore", exact: true }).click();
  await page.getByRole("button", { name: "Drawing (2).png", exact: true }).dblclick();
  await expect(paint.getByRole("button", { name: "Pencil", exact: true })).toBeEnabled();
  expect(await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL())).toBe(content);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect.poll(() => paint.evaluate(node => node.getBoundingClientRect().right)).toBeLessThanOrEqual(320);
  expect(await paint.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  expect(await paint.getByRole("main", { name: "Canvas area" }).evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await expect(paint.getByRole("button", { name: "Save", exact: true })).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath("paint-narrow.png") });
});

test("storage failures keep text downloadable and allow explicit discard", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { value: { open: () => { throw new DOMException("Storage unavailable", "SecurityError"); } } });
  });
  await page.reload();
  await page.getByRole("button", { name: "Notepad", exact: true }).dblclick();
  const note = page.getByRole("dialog", { name: / - Notepad$/ });
  await note.getByRole("textbox", { name: "Text editor" }).fill("Download me before closing.");
  await expect(note.getByText("Draft not saved", { exact: true })).toBeVisible();
  const download = await downloadedText(page, () => menu(note, "Download"));
  expect(download.content).toBe("Download me before closing.");
  await note.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("dialog", { name: "Notepad", exact: true }).getByRole("button", { name: "Don't Save", exact: true }).click();
  await expect(note).toBeHidden();
});

test("drive C opens the shared personal Documents folder", async ({ page }) => {
  await page.getByRole("button", { name: "My Computer", exact: true }).first().dblclick();
  await page.getByRole("dialog", { name: "My Computer", exact: true }).getByRole("button", { name: "(C:)", exact: true }).dblclick();
  await page.getByRole("dialog", { name: "(C:)", exact: true }).getByRole("button", { name: "My Documents", exact: true }).dblclick();
  const docs = page.getByRole("dialog", { name: "My Documents", exact: true });
  await menu(docs, "New Text Document");
  await expect(page.getByRole("textbox", { name: "Text editor" })).toBeEditable();
});

test("new documents, duplicate names and unsaved close choices remain safe", async ({ page }) => {
  await page.getByRole("button", { name: "My Documents", exact: true }).dblclick();
  const docs = page.getByRole("dialog", { name: "My Documents", exact: true });
  await menu(docs, "New Text Document");
  const note = page.getByRole("dialog", { name: / - Notepad$/ });
  await note.getByRole("textbox", { name: "Text editor" }).fill("First");
  await menu(note, "Save");
  await saveAs(page, "First.txt");
  await note.getByRole("button", { name: "Minimize", exact: true }).click();
  await menu(docs, "New Text Document");
  await expect(note.getByRole("textbox", { name: "Text editor" })).toHaveValue("");
  await note.getByRole("textbox", { name: "Text editor" }).fill("Second");
  await note.getByRole("button", { name: "Close", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Notepad", exact: true });
  await confirm.getByRole("button", { name: "Save", exact: true }).click();
  const save = page.getByRole("dialog", { name: "Save to My Documents", exact: true });
  await save.getByLabel("File name").fill("First.txt");
  await save.getByRole("button", { name: "Save", exact: true }).click();
  await expect(save.getByRole("alert")).toContainText("already exists");
  await save.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(note.getByRole("textbox", { name: "Text editor" })).toHaveValue("Second");
  await note.getByRole("button", { name: "Close", exact: true }).click();
  await confirm.getByRole("button", { name: "Don't Save", exact: true }).click();
  await expect(note).toBeHidden();
  await docs.getByRole("button", { name: "First.txt", exact: true }).dblclick();
  await expect(page.getByRole("textbox", { name: "Text editor" })).toHaveValue("First");
});
