import { test, expect } from "@playwright/test";

interface ShiftEntry {
  value: number;
  sources: { node: string; previousRect: string; currentRect: string }[];
}

// Use test.use to set the viewport at context creation time rather than
// resizing after creation, which can introduce spurious layout shifts.
test.use({ viewport: { width: 412, height: 915 } });

test.describe("Cumulative Layout Shift", () => {
  test("CLS score is below 0.1 on mobile viewport", async ({ page, context }) => {
    // Pre-warm the hosting emulator. The first request against a cold Firebase
    // emulator is slow enough that preloaded fonts miss the font-display:optional
    // block window, causing a fallback-to-web-font swap and extra layout shifts.
    // This preliminary fetch primes the emulator so the measured page load
    // reflects production-like latency.
    await page.goto("/");
    await page.waitForLoadState("load");

    // Open a fresh page in the same context (shares cache with the warm-up
    // page, matching how a real user with primed browser cache would experience
    // the site) and measure CLS there.
    const measured = await context.newPage();
    await measured.goto("/");
    await measured.waitForLoadState("load");

    const result = await measured.evaluate(() => {
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

    expect(result.score).toBeLessThan(0.1);

    await measured.close();
  });
});
