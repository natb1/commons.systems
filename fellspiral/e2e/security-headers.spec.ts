import { test, expect } from "@playwright/test";

test.describe("security headers", () => {
  test("content-security-policy includes key directives", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const csp = response!.headers()["content-security-policy"];
    expect(csp, "content-security-policy header missing from response").toBeDefined();
    expect(csp).toContain("default-src");
    expect(csp).toContain("script-src");
    expect(csp).toContain("frame-ancestors");
  });

  test("cross-origin-opener-policy is same-origin", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const coop = response!.headers()["cross-origin-opener-policy"];
    expect(coop, "cross-origin-opener-policy header missing from response").toBeDefined();
    expect(coop).toBe("same-origin");
  });

  test("x-frame-options is DENY", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const xfo = response!.headers()["x-frame-options"];
    expect(xfo, "x-frame-options header missing from response").toBeDefined();
    expect(xfo).toBe("DENY");
  });

  test("strict-transport-security includes includeSubDomains and preload", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const hsts = response!.headers()["strict-transport-security"];
    expect(hsts, "strict-transport-security header missing from response").toBeDefined();
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });

  test("no CSP violation errors in console", async ({ page }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        msg.text().includes("Content Security Policy")
      ) {
        cspViolations.push(msg.text());
      }
    });

    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // Wait for any deferred scripts/resources to trigger potential violations
    await page.waitForLoadState("networkidle");

    expect(
      cspViolations,
      `CSP violations found:\n${cspViolations.join("\n")}`,
    ).toHaveLength(0);
  });
});
