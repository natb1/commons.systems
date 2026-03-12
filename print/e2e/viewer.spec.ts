import { test, expect } from "@playwright/test";

test.describe("viewer", () => {
  // All tests start by navigating to a PDF item's view page.
  // The seed data has 3 public items sorted by addedAt desc:
  //   1. "Republic" (plato-republic, PDF, 3 pages)
  //   2. "Phaedrus" (plato-phaedrus, PDF, 1 page)
  //   3. "Confessions..." (gutenberg-3296, EPUB)
  //
  // Navigate to Republic (3 pages) for navigation testing:
  //   page.goto("/#/view/plato-republic")
  // Or navigate via library by clicking the first .media-view link.

  test("viewer loads for PDF item", async ({ page }) => {
    await page.goto("/#/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#viewer-canvas")).toBeVisible();
    await expect(page.locator(".viewer-position")).toContainText("1 / 3");
  });

  test("panel toggle collapses and expands", async ({ page }) => {
    await page.goto("/#/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-position")).toContainText("1 / 3");

    const toggle = page.locator(".viewer-panel-toggle");
    const panel = page.locator(".viewer-panel");

    // Initially expanded
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();

    // Collapse
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).not.toBeVisible();

    // Re-expand
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
  });

  test("page navigation works", async ({ page }) => {
    await page.goto("/#/view/plato-republic");
    await expect(page.locator(".viewer-position")).toContainText("1 / 3", {
      timeout: 15000,
    });

    const prev = page.locator(".viewer-prev");
    const next = page.locator(".viewer-next");

    // Page 1: prev disabled, next enabled
    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();

    // Go to page 2
    await next.click();
    await expect(page.locator(".viewer-position")).toContainText("2 / 3");
    await expect(prev).toBeEnabled();
    await expect(next).toBeEnabled();

    // Go to page 3 (last)
    await next.click();
    await expect(page.locator(".viewer-position")).toContainText("3 / 3");
    await expect(prev).toBeEnabled();
    await expect(next).toBeDisabled();

    // Go back to page 2
    await prev.click();
    await expect(page.locator(".viewer-position")).toContainText("2 / 3");
  });

  test("back link returns to library", async ({ page }) => {
    await page.goto("/#/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });

    await page.locator(".viewer-back").click();
    await expect(page.locator("main h2")).toHaveText("Library");
  });

  test("metadata is visible in panel", async ({ page }) => {
    await page.goto("/#/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });

    await expect(page.locator(".viewer-title")).toContainText("Republic");
    await expect(page.locator(".viewer-panel .media-badge")).toContainText(
      "pdf",
    );
    await expect(page.locator(".viewer-pd")).toContainText("Public Domain");
  });

  test("desktop shows landscape orientation", async ({ page }, testInfo) => {
    // Desktop project has landscape viewport (1133x744)
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    await page.goto("/#/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer")).toHaveAttribute(
      "data-orientation",
      "landscape",
    );
  });

  test("mobile shows portrait orientation", async ({ page }, testInfo) => {
    // Mobile project has portrait viewport (375x812)
    test.skip(testInfo.project.name !== "mobile", "mobile only");
    await page.goto("/#/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer")).toHaveAttribute(
      "data-orientation",
      "portrait",
    );
  });
});
