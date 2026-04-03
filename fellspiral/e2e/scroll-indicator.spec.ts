import { test, expect } from "@playwright/test";

test.describe("scroll indicator", () => {
  test("scroll indicator repositions on viewport resize", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });

    const track = page.locator(".sidebar-scroll-track");
    await expect(track).toBeVisible();

    const initialBox = await track.boundingBox();
    expect(initialBox).not.toBeNull();

    // Arbitrary width different from default, still above the 768px desktop breakpoint
    await page.setViewportSize({ width: 933, height: 744 });
    await page.waitForTimeout(200);

    const resizedBox = await track.boundingBox();
    expect(resizedBox).not.toBeNull();

    expect(resizedBox!.x).not.toEqual(initialBox!.x);
  });
});
