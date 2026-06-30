import { createAppConfig } from "@commons-systems/config/vite";
import { officeHoursSeedDataPlugin } from "./src/vite-plugin-seed-data";
import { usageSamplesSeedDataPlugin } from "./src/vite-plugin-usage-samples-seed";
import { issueSamplesSeedDataPlugin } from "./src/vite-plugin-issue-samples-seed";
import { officeHoursQueueSeedPlugin } from "./src/vite-plugin-queue-seed";
import { officeHoursIntentionTreeSeedPlugin } from "./src/vite-plugin-intention-tree-seed";
import { projectSignalSeedPlugin } from "./src/vite-plugin-project-signal-seed";

export default createAppConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  // Pin dev prebundling to es2022 — matching the production build.target in
  // shared config/vite.js — so esbuild 0.28.x leaves rest-destructuring in
  // @firebase/analytics untouched instead of crashing the dev server.
  optimizeDeps: { esbuildOptions: { target: "es2022" } },
  plugins: [
    officeHoursSeedDataPlugin(),
    usageSamplesSeedDataPlugin(),
    issueSamplesSeedDataPlugin(),
    officeHoursQueueSeedPlugin(),
    officeHoursIntentionTreeSeedPlugin(),
    projectSignalSeedPlugin(),
  ],
  // Include .test.tsx (React panel tests) alongside the vanilla .test.ts; the
  // shared appBase default only matches test/**/*.test.ts.
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
