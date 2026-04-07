import { test, expect } from "@playwright/test";

test.describe("security headers smoke", () => {
  test("page response includes CSP header @smoke", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    const csp = response!.headers()["content-security-policy"];
    expect(csp, "content-security-policy header missing").toBeDefined();
    expect(csp).toContain("default-src");
    expect(csp).toContain("script-src");
  });

  test("page response includes COOP header @smoke", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    const coop = response!.headers()["cross-origin-opener-policy"];
    expect(coop, "cross-origin-opener-policy header missing").toBeDefined();
    expect(coop).toBe("same-origin");
  });

  test("page response includes X-Frame-Options header @smoke", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    const xfo = response!.headers()["x-frame-options"];
    expect(xfo, "x-frame-options header missing").toBeDefined();
    expect(xfo).toBe("DENY");
  });

  test("page response includes HSTS header @smoke", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    const hsts = response!.headers()["strict-transport-security"];
    expect(hsts, "strict-transport-security header missing").toBeDefined();
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });
});
