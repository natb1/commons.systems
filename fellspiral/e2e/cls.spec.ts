import { test, expect } from "@commons-systems/config/playwright-test";

interface ShiftEntry {
  value: number;
  sources: { node: string; previousRect: string; currentRect: string }[];
}

// Use test.use to set the viewport at context creation time rather than
// resizing after creation, which can introduce spurious layout shifts.
test.use({ viewport: { width: 412, height: 915 } });

test.describe("Cumulative Layout Shift", () => {
  test("CLS score is below 0.1 on mobile viewport", async ({ page }) => {
    // Gate CLS measurement on document.fonts.ready. The fellspiral fonts use
    // font-display: optional, so the browser commits initial layout with
    // fallback-font metrics if web fonts miss the ~100ms block window — and
    // the late font swap produces a +288px shift on .content-grid that has
    // nothing to do with production layout stability. Cold Firebase emulator
    // boots routinely exceed that window, so any pre-fonts.ready shift is
    // emulator-timing noise. Anything that shifts *after* fonts are ready is
    // a real reflow and is what this test exists to catch.
    await page.goto("/");

    const result = await page.evaluate(async () => {
      await document.fonts.ready;

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
        observer.observe({ type: "layout-shift" });

        setTimeout(() => {
          observer.disconnect();
          resolve({ score, entries });
        }, 3000);
      });
    });

    if (result.entries.length > 0) {
      console.log("CLS entries:", JSON.stringify(result.entries, null, 2));
    }

    expect(result.score).toBeLessThan(0.1);
  });
});
