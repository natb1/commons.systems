import { test, expect } from "@playwright/test";

test.describe("og meta", () => {
  test("meta description is present", async ({ page }) => {
    await page.goto("/");
    const desc = await page.getAttribute('meta[name="description"]', "content");
    expect(desc).toBeTruthy();
  });

  test("post page renders with history-mode URL", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/post/recovering-autonomy-with-coding-agents");
    await expect(page.locator("#posts")).toBeVisible({ timeout: 30000 });
  });
});
