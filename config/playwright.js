/* global process */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".", // resolves relative to the consuming config file's directory
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    // Tag all Playwright traffic as internal so it can be filtered from GA4 reports.
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
