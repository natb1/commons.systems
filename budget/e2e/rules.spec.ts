import { test, expect } from "@playwright/test";
import { signIn } from "@commons-systems/authutil/e2e/sign-in";

test.describe("rules", () => {
  test("page loads without JS errors @smoke", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));
    await page.goto("/#/rules");
    await page.waitForLoadState("load");
    expect(errors).toHaveLength(0);
  });

  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/#/rules");
    await expect(page.locator("main h2")).toHaveText("Rules", { timeout: 30000 });
    await expect(page.locator("#rules-error")).toHaveCount(0);
  });

  test("seed rules visible and read-only", async ({ page }) => {
    await page.goto("/#/rules");
    await expect(page.locator("#rules-table")).toBeVisible();
    const rows = page.locator("#rules-table .rule-row");
    await expect(rows.first()).toBeVisible();
    // Seed data renders disabled inputs instead of plain text
    const inputs = page.locator("#rules-table input");
    for (const input of await inputs.all()) {
      await expect(input).toBeDisabled();
    }
  });

  test("rules table displays correct column headers", async ({ page }) => {
    await page.goto("/#/rules");
    await expect(page.locator("#rules-table")).toBeVisible();
    // Headers only visible on medium+ screens
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 768) {
      const header = page.locator("#rules-table .rule-header");
      await expect(header).toBeVisible();
      await expect(header.locator("span").nth(0)).toHaveText("Pattern");
      await expect(header.locator("span").nth(1)).toHaveText("Target");
      await expect(header.locator("span").nth(2)).toHaveText("Priority");
      await expect(header.locator("span").nth(3)).toHaveText("Institution");
      await expect(header.locator("span").nth(4)).toHaveText("Account");
    }
  });

  test("seed data renders all six example rules with filter", async ({ page }) => {
    await page.goto("/#/rules");
    await expect(page.locator("#rules-table")).toBeVisible();
    // All 6 rows exist in the DOM
    const allRows = page.locator("#rules-table .rule-row");
    await expect(allRows).toHaveCount(6);
    // Default filter is "categorization" — 3 visible
    const visibleCatRows = page.locator('#rules-table .rule-row[data-rule-type="categorization"]');
    await expect(visibleCatRows).toHaveCount(3);
    // Switch to budget_assignment
    await page.selectOption("#rule-type-filter", "budget_assignment");
    const visibleBudgetRows = page.locator('#rules-table .rule-row[data-rule-type="budget_assignment"]');
    await expect(visibleBudgetRows).toHaveCount(3);
  });

  test("seed rules show expected content", async ({ page }) => {
    await page.goto("/#/rules");
    await expect(page.locator("#rules-table")).toBeVisible();

    // Default filter: categorization (sorted by priority then pattern)
    const catRows = page.locator('#rules-table .rule-row[data-rule-type="categorization"]');
    await expect(catRows).toHaveCount(3);
    await expect(catRows.nth(0).locator(".edit-pattern")).toHaveValue("coffee");
    await expect(catRows.nth(0).locator(".edit-target")).toHaveValue("Food:Coffee");
    await expect(catRows.nth(1).locator(".edit-pattern")).toHaveValue("electric");
    await expect(catRows.nth(1).locator(".edit-target")).toHaveValue("Housing:Utilities:Electric");
    await expect(catRows.nth(1).locator(".edit-institution")).toHaveValue("Example Bank");
    await expect(catRows.nth(1).locator(".edit-account")).toHaveValue("Credit Card");
    await expect(catRows.nth(2).locator(".edit-pattern")).toHaveValue("restaurant");
    await expect(catRows.nth(2).locator(".edit-target")).toHaveValue("Food:Dining");

    // Switch to budget_assignment
    await page.selectOption("#rule-type-filter", "budget_assignment");
    const budgetRows = page.locator('#rules-table .rule-row[data-rule-type="budget_assignment"]');
    await expect(budgetRows).toHaveCount(3);
    await expect(budgetRows.nth(0).locator(".edit-pattern")).toHaveValue("food");
    await expect(budgetRows.nth(1).locator(".edit-pattern")).toHaveValue("housing");
    await expect(budgetRows.nth(2).locator(".edit-pattern")).toHaveValue("travel");
    await expect(budgetRows.nth(2).locator(".edit-institution")).toHaveValue("Example Credit Union");
    await expect(budgetRows.nth(2).locator(".edit-account")).toHaveValue("Savings");
  });

  test("unauthenticated user sees seed data notice", async ({ page }) => {
    await page.goto("/#/rules");
    await expect(page.locator("#seed-data-notice")).toBeVisible();
    await expect(page.locator("#seed-data-notice")).toContainText("Sign in");
  });

  test("unauthenticated user sees no add or delete buttons", async ({ page }) => {
    await page.goto("/#/rules");
    await expect(page.locator("#rules-table")).toBeVisible();
    await expect(page.locator("#add-rule")).toHaveCount(0);
    await expect(page.locator(".delete-rule")).toHaveCount(0);
  });

  test("authenticated user sees editable inputs and controls", async ({ page }) => {
    await page.goto("/#/rules");
    await signIn(page);
    await expect(page.locator("#rules-table")).toBeVisible();
    await expect(page.locator("#seed-data-notice")).toHaveCount(0);

    // Authenticated view renders inputs for inline editing
    const rows = page.locator("#rules-table .rule-row");
    await expect(rows).toHaveCount(6);
    await expect(page.locator(".edit-pattern")).toHaveCount(6);
    await expect(page.locator(".edit-target")).toHaveCount(6);
    await expect(page.locator(".edit-priority")).toHaveCount(6);
    await expect(page.locator(".edit-institution")).toHaveCount(6);
    await expect(page.locator(".edit-account")).toHaveCount(6);
    await expect(page.locator("#add-rule")).toBeVisible();
    await expect(page.locator(".delete-rule")).toHaveCount(6);
  });

  test("clicking rules nav link navigates to rules page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Transactions");
    await page.click('app-nav a[href="#/rules"]');
    await expect(page.locator("main h2")).toHaveText("Rules");
  });

  test("direct URL to #/rules loads rules page", async ({ page }) => {
    await page.goto("/#/rules");
    await expect(page.locator("main h2")).toHaveText("Rules");
  });
});
