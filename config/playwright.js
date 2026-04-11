/* global process */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".", // resolves relative to the consuming config file's directory
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    // Pre-seed localStorage with the internal-traffic flag before any page loads
    // so initAnalytics sets traffic_type=internal on the GA4 client.
    // Storage key must match STORAGE_KEY in analyticsutil/src/index.ts.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: process.env.BASE_URL || "http://localhost:5173",
          localStorage: [
            { name: "analytics_traffic_type", value: "internal" },
          ],
        },
      ],
    },
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 744, height: 1133 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1133, height: 744 },
      },
    },
  ],
});
