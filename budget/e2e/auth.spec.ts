import { test, expect } from "@playwright/test";
import { signIn } from "@commons-systems/authutil/e2e/sign-in";

test.describe("auth", () => {
  test("seed data visible when not signed in", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#seed-data-notice")).toBeVisible();
    const rows = page.locator("#transactions-table .txn-row");
    await expect(rows).toHaveCount(3);
  });

  test("nav shows sign-in link when not signed in", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#sign-in")).toBeVisible();
    await expect(page.locator("#sign-out")).not.toBeVisible();
  });

  test("nav shows user display and sign-out after sign-in", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#sign-out")).toBeVisible();
    await expect(page.locator("#user-display")).toContainText("natb1");
  });

  test("authorized user sees own transactions with inline editing", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#transactions-table")).toBeVisible();
    await expect(page.locator("#seed-data-notice")).toHaveCount(0);
    const rows = page.locator("#transactions-table .txn-row");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("Hotel Stay");
    await expect(rows.nth(1)).toContainText("Grocery Store");
    // Verify inline edit inputs are present
    await expect(page.locator(".edit-note")).toHaveCount(2);
    await expect(page.locator(".edit-category")).toHaveCount(2);
    await expect(page.locator(".edit-reimbursement")).toHaveCount(2);
    await expect(page.locator(".edit-budget")).toHaveCount(2);
  });

  test("budget input has datalist with autocomplete options", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#transactions-table")).toBeVisible();
    // Datalist should exist with budget options
    const datalist = page.locator("#budget-options");
    await expect(datalist).toBeAttached();
    const options = datalist.locator("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    // Budget input should reference the datalist
    const budgetInput = page.locator(".edit-budget").first();
    await expect(budgetInput).toHaveAttribute("list", "budget-options");
  });

  test("category input has datalist with autocomplete options", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#transactions-table")).toBeVisible();
    // Category datalist should exist
    const datalist = page.locator("#category-options");
    await expect(datalist).toBeAttached();
    const options = datalist.locator("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    // Category input should reference the datalist
    const categoryInput = page.locator(".edit-category").first();
    await expect(categoryInput).toHaveAttribute("list", "category-options");
  });

  test("expanded details show group name for authorized user", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#transactions-table")).toBeVisible();
    // Open the first row
    const firstRow = page.locator("#transactions-table .txn-row").first();
    await firstRow.locator("summary").click();
    // Verify group name is displayed
    await expect(firstRow.locator(".txn-details")).toContainText("household");
  });

  test("inline edit saves and persists", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#transactions-table")).toBeVisible();
    // Open the first row to access the edit-note input in summary
    const noteInput = page.locator(".edit-note").first();
    await noteInput.fill("test note update");
    await noteInput.blur();
    // Wait for the save to complete
    await page.waitForTimeout(500);
    // Reload and verify persistence
    await page.reload();
    await expect(page.locator("#transactions-table")).toBeVisible();
    await expect(page.locator(".edit-note").first()).toHaveValue("test note update");
  });

  test("sign-out returns to seed data view", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#sign-out")).toBeVisible();
    await page.locator("#sign-out").click();
    await page.waitForSelector("#sign-in");
    await expect(page.locator("#seed-data-notice")).toBeVisible();
    const rows = page.locator("#transactions-table .txn-row");
    await expect(rows).toHaveCount(3);
  });
});
