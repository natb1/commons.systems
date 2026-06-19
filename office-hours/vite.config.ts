import { createAppConfig } from "@commons-systems/config/vite";
import { officeHoursSeedDataPlugin } from "./src/vite-plugin-seed-data";
import { usageSamplesSeedDataPlugin } from "./src/vite-plugin-usage-samples-seed";
import { issueSamplesSeedDataPlugin } from "./src/vite-plugin-issue-samples-seed";
import { officeHoursQueueSeedPlugin } from "./src/vite-plugin-queue-seed";
import { auditAggregateSeedPlugin } from "./src/vite-plugin-audit-aggregate-seed";

// optimizeDeps target: Vite's default dep-prebundling target ('modules', which
// includes firefox78) makes esbuild 0.28.x try to downlevel rest-destructuring
// in @firebase/analytics and @firebase/firestore it cannot transform, crashing
// `vite` at startup. Pin dev prebundling to es2022 — matching the production
// build.target in the shared appBase — so esbuild leaves the syntax untouched.
export default createAppConfig({
  plugins: [
    officeHoursSeedDataPlugin(),
    usageSamplesSeedDataPlugin(),
    issueSamplesSeedDataPlugin(),
    officeHoursQueueSeedPlugin(),
    auditAggregateSeedPlugin(),
  ],
  optimizeDeps: { esbuildOptions: { target: "es2022" } },
});
