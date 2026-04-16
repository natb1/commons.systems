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
    expect(taglineBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(taglineBox!.y + taglineBox!.height).toBeLessThan(viewport!.height);
  });

  test("tagline is not uppercase", async ({ page }) => {
    await page.goto("/");

    const textTransform = await page
      .locator(".page > header .tagline")
      .evaluate((el) => getComputedStyle(el).textTransform);
    expect(textTransform).toBe("none");
  });

  test("H1 does not overflow at viewport width", async ({ page }) => {
    await page.goto("/");

    const overflow = await page.locator(".page > header h1").evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
  });

  test("empty landing-hero scaffold sits between header and content-grid", async ({
    page,
  }) => {
    await page.goto("/");

    const order = await page.evaluate(() => {
      const pageEl = document.querySelector(".page");
      const children = Array.from(pageEl?.children ?? []).map(
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
});
