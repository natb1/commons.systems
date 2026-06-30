import { test, expect } from "@commons-systems/config/playwright-test";
import { uploadFixture } from "./helpers";

test.describe("accounts reconcile view", () => {
  test("navigating from accounts page reaches the reconcile view with query prefilled", async ({ page }) => {
    await page.goto("/accounts");
    await expect(page.locator("#accounts-table")).toBeVisible({ timeout: 10000 });

    const reconcileLink = page.locator("a.reconcile-link").first();
    await expect(reconcileLink).toBeVisible();
    await reconcileLink.click();

    await expect(page).toHaveURL(/\/accounts\/reconcile\?institution=.+&account=.+&period=.+/);
    await expect(page.locator("#reconcile-container")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#reconcile-controls")).toBeVisible();
  });

  test("renders the journal-leg list for a seeded account/period", async ({ page }) => {
    await page.goto(
      "/accounts/reconcile?institution=Example%20Bank&account=Checking&period=2025-02",
    );
    await expect(page.locator("#reconcile-container")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#reconcile-leg-list")).toBeVisible();
    await expect(page.locator("#reconcile-leg-list .reconcile-leg").first()).toBeVisible();
    await expect(page.locator("#reconcile-header")).toBeVisible();
    await expect(page.locator(".reconcile-cleared-balance")).toBeVisible();
    await expect(page.locator("#reconcile-open-dialog")).toBeVisible();
  });

  test("happy-path reconcile: clear all legs, match the bank balance, finalize", async ({ page }) => {
    // Upload mode is writable; seed mode would throw "Seed data is read-only"
    // on the reconcile write. The fixture seeds a `Test Bank` / `Checking`
    // asset account with three uncleared legs in `2025-03` totalling 250.
    await page.goto("/transactions");
    await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 15000 });
    await uploadFixture(page);
    await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });
    // Wait for the local-mode transition (IDB meta write) before navigating away.
    await expect(page.locator(".local-group-name")).toHaveText("Test Household", { timeout: 10000 });

    await page.goto(
      "/accounts/reconcile?institution=Test%20Bank&account=Checking&period=2025-03",
    );
    await expect(page.locator("#reconcile-container")).toBeVisible({ timeout: 10000 });

    const legRows = page.locator("#reconcile-leg-list .reconcile-leg");
    await expect(legRows).toHaveCount(3);

    // Clear every leg. After all three: cleared balance = 100 + 200 - 50 = 250.
    // The hydrate handler stamps `data-cleared-saved` once the IDB write settles.
    const checkboxes = page.locator("#reconcile-leg-list .reconcile-cleared-checkbox");
    for (let i = 0; i < 3; i++) {
      await checkboxes.nth(i).check();
      await expect(legRows.nth(i)).toHaveAttribute("data-cleared-saved", "true", { timeout: 5000 });
    }
    await expect(page.locator(".reconcile-cleared-balance")).toContainText("250");

    // Reload to confirm every cleared toggle persisted to IDB before reconciling.
    await page.reload();
    await expect(page.locator("#reconcile-leg-list")).toBeVisible({ timeout: 10000 });
    const reloadedCheckboxes = page.locator("#reconcile-leg-list .reconcile-cleared-checkbox");
    await expect(reloadedCheckboxes).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(reloadedCheckboxes.nth(i)).toBeChecked();
    }
    await expect(page.locator(".reconcile-cleared-balance")).toContainText("250");

    // No past reconciliations yet.
    await expect(page.locator("#reconcile-past .reconcile-past-event")).toHaveCount(0);

    // Open the dialog; the bank-balance input defaults to the statement balance.
    await page.locator("#reconcile-open-dialog").click();
    const dialog = page.locator("#reconcile-dialog");
    await expect(dialog).toBeVisible();
    const bankInput = page.locator("#reconcile-bank-balance-input");
    await bankInput.fill("250");

    await page.locator("#reconcile-submit").click();

    // On match the dialog closes and the page reloads with the finalized event.
    await expect(dialog).toBeHidden();
    await expect(page.locator("#reconcile-past .reconcile-past-event")).toHaveCount(1);

    // Reconciled legs render disabled — their cleared flag is now terminal.
    const reconciledCheckboxes = page.locator("#reconcile-leg-list .reconcile-cleared-checkbox");
    await expect(reconciledCheckboxes).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(reconciledCheckboxes.nth(i)).toBeDisabled();
      await expect(reconciledCheckboxes.nth(i)).toBeChecked();
    }
  });

  test("manual-resolve path: mismatch, adjust cleared selections, then match", async ({ page }) => {
    // Upload mode is writable; seed mode would throw "Seed data is read-only"
    // on the reconcile write. The fixture seeds a `Test Bank` / `Checking`
    // asset account with three uncleared legs in `2025-03` totalling 250.
    await page.goto("/transactions");
    await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 15000 });
    await uploadFixture(page);
    await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".local-group-name")).toHaveText("Test Household", { timeout: 10000 });

    await page.goto(
      "/accounts/reconcile?institution=Test%20Bank&account=Checking&period=2025-03",
    );
    await expect(page.locator("#reconcile-container")).toBeVisible({ timeout: 10000 });

    const legRows = page.locator("#reconcile-leg-list .reconcile-leg");
    await expect(legRows).toHaveCount(3);

    // Check index 0 (+100) and index 1 (+200). Cleared balance = 300.
    const checkboxes = page.locator("#reconcile-leg-list .reconcile-cleared-checkbox");
    for (let i = 0; i < 2; i++) {
      await checkboxes.nth(i).check();
      await expect(legRows.nth(i)).toHaveAttribute("data-cleared-saved", "true", { timeout: 5000 });
    }
    await expect(page.locator(".reconcile-cleared-balance")).toContainText("300");

    // Open dialog; bank-balance input defaults to statement balance (250).
    await page.locator("#reconcile-open-dialog").click();
    const dialog = page.locator("#reconcile-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator("#reconcile-bank-balance-input")).toHaveValue("250");

    // Submit — mismatch: cleared 300 vs bank 250, difference +50.
    await page.locator("#reconcile-submit").click();
    await expect(dialog).toBeVisible();
    await expect(page.locator("#reconcile-mismatch-actions")).toBeVisible();
    await expect(page.locator("#reconcile-difference-display")).toContainText("50");

    // Click "Adjust cleared selections" — dialog closes, returns to leg list.
    await page.locator("#reconcile-adjust-selections").click();
    await expect(dialog).toBeHidden();

    // Check index 2 (the -50 leg). Cleared balance = 300 - 50 = 250.
    await checkboxes.nth(2).check();
    await expect(legRows.nth(2)).toHaveAttribute("data-cleared-saved", "true", { timeout: 5000 });
    await expect(page.locator(".reconcile-cleared-balance")).toContainText("250");

    // Reopen dialog and submit — now a match (cleared 250 vs bank 250).
    await page.locator("#reconcile-open-dialog").click();
    await expect(dialog).toBeVisible();
    await page.locator("#reconcile-submit").click();

    // On match the dialog closes and the page finalizes with one past reconciliation.
    await expect(dialog).toBeHidden();
    await expect(page.locator("#reconcile-past .reconcile-past-event")).toHaveCount(1);
    // No adjustment was created, so no adjustment indicator.
    await expect(page.locator(".reconcile-adjustment-indicator")).toHaveCount(0);
  });

  test("adjustment-entry path: mismatch, create adjustment entry, finalizes with non-zero adjustment", async ({ page }) => {
    // Upload mode is writable; seed mode would throw "Seed data is read-only"
    // on the reconcile write. The fixture seeds a `Test Bank` / `Checking`
    // asset account with three uncleared legs in `2025-03` totalling 250.
    await page.goto("/transactions");
    await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 15000 });
    await uploadFixture(page);
    await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".local-group-name")).toHaveText("Test Household", { timeout: 10000 });

    await page.goto(
      "/accounts/reconcile?institution=Test%20Bank&account=Checking&period=2025-03",
    );
    await expect(page.locator("#reconcile-container")).toBeVisible({ timeout: 10000 });

    const legRows = page.locator("#reconcile-leg-list .reconcile-leg");
    await expect(legRows).toHaveCount(3);

    // Check all three legs (+100, +200, -50). Cleared balance = 250.
    const checkboxes = page.locator("#reconcile-leg-list .reconcile-cleared-checkbox");
    for (let i = 0; i < 3; i++) {
      await checkboxes.nth(i).check();
      await expect(legRows.nth(i)).toHaveAttribute("data-cleared-saved", "true", { timeout: 5000 });
    }
    await expect(page.locator(".reconcile-cleared-balance")).toContainText("250");

    // Open dialog; fill bank balance with 240 to force a mismatch (difference +10).
    await page.locator("#reconcile-open-dialog").click();
    const dialog = page.locator("#reconcile-dialog");
    await expect(dialog).toBeVisible();
    await page.locator("#reconcile-bank-balance-input").fill("240");

    // Submit — mismatch: cleared 250 vs bank 240, difference +10.
    await page.locator("#reconcile-submit").click();
    await expect(dialog).toBeVisible();
    await expect(page.locator("#reconcile-mismatch-actions")).toBeVisible();
    await expect(page.locator("#reconcile-difference-display")).toContainText("10");

    // Click "Create adjustment entry" — writes a balanced two-leg entry and finalizes.
    await page.locator("#reconcile-create-adjustment").click();

    // Dialog closes and the page finalizes with one past reconciliation that
    // has a non-zero adjustment, indicated by .reconcile-adjustment-indicator.
    await expect(dialog).toBeHidden();
    await expect(page.locator("#reconcile-past .reconcile-past-event")).toHaveCount(1);
    await expect(page.locator(".reconcile-adjustment-indicator")).toBeVisible();

    // The adjustment adds one reconciling leg on Test Bank_Checking (period end
    // timestamp, so it falls in 2025-03). The leg list now has 4 entries, all
    // checked and disabled (reconciled state is terminal).
    await expect(page.locator("#reconcile-leg-list .reconcile-leg")).toHaveCount(4);
    const reconciledCheckboxes = page.locator("#reconcile-leg-list .reconcile-cleared-checkbox");
    await expect(reconciledCheckboxes).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(reconciledCheckboxes.nth(i)).toBeChecked();
      await expect(reconciledCheckboxes.nth(i)).toBeDisabled();
    }
  });
});
