// App configs include firebase module deduplication and happy-dom for
// browser-environment tests. Lib configs omit both — libraries that need
// happy-dom should pass it as an override.
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
  resolve: {
    dedupe: firebaseDedupe,
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
