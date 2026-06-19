import { createAppConfig } from "@commons-systems/config/vite";
import { budgetSeedDataPlugin } from "./src/vite-plugin-seed-data";

// optimizeDeps target: Vite's default dep-prebundling target ('modules', which
// includes firefox78) makes esbuild 0.28.x try to downlevel destructuring it
// can't transform (the `{marks = [], ...options} = {}` form in @observablehq/plot
// and rest-destructuring in @firebase/analytics), crashing `vite` at startup.
// Pin dev prebundling to es2022 — matching the production build.target in the
// shared appBase — so esbuild leaves the modern syntax untouched.
export default createAppConfig({
  plugins: [budgetSeedDataPlugin()],
  optimizeDeps: { esbuildOptions: { target: "es2022" } },
});
