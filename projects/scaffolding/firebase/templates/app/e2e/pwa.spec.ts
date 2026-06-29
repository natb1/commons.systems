import { test, expect } from "@commons-systems/config/playwright-test";

test.describe("PWA install scaffolding", () => {
  test("GET /manifest.json returns a valid web app manifest", async ({
    request,
  }) => {
    const response = await request.get("/manifest.json");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("page links the manifest", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.json",
    );
  });

  test("install icons are served", async ({ request }) => {
    for (const path of ["/icon-192.png", "/icon-512.png"]) {
      const response = await request.get(path);
      expect(response.status(), `${path} should be 200`).toBe(200);
    }
  });

  test("manifest and icons are served @smoke", async ({ request }) => {
    const manifest = await request.get("/manifest.json");
    expect(manifest.status()).toBe(200);
    const body = await manifest.json();
    expect(body.name).toBeTruthy();
    expect(body.start_url).toBeTruthy();
    expect(body.display).toBeTruthy();
    expect(Array.isArray(body.icons)).toBe(true);

    for (const path of ["/icon-192.png", "/icon-512.png"]) {
      const icon = await request.get(path);
      expect(icon.status(), `${path} should be 200`).toBe(200);
    }
  });
});
