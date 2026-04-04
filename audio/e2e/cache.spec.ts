import { test, expect } from "@playwright/test";

test.describe("audio cache", () => {
  test("cache and replay from IndexedDB", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    const row = page.locator(".audio-row").first();
    const checkbox = row.locator("input[data-queue-toggle]");

    // Play a track
    await checkbox.check();
    await expect(page.locator("#audio-player")).toHaveAttribute("src", /.+/, {
      timeout: 10000,
    });

    // Stop playback
    await checkbox.uncheck();
    await expect(page.locator("#audio-player")).not.toHaveAttribute(
      "src",
      /.+/,
      { timeout: 10000 },
    );

    // Re-check to replay
    await checkbox.check();
    await expect(page.locator("#audio-player")).toHaveAttribute("src", /.+/, {
      timeout: 10000,
    });

    // Verify IndexedDB has a cache entry
    const entryCount = await page.evaluate(() => {
      return new Promise<number>((resolve, reject) => {
        const req = indexedDB.open("audio-media-cache");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const storeNames = db.objectStoreNames;
          if (storeNames.length === 0) {
            db.close();
            resolve(0);
            return;
          }
          const tx = db.transaction(storeNames[0], "readonly");
          const store = tx.objectStore(storeNames[0]);
          const countReq = store.count();
          countReq.onsuccess = () => {
            db.close();
            resolve(countReq.result);
          };
          countReq.onerror = () => {
            db.close();
            reject(countReq.error);
          };
        };
      });
    });
    expect(entryCount).toBeGreaterThan(0);
  });

  test("cache stats display", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    const row = page.locator(".audio-row").first();
    const checkbox = row.locator("input[data-queue-toggle]");

    await checkbox.check();
    await expect(page.locator("#audio-player")).toHaveAttribute("src", /.+/, {
      timeout: 10000,
    });

    await expect(page.locator("#cache-stats")).toHaveText(
      /1 tracks? cached.+\d+/,
      { timeout: 10000 },
    );
  });

  test("clear cache resets stats", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    const row = page.locator(".audio-row").first();
    const checkbox = row.locator("input[data-queue-toggle]");

    await checkbox.check();
    await expect(page.locator("#audio-player")).toHaveAttribute("src", /.+/, {
      timeout: 10000,
    });
    await expect(page.locator("#cache-stats")).toHaveText(
      /1 tracks? cached/,
      { timeout: 10000 },
    );

    await page.locator("#clear-cache-btn").click();
    await expect(page.locator("#cache-stats")).toHaveText(
      "0 tracks cached (0 B)",
      { timeout: 10000 },
    );
  });

  test("offline playback from cache", async ({ page, context }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    const row = page.locator(".audio-row").first();
    const checkbox = row.locator("input[data-queue-toggle]");

    // Play to populate cache
    await checkbox.check();
    await expect(page.locator("#audio-player")).toHaveAttribute("src", /.+/, {
      timeout: 10000,
    });

    // Stop playback
    await checkbox.uncheck();
    await expect(page.locator("#audio-player")).not.toHaveAttribute(
      "src",
      /.+/,
      { timeout: 10000 },
    );

    // Go offline
    await context.setOffline(true);

    // Re-check the same track — should play from cache via blob URL
    await checkbox.check();
    await expect(page.locator("#audio-player")).toHaveAttribute(
      "src",
      /^blob:/,
      { timeout: 10000 },
    );

    // Restore connectivity
    await context.setOffline(false);
  });
});
