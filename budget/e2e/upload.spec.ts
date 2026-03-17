import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(__dirname, "fixtures", "test-budget.json");

async function uploadFixture(page: import("@playwright/test").Page): Promise<void> {
  const fileInput = page.locator(".upload-input");
  await fileInput.setInputFiles(fixturePath);
}

test.describe("upload", () => {
  test.beforeEach(async ({ page }) => {
    // Playwright creates a fresh browser context per test, so IDB is already empty.
    await page.goto("/transactions");
    await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 15000 });
  });

  test("upload valid JSON renders transactions @smoke", async ({ page }) => {
    await uploadFixture(page);
    await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#seed-data-notice")).toHaveCount(0);
    const rows = page.locator("#transactions-table .txn-row");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("AMAZON");
    await expect(rows.nth(1)).toContainText("KROGER #1234");
    // Verify group name appears in nav
    await expect(page.locator(".local-group-name")).toHaveText("Test Household");
  });

  test("upload then edit note persists across reload", async ({ page }) => {
    await uploadFixture(page);
    await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });
    const noteInput = page.locator(".edit-note").first();
    await noteInput.fill("edited via test");
    await noteInput.blur();
    // Wait for IDB save — the blur handler sets defaultValue after successful write
    await expect.poll(
      async () => noteInput.evaluate((el: HTMLInputElement) => el.defaultValue),
      { timeout: 5000 },
    ).toBe("edited via test");
    await page.reload();
    await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".edit-note").first()).toHaveValue("edited via test");
  });

  test("upload then clear data returns to seed view", async ({ page }) => {
    await uploadFixture(page);
    await expect(page.locator(".local-group-name")).toHaveText("Test Household", { timeout: 10000 });
    await page.locator(".clear-data").click();
    await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 10000 });
    // Upload UI should reappear
    await expect(page.locator(".upload-label")).toBeVisible();
  });

  test("upload invalid JSON shows error", async ({ page }) => {
    const fileInput = page.locator(".upload-input");
    // Create a temporary file with invalid JSON content
    await fileInput.setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("not valid json {{{"),
    });
    await expect(page.locator(".upload-error")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".upload-error")).toContainText("Invalid JSON");
  });

  test("upload JSON with wrong version shows error", async ({ page }) => {
    const fileInput = page.locator(".upload-input");
    const badVersion = JSON.stringify({
      version: 99,
      exportedAt: "2025-01-01T00:00:00Z",
      groupId: "g",
      groupName: "G",
      transactions: [],
      budgets: [],
      budgetPeriods: [],
      rules: [],
      normalizationRules: [],
    });
    await fileInput.setInputFiles({
      name: "bad-version.json",
      mimeType: "application/json",
      buffer: Buffer.from(badVersion),
    });
    await expect(page.locator(".upload-error")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".upload-error")).toContainText("Unsupported version");
  });
});
