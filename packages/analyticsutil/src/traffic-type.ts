/**
 * localStorage key for the persistent internal/organic traffic flag. The GA4
 * `traffic_type` user property is derived from it (see `initAnalytics`).
 *
 * Shared with the Playwright harness
 * (`@commons-systems/config/playwright-test`), which seeds this key so CI smoke
 * traffic is tagged `internal` rather than polluting the organic segment. It
 * lives in its own import-light module (no firebase/web-vitals imports) so the
 * Node-side Playwright helper can import the constant without pulling the
 * browser analytics SDK into its module graph. Keeping one source of truth
 * means a rename can never silently make CI smoke traffic count as organic.
 */
export const TRAFFIC_TYPE_STORAGE_KEY = "analytics_traffic_type";
