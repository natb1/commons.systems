import { createAppConfig } from "@commons-systems/config/vite";

export default createAppConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  // Pin dev prebundling to es2022 — matching the production build.target in
  // shared config/vite.js — so esbuild 0.28.x leaves rest-destructuring in
  // @firebase/analytics untouched instead of crashing the dev server. The
  // music-metadata CJS dep (which earlier needed a raised target) pre-bundles
  // cleanly at es2022.
  optimizeDeps: { esbuildOptions: { target: "es2022" } },
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
