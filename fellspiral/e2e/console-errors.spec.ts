import { test, expect } from "@playwright/test";

test.describe("console errors", () => {
  test("no atom-strategy-fetch errors on page load @smoke", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    // Allow time for the blogroll feed fetch to settle after DOM render.
    await page.waitForTimeout(3000);

    const atomErrors = consoleErrors.filter((msg) =>
      msg.includes("atom-strategy-fetch"),
    );
    expect(atomErrors).toHaveLength(0);
  });
});
