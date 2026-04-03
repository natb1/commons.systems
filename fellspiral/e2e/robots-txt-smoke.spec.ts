import { test, expect } from "@playwright/test";

test.describe("robots.txt smoke", () => {
  test("GET /robots.txt returns valid robots.txt @smoke", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
    const contentType = response!.headers()["content-type"] ?? "";
    expect(contentType).toContain("text/plain");

    const body = await response!.text();
    expect(body).toContain("User-agent");
  });
});
