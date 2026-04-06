import { test, expect } from "@playwright/test";

interface ShiftEntry {
  value: number;
  sources: { node: string; previousRect: string; currentRect: string }[];
}

test.describe("Cumulative Layout Shift", () => {
  test("CLS score is below 0.12 on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/");
    await page.waitForLoadState("load");

    const result = await page.evaluate(() => {
      return new Promise<{ score: number; entries: ShiftEntry[] }>((resolve) => {
        let score = 0;
        const entries: ShiftEntry[] = [];
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceEntry[] &
            {
              hadRecentInput: boolean;
              value: number;
              sources?: { node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[];
            }[]) {
            if (!entry.hadRecentInput) {
              score += entry.value;
              entries.push({
                value: entry.value,
                sources: (entry.sources ?? []).map((s) => ({
                  node: s.node
                    ? `${(s.node as Element).tagName?.toLowerCase() ?? "text"}${(s.node as Element).id ? "#" + (s.node as Element).id : ""}${(s.node as Element).className ? "." + (s.node as Element).className.replace(/\s+/g, ".") : ""}`
                    : "null",
                  previousRect: `${Math.round(s.previousRect.x)},${Math.round(s.previousRect.y)} ${Math.round(s.previousRect.width)}x${Math.round(s.previousRect.height)}`,
                  currentRect: `${Math.round(s.currentRect.x)},${Math.round(s.currentRect.y)} ${Math.round(s.currentRect.width)}x${Math.round(s.currentRect.height)}`,
                })),
              });
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });

        setTimeout(() => {
          observer.disconnect();
          resolve({ score, entries });
        }, 3000);
      });
    });

    // Log shift details for debugging
    if (result.entries.length > 0) {
      console.log("CLS entries:", JSON.stringify(result.entries, null, 2));
    }

    // Allow small headroom above Google's 0.1 "good" threshold to absorb
    // CI environment timing variance (font loads, emulator startup, etc.).
    expect(result.score).toBeLessThan(0.12);
  });
});
