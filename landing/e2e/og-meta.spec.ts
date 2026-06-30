import { test, expect } from "@commons-systems/config/playwright-test";

test.describe("og meta", () => {
  test("post page renders with history-mode URL", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/post/recovering-autonomy-with-coding-agents");
    await expect(page.locator("#posts")).toBeVisible({ timeout: 30000 });
  });
});
