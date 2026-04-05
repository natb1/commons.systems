import { test, expect } from "@playwright/test";

test.describe("Cumulative Layout Shift", () => {
  test("CLS score is below 0.1 on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/");
    await page.waitForLoadState("load");

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let score = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceEntry[] &
            { hadRecentInput: boolean; value: number }[]) {
            if (!entry.hadRecentInput) {
              score += entry.value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });

        setTimeout(() => {
          observer.disconnect();
          resolve(score);
        }, 3000);
      });
    });

    expect(cls).toBeLessThan(0.1);
  });
});
