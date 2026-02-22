import type { Page } from "@playwright/test";

export async function signIn(
  page: Page,
  uid: string = "test-github-user",
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate((u) => (window as any).__signIn(u), uid);
  await page.waitForSelector("#sign-out");
}
