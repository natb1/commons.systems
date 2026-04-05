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

    // All published posts should have visible content
    await expect(
      page.locator("#post-content-the-surreal"),
    ).toBeVisible();
    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).toBeVisible();
    await expect(
      page.locator("#post-content-disciplinary-review-operations"),
    ).toBeVisible();

    // No "Loading..." placeholders should remain
    await expect(
      page.locator("#post-content-the-surreal"),
    ).not.toContainText("Loading...");
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
      page.locator("#post-content-the-surreal"),
    ).toHaveAttribute("data-hydrated");
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
    // Content is build-time inlined, so no GitHub fetches should occur.
    // Wait briefly for any deferred requests to fire (Firebase SDK
    // initialization creates persistent connections that prevent networkidle).
    await page.waitForTimeout(3000);

    expect(githubRequests).toHaveLength(0);
  });

  test("reCAPTCHA scripts do not load before user interaction", async ({
    page,
  }) => {
    const recaptchaRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("google.com/recaptcha") ||
        url.includes("gstatic.com/recaptcha")
      ) {
        recaptchaRequests.push(url);
      }
    });

    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    // Wait for any deferred requests to fire.
    await page.waitForTimeout(3000);

    expect(recaptchaRequests).toHaveLength(0);

    // Trigger a user interaction.
    await page.mouse.click(0, 0);
    // Wait briefly for the interaction to trigger loading.
    await page.waitForTimeout(2000);

    // In emulator mode App Check is skipped, so we do not assert that
    // reCAPTCHA loads after interaction.
  });

  test("blogroll entries have build-time feed data on initial render @smoke", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    const panel = page.locator("#info-panel");
    const latestSpans = panel.locator(".blogroll-entry .blogroll-latest");

    // All blogroll-latest spans should be populated from build-time feed data
    // without waiting for runtime hydration or App Check initialization.
    const count = await latestSpans.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(latestSpans.nth(i)).not.toHaveText("");
    }
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

  test("preconnect links are present for googleapis domains", async ({
    page,
  }) => {
    await page.goto("/");

    const hrefs = await page
      .locator('link[rel="preconnect"]')
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("href")).filter(Boolean),
      );

    expect(hrefs).toContain("https://www.googleapis.com");
    expect(hrefs).toContain(
      "https://firebaseinstallations.googleapis.com",
    );
    expect(hrefs).toContain("https://apis.google.com");
    expect(hrefs).toContain("https://firestore.googleapis.com");
  });
});
