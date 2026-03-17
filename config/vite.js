import { mergeConfig, defineConfig } from "vite";
import { defineConfig as defineTestConfig } from "vitest/config";

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

const libBase = defineTestConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});

export function createAppConfig(overrides = {}) {
  return mergeConfig(appBase, overrides);
}

export function createLibConfig(overrides = {}) {
  return mergeConfig(libBase, overrides);
}
