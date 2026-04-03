import { test, expect } from "@playwright/test";

test.describe("robots.txt", () => {
  test("GET /robots.txt returns valid robots.txt, not HTML", async ({
    page,
  }) => {
    const response = await page.goto("/robots.txt");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const body = await response!.text();
    expect(body).toContain("User-agent");
    expect(body).not.toContain("<!DOCTYPE");
    expect(body).not.toContain("<html");
  });
});
