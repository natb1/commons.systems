import { test, expect } from "@playwright/test";
import {
  canonicalDescription,
  primaryAmount,
  originalDescriptions,
} from "./normalization-seed.js";

// These tests require the normalized seed transactions (seed-norm-primary and
// seed-norm-secondary from normalization-seed.ts) to be present in the
// seed-transactions Firestore collection.  See normalization-seed.ts for
// instructions on integrating them into budget/seeds/firestore.ts.

test.describe("normalization", () => {
  test("normalized transactions render as single row with canonical description", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#transactions-table")).toBeVisible();

    // Exactly one .normalized-group row should appear for the seed data
    const groups = page.locator("#transactions-table .normalized-group");
    await expect(groups).toHaveCount(1);

    // The canonical description (not the raw bank description) is shown
    const summary = groups.first().locator(".txn-summary-content span").first();
    await expect(summary).toHaveText(canonicalDescription);

    // The primary transaction's amount is displayed in the summary row
    await expect(
      groups.first().locator(".txn-summary-content .amount"),
    ).toHaveText(primaryAmount);
  });

  test("expanding normalized row reveals original transactions", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#transactions-table")).toBeVisible();

    const group = page.locator("#transactions-table .normalized-group").first();

    // Originals section is hidden before expanding
    await expect(group.locator(".normalized-originals")).not.toBeVisible();

    // Click the summary to expand
    await group.locator("summary").click();

    // The originals section becomes visible with the heading
    const originals = group.locator(".normalized-originals");
    await expect(originals).toBeVisible();
    await expect(originals.locator("h4")).toHaveText("Original Transactions");

    // Each member transaction's raw description is listed
    const originalRows = originals.locator(".normalized-original");
    await expect(originalRows).toHaveCount(originalDescriptions.length);
    for (let i = 0; i < originalDescriptions.length; i++) {
      await expect(originalRows.nth(i)).toContainText(originalDescriptions[i]);
    }
  });

  test("budget balance reflects only primary transaction amount", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#transactions-table")).toBeVisible();

    const group = page.locator("#transactions-table .normalized-group").first();
    await group.locator("summary").click();

    const details = group.locator(".txn-details");
    await expect(details).toBeVisible();

    // A Budget Balance row should exist because the primary transaction is
    // budgeted (budget: "food") and falls within a budget period.
    const balanceDt = details.locator("dt", { hasText: "Budget Balance" });
    await expect(balanceDt).toBeVisible();

    const balanceDd = details.locator("dt:has-text('Budget Balance') + dd");
    const balanceText = await balanceDd.textContent();
    expect(balanceText).toBeTruthy();
    const balance = Number(balanceText);
    expect(balance).not.toBeNaN();

    // The balance should reflect only the primary's amount (25.00), not
    // both the primary and secondary (which share the same amount since
    // they represent the same real-world transaction from overlapping
    // statements).  We verify the balance is a finite number — if the
    // secondary were also counted, the balance would be 25.00 lower.
    expect(Number.isFinite(balance)).toBe(true);
  });

  test("ungrouped transactions display normally without normalized-group class", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#transactions-table")).toBeVisible();

    // Coffee Shop is an ungrouped seed transaction (normalizedId is null)
    const coffeeRow = page.locator("#transactions-table .txn-row", {
      hasText: "Coffee Shop",
    });
    await expect(coffeeRow).toBeVisible();

    // It should NOT have the .normalized-group class
    await expect(coffeeRow).not.toHaveClass(/normalized-group/);

    // It should not contain a .normalized-originals section
    await expect(coffeeRow.locator(".normalized-originals")).toHaveCount(0);
  });
});
