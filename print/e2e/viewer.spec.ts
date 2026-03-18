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
    await expect(page.locator(".viewer-zoom-out")).toBeVisible();
    await expect(page.locator(".viewer-zoom-reset")).toBeVisible();
  });

  test("image archive: zoom controls hidden for PDF", async ({ page }) => {
    await page.goto("/view/plato-republic");
    await expect(
      page.locator(".viewer-canvas-wrap canvas"),
    ).toBeVisible({ timeout: 15000 });

    await expect(page.locator(".viewer-zoom-in")).not.toBeVisible();
    await expect(page.locator(".viewer-zoom-out")).not.toBeVisible();
  });

  test("image archive: zoom-in button makes image larger than container", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    const img = page.locator(".viewer-canvas-wrap img");
    await expect(img).toBeVisible({ timeout: 15000 });

    // Click zoom-in multiple times (1.2x per step) to ensure image exceeds container
    const zoomIn = page.locator(".viewer-zoom-in");
    for (let i = 0; i < 5; i++) await zoomIn.click();
    await expect(page.locator(".viewer-canvas-wrap.zoomed")).toBeVisible();

    const container = page.locator(".viewer-content");
    const containerBox = await container.boundingBox();
    const imgBox = await img.boundingBox();

    expect(containerBox).not.toBeNull();
    expect(imgBox).not.toBeNull();

    const exceedsWidth = imgBox!.width > containerBox!.width;
    const exceedsHeight = imgBox!.height > containerBox!.height;
    expect(exceedsWidth || exceedsHeight).toBe(true);
  });

  test("image archive: zoom-out button decreases zoom level", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    const img = page.locator(".viewer-canvas-wrap img");
    await expect(img).toBeVisible({ timeout: 15000 });

    // Zoom-out should be disabled at default zoom
    await expect(page.locator(".viewer-zoom-out")).toBeDisabled();

    // Zoom in a few times, then zoom out
    const zoomIn = page.locator(".viewer-zoom-in");
    for (let i = 0; i < 3; i++) await zoomIn.click();
    await expect(page.locator(".viewer-zoom-out")).toBeEnabled();

    await page.locator(".viewer-zoom-out").click();

    // Still zoomed (went from level 3 to level 2)
    await expect(page.locator(".viewer-zoom-out")).toBeEnabled();
    await expect(page.locator(".viewer-zoom-reset")).toBeEnabled();
  });

  test("image archive: reset-zoom returns to fit-to-view", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    const img = page.locator(".viewer-canvas-wrap img");
    await expect(img).toBeVisible({ timeout: 15000 });

    // Zoom in multiple steps
    const zoomIn = page.locator(".viewer-zoom-in");
    for (let i = 0; i < 3; i++) await zoomIn.click();
    await expect(page.locator(".viewer-canvas-wrap.zoomed")).toBeVisible();

    // Reset zoom
    await page.locator(".viewer-zoom-reset").click();
    await expect(page.locator(".viewer-canvas-wrap:not(.zoomed)")).toBeVisible();

    const container = page.locator(".viewer-content");
    const containerBox = await container.boundingBox();
    const imgBox = await img.boundingBox();

    expect(containerBox).not.toBeNull();
    expect(imgBox).not.toBeNull();
    expect(imgBox!.width).toBeLessThanOrEqual(containerBox!.width);
    expect(imgBox!.height).toBeLessThanOrEqual(containerBox!.height);

    // Zoom-out and reset should be disabled at fit-to-view
    await expect(page.locator(".viewer-zoom-out")).toBeDisabled();
    await expect(page.locator(".viewer-zoom-reset")).toBeDisabled();
  });

  test("image archive: page navigation resets zoom", async ({ page }) => {
    await page.goto("/view/test-image-archive");
    const img = page.locator(".viewer-canvas-wrap img");
    await expect(img).toBeVisible({ timeout: 15000 });

    // Zoom in
    const zoomIn = page.locator(".viewer-zoom-in");
    for (let i = 0; i < 3; i++) await zoomIn.click();
    await expect(page.locator(".viewer-canvas-wrap.zoomed")).toBeVisible();

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

    // All zoom controls should reflect default state
    await expect(page.locator(".viewer-zoom-in")).toBeEnabled();
    await expect(page.locator(".viewer-zoom-out")).toBeDisabled();
    await expect(page.locator(".viewer-zoom-reset")).toBeDisabled();
  });

  test("spread toggle visible for PDF and image-archive, hidden for EPUB", async ({
    page,
  }) => {
    // PDF: spread toggle should be visible
    await page.goto("/view/plato-republic");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-spread-toggle")).not.toHaveClass(/spread-hidden/);

    // Image-archive: spread toggle should be visible
    await page.goto("/view/test-image-archive");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-spread-toggle")).not.toHaveClass(/spread-hidden/);

    // EPUB: spread toggle should remain hidden
    await page.goto("/view/gutenberg-3296");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-spread-toggle")).toHaveClass(/spread-hidden/);
  });

  test("two pages visible in spread mode for interior pages", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-position")).toContainText("1 / 5");

    // Enable spread mode
    await page.locator(".viewer-spread-toggle").click();
    await expect(page.locator(".viewer-spread-toggle")).toHaveAttribute("aria-pressed", "true");

    // Navigate to spread 2-3
    await page.locator(".viewer-next").click();
    await expect(page.locator(".viewer-position")).toContainText(/Pages 2/);

    // Two img elements should be in .spread-page containers
    const spreadPages = page.locator(".spread-page img");
    await expect(spreadPages).toHaveCount(2);
  });

  test("page 1 displayed solo and centered in spread mode", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });

    // Enable spread mode (starts on page 1)
    await page.locator(".viewer-spread-toggle").click();
    await expect(page.locator(".viewer-spread-toggle")).toHaveAttribute("aria-pressed", "true");

    // Canvas wrap should have both spread-mode and solo classes
    await expect(page.locator(".viewer-canvas-wrap.spread-mode.solo")).toBeVisible();
  });

  test("navigation advances by spread, position label updates", async ({
    page,
  }) => {
    await page.goto("/view/test-image-archive");
    await expect(page.locator(".viewer-position")).toContainText("1 / 5", {
      timeout: 15000,
    });

    // Enable spread mode
    await page.locator(".viewer-spread-toggle").click();
    await expect(page.locator(".viewer-spread-toggle")).toHaveAttribute("aria-pressed", "true");

    // Page 1 solo
    await expect(page.locator(".viewer-position")).toContainText("Page 1 / 5");

    // Advance to spread 2-3
    await page.locator(".viewer-next").click();
    await expect(page.locator(".viewer-position")).toContainText(/Pages 2\u20133 \/ 5/);

    // Advance to spread 4-5
    await page.locator(".viewer-next").click();
    await expect(page.locator(".viewer-position")).toContainText(/Pages 4\u20135 \/ 5/);
  });

  test("toggle spread on/off preserves position", async ({ page }) => {
    await page.goto("/view/test-image-archive");
    await expect(page.locator(".viewer-position")).toContainText("1 / 5", {
      timeout: 15000,
    });

    // Navigate to page 3 in single-page mode
    await page.locator(".viewer-next").click();
    await expect(page.locator(".viewer-position")).toContainText("2 / 5");
    await page.locator(".viewer-next").click();
    await expect(page.locator(".viewer-position")).toContainText("3 / 5");

    // Toggle spread on -- page 3 is in the 2-3 spread
    await page.locator(".viewer-spread-toggle").click();
    await expect(page.locator(".viewer-spread-toggle")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".viewer-position")).toContainText(/Pages 2\u20133 \/ 5/);

    // Toggle spread off -- should return to page 3 area
    await page.locator(".viewer-spread-toggle").click();
    await expect(page.locator(".viewer-spread-toggle")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".viewer-position")).toContainText("3 / 5");
  });

  test("keyboard arrows advance by spread", async ({ page }) => {
    await page.goto("/view/test-image-archive");
    await expect(page.locator(".viewer-position")).toContainText("1 / 5", {
      timeout: 15000,
    });

    // Enable spread mode
    await page.locator(".viewer-spread-toggle").click();
    await expect(page.locator(".viewer-spread-toggle")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".viewer-position")).toContainText("Page 1 / 5");

    // ArrowRight advances to next spread
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".viewer-position")).toContainText(/Pages 2\u20133 \/ 5/);

    // ArrowRight again to spread 4-5
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".viewer-position")).toContainText(/Pages 4\u20135 \/ 5/);

    // ArrowLeft goes back to spread 2-3
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".viewer-position")).toContainText(/Pages 2\u20133 \/ 5/);
  });
});
