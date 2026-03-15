import { test, expect } from "@playwright/test";
import { signIn } from "@commons-systems/authutil/e2e/sign-in";

test.describe("auth", () => {
  test("nav shows sign-in link on admin route when not signed in", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page.locator("#sign-in")).toBeVisible();
    await expect(page.locator("#sign-out")).not.toBeVisible();
  });

  test("nav does not show sign-in on home route", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await expect(page.locator("#sign-in")).not.toBeAttached();
  });

  test("nav shows user display and sign-out after sign-in on admin route", async ({
    page,
  }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await signIn(page);
    await page.goto("/admin");
    await expect(page.locator("#sign-out")).toBeVisible();
    await expect(page.locator("#user-display")).toContainText("Test User");
  });

  test("sign-out returns to unauthenticated state on admin route", async ({
    page,
  }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await signIn(page);
    await page.goto("/admin");
    await page.locator("#sign-out").click();
    await page.waitForSelector("#sign-in");
    await expect(page.locator("#sign-in")).toBeVisible();
  });

  test("home page shows published posts without auth", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const posts = page.locator("#posts article");
    expect(await posts.count()).toBeGreaterThanOrEqual(1);
  });
});
