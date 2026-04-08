import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test("page loads without JS errors @smoke", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));
    await page.goto("/");
    await page.waitForLoadState("load");
    expect(errors).toHaveLength(0);
  });

  test("no analytics console errors", async ({ page }) => {
    const analyticsErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /analytics|gtag/i.test(msg.text())) {
        analyticsErrors.push(msg.text());
      }
    });
    await page.goto("/");
    await page.waitForLoadState("load");
    expect(analyticsErrors).toHaveLength(0);
  });

  test("HTML shell structure @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header h1")).toHaveText("Print");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("Library heading @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Library", { timeout: 10000 });
  });

  test("clicking About nav link shows About heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Library", { timeout: 10000 });
    await page.click('nav a[href="/about"]');
    await expect(page.locator("main h2")).toHaveText("About");
  });

  test("clicking Library nav link returns to Library", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("main h2")).toHaveText("About");
    await page.click('nav a[href="/"]');
    await expect(page.locator("main h2")).toHaveText("Library");
  });

  test("unknown path falls back to home page", async ({ page }) => {
    await page.goto("/nonexistent");
    await expect(page.locator("main h2")).toHaveText("Library");
  });

  test("spread toggle button exists on viewer page for PDF @smoke", async ({ page }) => {
    await page.goto("/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-spread-toggle")).toBeAttached();
  });

  // Not tagged @smoke because preview deploys show 'Failed to load' -- the
  // PDF download from Firebase Storage fails in the preview environment.
  test("PDF text layer present on viewer page", async ({ page }) => {
    await page.goto("/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-position")).toContainText(/Page \d+/, { timeout: 15000 });
    await expect(page.locator(".textLayer")).toBeAttached();
  });

  test("search section present in viewer shell @smoke", async ({ page }) => {
    await page.goto("/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-search")).toBeAttached();
  });
});
