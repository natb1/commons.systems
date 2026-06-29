/* global process */
import { defineConfig, devices } from "@playwright/test";

// Raise the per-navigation and per-test timeout ceilings above Playwright's
// 30s default to absorb transient GitHub-hosted-runner contention (#2381): a
// lone mid-run navigation crossing 30s under momentary CPU/IO jitter was
// flaking the @smoke meta-description test. A larger ceiling never slows a
// healthy navigation — it resolves the instant `load` fires — it only adds
// headroom for a self-resolving stall. Env-overridable, mirroring the
// EMULATOR_READY_TIMEOUT discipline in run-acceptance-tests.sh.
function navigationTimeoutMs() {
  const raw = process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT;
  if (raw === undefined || raw === "") return 60000;
  if (!/^[0-9]+$/.test(raw) || Number(raw) <= 0) {
    throw new Error(
      `PLAYWRIGHT_NAVIGATION_TIMEOUT must be a positive integer (ms); got '${raw}'`,
    );
  }
  return Number(raw);
}
const NAVIGATION_TIMEOUT = navigationTimeoutMs();

export default defineConfig({
  testDir: ".", // resolves relative to the consuming config file's directory
  timeout: NAVIGATION_TIMEOUT + 30000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    navigationTimeout: NAVIGATION_TIMEOUT,
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
