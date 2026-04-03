// App configs include firebase module deduplication and happy-dom for
// browser-environment tests. Lib configs omit both — libraries that need
// happy-dom should pass it as an override.
import path from "node:path";
import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";

const firebaseDedupe = [
  "firebase",
  "firebase/app",
  "firebase/analytics",
  "firebase/auth",
  "firebase/firestore",
];

const appBase = defineConfig({
  envDir: path.resolve(import.meta.dirname, ".."),
  resolve: {
    dedupe: firebaseDedupe,
  },
  build: {
    // Higher target than Vite default ('modules'/ES2020) — fewer syntax
    // transforms during minification, producing smaller bundles.
    target: "es2022",
  },
  esbuild: {
    // Write third-party @license/@preserve banners to a separate .LEGAL.txt
    // file instead of inlining them in the bundle.
    legalComments: "linked",
  },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
  },
});

const libBase = defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});

/** @param {import('vite').UserConfig} overrides */
export function createAppConfig(overrides = {}) {
  return mergeConfig(appBase, overrides);
}

/** @param {import('vite').UserConfig} overrides */
export function createLibConfig(overrides = {}) {
  return mergeConfig(libBase, overrides);
}
