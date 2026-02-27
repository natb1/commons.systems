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
    await expect(rows.nth(0)).toContainText("Grocery Store");
    await expect(rows.nth(1)).toContainText("Hotel Stay");
    // Verify inline edit inputs are present
    await expect(page.locator(".edit-note")).toHaveCount(2);
    await expect(page.locator(".edit-category")).toHaveCount(2);
    await expect(page.locator(".edit-reimbursement")).toHaveCount(2);
    await expect(page.locator(".edit-budget")).toHaveCount(2);
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
