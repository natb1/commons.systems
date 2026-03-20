import { test, expect } from "@playwright/test";
import { uploadFixture, triggerExportDownload } from "./helpers";

test.describe("export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 15000 });
  });

  test("export button not visible in seed data mode", async ({ page }) => {
    await expect(page.locator(".nav-local-info")).toBeHidden();
    await expect(page.locator(".export-data")).not.toBeVisible();
  });

  test("export button visible after upload", async ({ page }) => {
    await uploadFixture(page);
    await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".nav-local-info")).toBeVisible();
    await expect(page.locator(".export-data")).toBeVisible();
  });

  test("upload then export triggers download with correct filename @smoke", async ({ page }) => {
    await uploadFixture(page);
    await expect(page.locator(".export-data")).toBeVisible({ timeout: 10000 });

    const download = await triggerExportDownload(page);

    const today = new Date().toISOString().slice(0, 10);
    expect(download.suggestedFilename()).toBe(`budget-Test Household-${today}.json`);
  });

  test("round-trip: upload, edit note, export, re-upload, verify edit persists", async ({ page }) => {
    await uploadFixture(page);
    await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });

    // Edit a transaction note
    const noteInput = page.locator(".edit-note").first();
    await noteInput.fill("round-trip edit");
    await noteInput.blur();
    await expect.poll(
      async () => noteInput.evaluate((el: HTMLInputElement) => el.defaultValue),
      { timeout: 5000 },
    ).toBe("round-trip edit");

    // Export data
    const download = await triggerExportDownload(page);

    // Read the exported content
    const content = await (await download.createReadStream()).toArray();
    const json = Buffer.concat(content).toString();
    const exported = JSON.parse(json);
    expect(exported.groupName).toBe("Test Household");

    // Verify the edit is in the exported data
    const editedTxn = exported.transactions.find(
      (t: { note: string }) => t.note === "round-trip edit",
    );
    expect(editedTxn).toBeTruthy();

    // Clear data and re-upload the exported file
    await page.locator(".clear-data").click();
    await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 10000 });

    const fileInput = page.locator(".upload-input");
    await fileInput.setInputFiles({
      name: "re-upload.json",
      mimeType: "application/json",
      buffer: Buffer.from(json),
    });

    await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".edit-note").first()).toHaveValue("round-trip edit");
  });

  test("export with password produces encrypted file", async ({ page }) => {
    await uploadFixture(page);
    await expect(page.locator(".export-data")).toBeVisible({ timeout: 10000 });

    const download = await triggerExportDownload(page, "exportpass");

    const content = await (await download.createReadStream()).toArray();
    const buf = Buffer.concat(content);
    expect(buf.subarray(0, 4).toString()).toBe("BENC");
  });

  test("export without password produces plaintext JSON", async ({ page }) => {
    await uploadFixture(page);
    await expect(page.locator(".export-data")).toBeVisible({ timeout: 10000 });

    const download = await triggerExportDownload(page);

    const content = await (await download.createReadStream()).toArray();
    const text = Buffer.concat(content).toString();
    const parsed = JSON.parse(text);
    expect(parsed.version).toBe(1);
    expect(parsed.groupName).toBe("Test Household");
  });
});
