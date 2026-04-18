import { test, expect } from "@playwright/test";
import { uploadIncomeStatementFixture } from "./helpers";

test.describe("accounts income statement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions");
    // Wait for the seed data notice so the upload input is ready.
    await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 15000 });
    await uploadIncomeStatementFixture(page);
    // Upload replaces seed data — wait for the notice to clear before navigating.
    await expect(page.locator("#seed-data-notice")).toHaveCount(0, { timeout: 15000 });
    await page.goto("/accounts");
    await expect(page.locator("#accounts-table")).toBeVisible({ timeout: 10000 });
  });

  test("income statement section is visible", async ({ page }) => {
    await expect(page.locator("#accounts-income-statement")).toBeVisible();
  });

  test("income statement table has current, prior, and YoY column headers", async ({ page }) => {
    const headers = page.locator("#accounts-income-table thead");
    await expect(headers).toBeVisible();
    const headerText = await headers.textContent();
    // Expect three "Mon YYYY" month labels to appear in the header row.
    const matches = headerText?.match(/\b[A-Z][a-z]{2} \d{4}\b/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  test("income statement includes income and expense categories from fixture", async ({ page }) => {
    await expect(page.locator("#accounts-income-table tbody")).toContainText("Income");
    await expect(page.locator("#accounts-expenses-table tbody")).toContainText("Food");
    await expect(page.locator("#accounts-expenses-table tbody")).toContainText("Housing");
  });

  test("transfer categories do not appear as income or expense rows", async ({ page }) => {
    await expect(page.locator("#accounts-income-table tbody")).not.toContainText("Transfer");
    await expect(page.locator("#accounts-expenses-table tbody")).not.toContainText("Transfer");
  });

  test("cash flow summary section is visible with operating, transfers, and net change rows", async ({ page }) => {
    await expect(page.locator("#accounts-cash-flow-summary")).toBeVisible();
    const tbody = page.locator("#accounts-cash-flow-table tbody");
    await expect(tbody).toContainText("Operating");
    await expect(tbody).toContainText("Transfers");
    await expect(tbody).toContainText("Net change");
  });

  test("savings rate row is visible", async ({ page }) => {
    const tbody = page.locator("#accounts-net-income-table tbody");
    await expect(tbody).toContainText("Savings rate");
    const text = await tbody.textContent();
    expect(text).toMatch(/\d+\.\d%/);
  });

  test("income statement renders above the charts", async ({ page }) => {
    const isBox = await page.locator("#accounts-income-statement").boundingBox();
    const chartBox = await page.locator("#accounts-trend-chart").boundingBox();
    expect(isBox).not.toBeNull();
    expect(chartBox).not.toBeNull();
    expect(isBox!.y).toBeLessThan(chartBox!.y);
  });
});
