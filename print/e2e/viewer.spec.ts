import { test, expect } from "@playwright/test";

test.describe("viewer", () => {
  // The seed data has 4 public items sorted by addedAt desc:
  //   1. "Republic" (plato-republic, PDF, 3 pages)
  //   2. "Phaedrus" (plato-phaedrus, PDF, 1 page)
  //   3. "Confessions..." (gutenberg-3296, EPUB)
  //   4. "Little Nemo in Slumberland (pages 1-5)" (test-image-archive, image-archive, 5 images)
  //
  // Navigate to Republic (3 pages) for navigation testing:
  //   page.goto("/view/plato-republic")
  // Or navigate via library by clicking the first .media-view link.

  test("viewer loads for PDF item", async ({ page }) => {
    await page.goto("/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-canvas-wrap canvas")).toBeVisible();
    await expect(page.locator(".viewer-position")).toContainText("1 / 3");
  });

  test("panel toggle collapses and expands", async ({ page }) => {
    await page.goto("/view/plato-republic");
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
    await page.goto("/view/plato-republic");
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
    await page.goto("/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });

    await page.locator(".viewer-back").click();
    await expect(page.locator("main h2")).toHaveText("Library");
  });

  test("metadata is visible in panel", async ({ page }) => {
    await page.goto("/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });

    await expect(page.locator(".viewer-title")).toContainText("Republic");
    await expect(page.locator(".viewer-panel .media-badge")).toContainText(
      "pdf",
    );
    await expect(page.locator(".viewer-pd")).toContainText("Public Domain");
  });

  test("viewer loads for image archive item", async ({ page }) => {
    await page.goto("/view/test-image-archive");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-canvas-wrap img")).toBeVisible();
    await expect(page.locator(".viewer-position")).toContainText("1 / 5");
  });

  test("image navigation works", async ({ page }) => {
    await page.goto("/view/test-image-archive");
    await expect(page.locator(".viewer-position")).toContainText("1 / 5", {
      timeout: 15000,
    });

    const prev = page.locator(".viewer-prev");
    const next = page.locator(".viewer-next");

    // Image 1: prev disabled, next enabled
    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();

    // Go to image 2
    await next.click();
    await expect(page.locator(".viewer-position")).toContainText("2 / 5");
    await expect(prev).toBeEnabled();
    await expect(next).toBeEnabled();

    // Go back to image 1
    await prev.click();
    await expect(page.locator(".viewer-position")).toContainText("1 / 5");
    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();
  });

  test("keyboard navigation works for image archive", async ({ page }) => {
    await page.goto("/view/test-image-archive");
    await expect(page.locator(".viewer-position")).toContainText("1 / 5", {
      timeout: 15000,
    });

    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".viewer-position")).toContainText("2 / 5");

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".viewer-position")).toContainText("1 / 5");
  });

  test("desktop shows landscape orientation", async ({ page }, testInfo) => {
    // Desktop project has landscape viewport (1133x744)
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    await page.goto("/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer")).toHaveAttribute(
      "data-orientation",
      "landscape",
    );
  });

  test("mobile shows portrait orientation", async ({ page }, testInfo) => {
    // Mobile project has portrait viewport (375x812)
    test.skip(testInfo.project.name !== "mobile", "mobile only");
    await page.goto("/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer")).toHaveAttribute(
      "data-orientation",
      "portrait",
    );
  });

  test("viewer loads for EPUB item", async ({ page }) => {
    await page.goto("/view/gutenberg-3296");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-epub-container")).toBeVisible();
    // Position label format: "Ch. 1/3 — p. 1/N"
    await expect(page.locator(".viewer-position")).toContainText("Ch. 1/3", {
      timeout: 15000,
    });
  });

  test("EPUB sub-chapter navigation works", async ({ page }) => {
    await page.goto("/view/gutenberg-3296");
    const position = page.locator(".viewer-position");
    await expect(position).toContainText("Ch. 1/3", { timeout: 15000 });

    const prev = page.locator(".viewer-prev");
    const next = page.locator(".viewer-next");

    // At start: prev disabled, next enabled
    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();

    // Advance within chapter 1 (sub-chapter page turn).
    // Exact sub-page number varies by viewport width (spread mode), so
    // just verify we're still in Ch. 1 and sub-page is no longer 1/1.
    await next.click();
    await expect(position).not.toContainText("p. 1/1");
    await expect(position).toContainText("Ch. 1/3");
    await expect(prev).toBeEnabled();
    await expect(next).toBeEnabled();
  });

  test("EPUB stylesheet is applied to content", async ({ page }) => {
    await page.goto("/view/gutenberg-3296");
    await expect(page.locator(".viewer-epub-container")).toBeVisible({
      timeout: 15000,
    });
    // Wait for chapter content to render
    await expect(page.locator(".viewer-position")).toContainText("Ch. 1/3", {
      timeout: 15000,
    });

    // The EPUB content is inside an iframe created by epub.js
    const iframe = page.frameLocator(".viewer-epub-container iframe");
    const body = iframe.locator("body");

    // Verify the stylesheet's font-family is applied
    await expect(body).toHaveCSS("font-family", /Georgia/);
  });

  test("EPUB metadata is visible in panel", async ({ page }) => {
    await page.goto("/view/gutenberg-3296");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });

    await expect(page.locator(".viewer-title")).toContainText("Confessions");
    await expect(page.locator(".viewer-panel .media-badge")).toContainText(
      "epub",
    );
    await expect(page.locator(".viewer-pd")).toContainText("Public Domain");
  });

  test("image archive: default view fits image without scrollbars", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    const img = page.locator(".viewer-canvas-wrap img");
    await expect(img).toBeVisible({ timeout: 15000 });

    const container = page.locator(".viewer-content");
    const containerBox = await container.boundingBox();
    const imgBox = await img.boundingBox();

    expect(containerBox).not.toBeNull();
    expect(imgBox).not.toBeNull();
    expect(imgBox!.width).toBeLessThanOrEqual(containerBox!.width);
    expect(imgBox!.height).toBeLessThanOrEqual(containerBox!.height);
  });

  test("image archive: zoom controls visible for image-archive", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    await expect(
      page.locator(".viewer-canvas-wrap img"),
    ).toBeVisible({ timeout: 15000 });

    await expect(page.locator(".viewer-zoom-in")).toBeVisible();
    await expect(page.locator(".viewer-zoom-reset")).toBeVisible();
  });

  test("image archive: zoom controls hidden for PDF", async ({ page }) => {
    await page.goto("/view/plato-republic");
    await expect(
      page.locator(".viewer-canvas-wrap canvas"),
    ).toBeVisible({ timeout: 15000 });

    await expect(page.locator(".viewer-zoom-in")).not.toBeVisible();
  });

  test("image archive: zoom-in button makes image larger than container", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    const img = page.locator(".viewer-canvas-wrap img");
    await expect(img).toBeVisible({ timeout: 15000 });

    await page.locator(".viewer-zoom-in").click();
    await page.waitForTimeout(300);

    const container = page.locator(".viewer-content");
    const containerBox = await container.boundingBox();
    const imgBox = await img.boundingBox();

    expect(containerBox).not.toBeNull();
    expect(imgBox).not.toBeNull();

    const exceedsWidth = imgBox!.width > containerBox!.width;
    const exceedsHeight = imgBox!.height > containerBox!.height;
    expect(exceedsWidth || exceedsHeight).toBe(true);
  });

  test("image archive: reset-zoom returns to fit-to-view", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    const img = page.locator(".viewer-canvas-wrap img");
    await expect(img).toBeVisible({ timeout: 15000 });

    // Zoom in first
    await page.locator(".viewer-zoom-in").click();
    await page.waitForTimeout(300);

    // Reset zoom
    await page.locator(".viewer-zoom-reset").click();
    await page.waitForTimeout(300);

    const container = page.locator(".viewer-content");
    const containerBox = await container.boundingBox();
    const imgBox = await img.boundingBox();

    expect(containerBox).not.toBeNull();
    expect(imgBox).not.toBeNull();
    expect(imgBox!.width).toBeLessThanOrEqual(containerBox!.width);
    expect(imgBox!.height).toBeLessThanOrEqual(containerBox!.height);
  });

  test("image archive: page navigation resets zoom", async ({ page }) => {
    await page.goto("/view/test-image-archive");
    const img = page.locator(".viewer-canvas-wrap img");
    await expect(img).toBeVisible({ timeout: 15000 });

    // Zoom in
    await page.locator(".viewer-zoom-in").click();
    await page.waitForTimeout(300);

    // Navigate to next page
    await page.locator(".viewer-next").click();
    await expect(page.locator(".viewer-position")).toContainText("2 / 5");

    const container = page.locator(".viewer-content");
    const containerBox = await container.boundingBox();
    const imgBox = await img.boundingBox();

    expect(containerBox).not.toBeNull();
    expect(imgBox).not.toBeNull();
    expect(imgBox!.width).toBeLessThanOrEqual(containerBox!.width);
    expect(imgBox!.height).toBeLessThanOrEqual(containerBox!.height);

    // Zoom-in should be enabled, reset should be disabled (at default zoom)
    await expect(page.locator(".viewer-zoom-in")).toBeEnabled();
    await expect(page.locator(".viewer-zoom-reset")).toBeDisabled();
  });
});
