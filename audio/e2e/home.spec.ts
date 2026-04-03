import { test, expect } from "@playwright/test";
import { signIn } from "@commons-systems/authutil/e2e/sign-in";

test.describe("home page content", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Library", {
      timeout: 30000,
    });
    await expect(page.locator("#media-error")).toHaveCount(0);
  });

  test("public media listing shows 4 items", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".audio-row")).toHaveCount(4, {
      timeout: 10000,
    });
  });

  test("titles are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#media-list")).toContainText(
      "Piano Sonata No. 14",
    );
    await expect(page.locator("#media-list")).toContainText(
      "Cello Suite No. 1",
    );
    await expect(page.locator("#media-list")).toContainText(
      "Nocturne in E-flat Major",
    );
  });

  test("expandable rows show metadata", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    const row = page.locator(".audio-row").first();
    await row.locator("summary").click();
    await expect(row.locator(".expand-details dl")).toBeVisible();
  });

  test("queue interaction: checkbox adds to playlist and sets audio src", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    const row = page.locator(".audio-row").first();
    const title = await row.getAttribute("data-title");
    const checkbox = row.locator("input[data-queue-toggle]");
    await checkbox.check();
    await expect(page.locator("#now-playing")).toContainText(title!, {
      timeout: 10000,
    });
    await expect(page.locator("#audio-player")).toHaveAttribute("src", /.+/, {
      timeout: 10000,
    });
  });

  test("uncheck removes track from playlist", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    const row = page.locator(".audio-row").first();
    const checkbox = row.locator("input[data-queue-toggle]");
    await checkbox.check();
    await expect(page.locator("#playlist-queue li")).toHaveCount(1, {
      timeout: 10000,
    });
    await checkbox.uncheck();
    await expect(page.locator("#playlist-queue li")).toHaveCount(0, { timeout: 5000 });
  });

  test("multiple checked tracks show ordered queue", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    const rows = page.locator(".audio-row");
    await rows.nth(0).locator("input[data-queue-toggle]").check();
    await rows.nth(1).locator("input[data-queue-toggle]").check();
    await expect(page.locator("#playlist-queue li")).toHaveCount(2, {
      timeout: 10000,
    });
  });

  test("auth integration shows private items", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator(".audio-row")).toHaveCount(5, {
      timeout: 10000,
    });
    await expect(page.locator("#media-list")).toContainText(
      "Test Private Audio",
    );
  });
});
