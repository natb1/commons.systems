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
    await expect(page.locator(".edit-note")).toHaveCount(2);
    await expect(page.locator(".edit-category")).toHaveCount(2);
    await expect(page.locator(".edit-reimbursement")).toHaveCount(2);
    await expect(page.locator(".edit-budget")).toHaveCount(2);
  });

  test("budget input shows autocomplete dropdown on focus", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#transactions-table")).toBeVisible();
    // Open a row — click the description text (not an input) to toggle
    const firstRow = page.locator("#transactions-table .txn-row").first();
    await firstRow.locator(".txn-summary-content span").first().click();
    await expect(firstRow.locator(".txn-details")).toBeVisible();
    const budgetInput = firstRow.locator(".edit-budget");
    await budgetInput.focus(); // use focus() to avoid pointer-event interception on mobile
    await expect(page.locator(".autocomplete-dropdown")).toBeVisible();
    const items = page.locator(".autocomplete-item");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test("category input shows autocomplete dropdown on focus", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#transactions-table")).toBeVisible();
    const categoryInput = page.locator(".edit-category").first();
    await categoryInput.click();
    await expect(page.locator(".autocomplete-dropdown")).toBeVisible();
    const items = page.locator(".autocomplete-item");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test("expanded details show group name for authorized user", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#transactions-table")).toBeVisible();
    // Open the first row — click the description text (not an input)
    const firstRow = page.locator("#transactions-table .txn-row").first();
    await firstRow.locator(".txn-summary-content span").first().click();
    await expect(firstRow.locator(".txn-details")).toBeVisible();
    await expect(firstRow.locator(".txn-details")).toContainText("household");
  });

  test("inline edit saves and persists", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#transactions-table")).toBeVisible();
    const noteInput = page.locator(".edit-note").first();
    await noteInput.fill("test note update");
    await noteInput.blur();
    // Wait for async Firestore save to complete before reloading.
    // The blur handler sets input.defaultValue = input.value only after a successful save.
    await expect.poll(
      async () => noteInput.evaluate((el: HTMLInputElement) => el.defaultValue),
      { timeout: 5000 },
    ).toBe("test note update");
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
