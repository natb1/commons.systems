import { test, expect } from "@playwright/test";

test.describe("hero band", () => {
  test("H1 and tagline render above the fold", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator(".page > header h1");
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText("commons.systems");

    const tagline = page.locator(".page > header .tagline");
    await expect(tagline).toBeVisible();
    await expect(tagline).toHaveText("Custom software you can understand.");

    const taglineBox = await tagline.boundingBox();
    const viewport = page.viewportSize();
    if (!taglineBox) throw new Error("tagline has no bounding box");
    if (!viewport) throw new Error("page has no viewport size");
    expect(taglineBox.y + taglineBox.height).toBeLessThan(viewport.height);
  });

  test("tagline renders without uppercase transform", async ({ page }) => {
    await page.goto("/");

    const tagline = page.locator(".page > header .tagline");
    const innerText = await tagline.evaluate((el) => (el as HTMLElement).innerText);
    const textContent = await tagline.evaluate((el) => el.textContent);
    expect(innerText).toBe("Custom software you can understand.");
    expect(innerText).toBe(textContent);
  });

  test("H1 does not overflow at viewport width", async ({ page }) => {
    await page.goto("/");

    const overflow = await page.locator(".page > header h1").evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
  });

  test("landing-hero sits between header and content-grid", async ({
    page,
  }) => {
    await page.goto("/");

    const order = await page.evaluate(() => {
      const pageEl = document.querySelector(".page");
      if (!pageEl) throw new Error("root container .page not found");
      const children = Array.from(pageEl.children).map(
        (c) => c.tagName.toLowerCase() + (c.className ? "." + c.className : ""),
      );
      const heroIdx = children.findIndex((c) => c.includes("landing-hero"));
      const headerIdx = children.findIndex((c) => c.startsWith("header"));
      const gridIdx = children.findIndex((c) => c.includes("content-grid"));
      return { heroIdx, headerIdx, gridIdx };
    });

    expect(order.headerIdx).toBeGreaterThanOrEqual(0);
    expect(order.heroIdx).toBeGreaterThan(order.headerIdx);
    expect(order.gridIdx).toBeGreaterThan(order.heroIdx);
  });

  test("hero showcase content renders", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".landing-hero-band")).toContainText(
      "This is not an app.",
    );
    await expect(page.locator("a.app-card")).toHaveCount(3);
  });
});
