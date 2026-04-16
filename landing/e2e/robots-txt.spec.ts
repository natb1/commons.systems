import { test, expect } from "@playwright/test";

test.describe("robots.txt", () => {
  test("GET /robots.txt returns valid robots.txt, not HTML", async ({
    page,
  }) => {
    const response = await page.goto("/robots.txt");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
    const contentType = response!.headers()["content-type"] ?? "";
    expect(contentType).toContain("text/plain");

    const body = await response!.text();
    expect(body).toContain("User-agent");
    expect(body).not.toContain("<!DOCTYPE");
    expect(body).not.toContain("<html");
  });

  test("GET /robots.txt returns valid robots.txt @smoke", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
    const contentType = response!.headers()["content-type"] ?? "";
    expect(contentType).toContain("text/plain");

    const body = await response!.text();
    expect(body).toContain("User-agent");
  });

  test("robots.txt references sitemap @smoke", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    const body = await response!.text();
    expect(body).toMatch(/^Sitemap:\s*https:\/\/commons\.systems\/sitemap\.xml\s*$/m);
  });
});
