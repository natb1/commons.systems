import { test, expect } from "@playwright/test";

// These tests verify that build-time inlined blog content is present in the
// served HTML without requiring async fetches. No route interception is used --
// the content must come from the build output, not from GitHub at runtime.

test.describe("build-time blog content", () => {
  test("home page shows published post content without Loading placeholders @smoke", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    // Both published posts should have visible content
    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).toBeVisible();
    await expect(
      page.locator("#post-content-disciplinary-review-operations"),
    ).toBeVisible();

    // No "Loading..." placeholders should remain
    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).not.toContainText("Loading...");
    await expect(
      page.locator("#post-content-disciplinary-review-operations"),
    ).not.toContainText("Loading...");
  });

  test("post slug route shows content without Loading placeholder", async ({
    page,
  }) => {
    await page.goto("/post/scenes-from-a-hat");
    await page.waitForSelector("#posts", { timeout: 30000 });

    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).toBeVisible();
    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).not.toContainText("Loading...");
  });

  test("content divs have data-hydrated attribute (build-time inlined)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).toHaveAttribute("data-hydrated");
    await expect(
      page.locator("#post-content-disciplinary-review-operations"),
    ).toHaveAttribute("data-hydrated");
  });

  test("no GitHub raw content fetches are made", async ({ page }) => {
    const githubRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("raw.githubusercontent.com")) {
        githubRequests.push(req.url());
      }
    });

    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    // Allow any in-flight requests to settle
    await page.waitForLoadState("networkidle");

    expect(githubRequests).toHaveLength(0);
  });

  test("inlined content includes text from the markdown source", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    // Verify actual content from the markdown files is present
    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).toContainText("Armadillo Crag");
    await expect(
      page.locator("#post-content-disciplinary-review-operations"),
    ).toContainText("Sassy Diaz");
  });
});
