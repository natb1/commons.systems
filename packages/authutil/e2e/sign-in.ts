import type { Page } from "@commons-systems/config/playwright-test";

export async function signIn(
  page: Page,
  uid: string = "test-github-user",
): Promise<void> {
  // The auth module loads asynchronously via dynamic import. Wait for the
  // emulator setup to expose __signIn before calling it.
  await page.waitForFunction(
    () => typeof (window as unknown as Record<string, unknown>).__signIn === "function", // type-safety-ok: e2e helper, double-cast accesses emulator-injected __signIn on window
    { timeout: 10_000 },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate((u) => (window as any).__signIn(u), uid);
}
