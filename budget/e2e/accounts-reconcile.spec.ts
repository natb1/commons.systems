import { test, expect } from "@playwright/test";

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

  test("renders three columns for a seeded account/period with data", async ({ page }) => {
    await page.goto(
      "/accounts/reconcile?institution=Example%20Bank&account=Checking&period=2025-02",
    );
    await expect(page.locator("#reconcile-container")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".reconcile-column-matched")).toBeVisible();
    await expect(page.locator(".reconcile-column-unmatched-items")).toBeVisible();
    await expect(page.locator(".reconcile-column-unmatched-txns")).toBeVisible();
  });

  test("changing the tolerance input re-renders the page", async ({ page }) => {
    await page.goto(
      "/accounts/reconcile?institution=Example%20Bank&account=Checking&period=2025-02&tolerance=3",
    );
    await expect(page.locator("#reconcile-container")).toBeVisible({ timeout: 10000 });
    const tolerance = page.locator("#reconcile-tolerance-input");
    await tolerance.fill("7");
    await tolerance.dispatchEvent("change");
    await expect(page).toHaveURL(/tolerance=7/);
  });

  test("aging badge renders when statement items are older than 30 days", async ({ page }) => {
    // Seed has one item on 2025-02-14 ("UNKNOWN MERCHANT"). Use the default tolerance — the
    // page always renders; badges appear only if the host system clock is >30 days after the
    // item date. This check is conditional on that condition being true at test time.
    await page.goto(
      "/accounts/reconcile?institution=Example%20Bank&account=Checking&period=2025-02",
    );
    await expect(page.locator("#reconcile-container")).toBeVisible({ timeout: 10000 });
    const agingBadges = page.locator(".reconcile-aging");
    const nowMs = Date.now();
    const itemMs = Date.parse("2025-02-14T00:00:00Z");
    const daysSince = Math.floor((nowMs - itemMs) / (24 * 60 * 60 * 1000));
    test.skip(daysSince <= 30, "Seeded statement item is not old enough to be aged");
    await expect(agingBadges.first()).toBeVisible();
  });
});
