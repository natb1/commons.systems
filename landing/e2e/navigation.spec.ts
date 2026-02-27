import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test("page loads without JS errors @smoke", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await page.waitForLoadState("load");
    expect(errors).toHaveLength(0);
  });

  test("HTML shell structure @smoke", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await expect(page.locator("header h1")).toHaveText("commons.systems");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("home page shows post list @smoke", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const posts = page.locator("#posts article");
    expect(await posts.count()).toBeGreaterThanOrEqual(2);
  });

  test("admin route accessible @smoke", async ({ page }) => {
    await page.goto("/#/admin");
    await expect(page.locator("#sign-in")).toBeVisible();
  });

  test("post route renders home page with posts @smoke", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Hello World\nThis is the post." }),
    );
    await page.goto("/#/post/hello-world");
    await expect(page.locator("#posts")).toBeVisible({ timeout: 30000 });
  });

  test("post content loads from GitHub without mocks @smoke", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const firstContent = page.locator("#posts article .post-content, #posts article [id^='post-content-']").first();
    await expect(firstContent).not.toContainText("Could not load post content.", { timeout: 30000 });
    await expect(firstContent).not.toContainText("Loading...", { timeout: 30000 });
  });

  test("unknown hash falls back to home page", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/#/nonexistent");
    await expect(page.locator("#posts")).toBeVisible({ timeout: 30000 });
  });

  test("clicking Home nav link shows home", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/#/admin");
    await page.click('nav a[href="#/"]');
    await expect(page.locator("main h2").first()).toBeVisible();
  });

  test("#info-panel element exists in DOM @smoke", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await expect(page.locator("#info-panel")).toBeAttached();
  });

  test("desktop: #info-panel is visible @smoke", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#info-panel")).toBeVisible();
  });
});
