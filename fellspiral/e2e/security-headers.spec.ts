import { test, expect } from "@commons-systems/config/playwright-test";

test.describe("security headers", () => {
  test("no CSP violation errors in console", async ({ page }) => {
    const cspViolations: string[] = [];
    // The emulator connects to localhost for Firestore and Auth, which
    // violates connect-src in the production CSP (localhost is not
    // allowlisted). Google auth may also load cleardot.gif from
    // www.google.com/images/ which can trigger img-src violations.
    // These are emulator-specific and do not occur in production.
    const emulatorPattern = /localhost:\d+|www\.google\.com\/images\//;
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        msg.text().includes("Content Security Policy") &&
        !emulatorPattern.test(msg.text())
      ) {
        cspViolations.push(msg.text());
      }
    });

    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // Wait for deferred scripts to trigger potential violations. Using "load"
    // instead of "networkidle" because the Firestore emulator keeps long-lived
    // connections open, preventing networkidle from ever resolving.
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    expect(
      cspViolations,
      `CSP violations found:\n${cspViolations.join("\n")}`,
    ).toHaveLength(0);
  });
});
