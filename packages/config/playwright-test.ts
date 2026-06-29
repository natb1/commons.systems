import { test as base, expect } from "@playwright/test";

// Must match STORAGE_KEY in analyticsutil/src/index.ts (a non-exported const).
const STORAGE_KEY = "analytics_traffic_type";

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript((key: string) => {
      try {
        localStorage.setItem(key, "internal");
      } catch {
        // Opaque origins (the initial about:blank) have no accessible
        // localStorage; the flag seeds on the first real navigation.
      }
    }, STORAGE_KEY);
    await use(context);
  },
});

export { expect };
export type { Page, Download } from "@playwright/test";
