import { test as base, expect } from "@playwright/test";
import { TRAFFIC_TYPE_STORAGE_KEY } from "@commons-systems/analyticsutil/traffic-type";

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript((key: string) => {
      try {
        localStorage.setItem(key, "internal");
      } catch {
        // Opaque origins (the initial about:blank) have no accessible
        // localStorage; the flag seeds on the first real navigation.
      }
    }, TRAFFIC_TYPE_STORAGE_KEY);
    await use(context);
  },
});

export { expect };
export type { Page, Download } from "@playwright/test";
