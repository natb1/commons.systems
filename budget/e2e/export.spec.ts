import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "test-budget.json");

async function uploadFixture(page: import("@playwright/test").Page): Promise<void> {
  const fileInput = page.locator(".upload-input");
  await fileInput.setInputFiles(fixturePath);
}

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

    const downloadPromise = page.waitForEvent("download");
    await page.locator(".export-data").click();
    const download = await downloadPromise;

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
    const downloadPromise = page.waitForEvent("download");
    await page.locator(".export-data").click();
    const download = await downloadPromise;

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
});
