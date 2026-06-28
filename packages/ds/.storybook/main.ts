import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: {} },
  staticDirs: ["./public"],
  // Storybook's builder leaves Vite's esbuild target unset, so Vite falls back
  // to its default browser list. esbuild then refuses to lower the
  // rest-with-defaults destructuring and `Promise.withResolvers()` in our
  // components and in Storybook's own prebundled runtime deps ("Transforming
  // destructuring to the configured target environment is not supported yet").
  // Two separate targets must be raised to es2022 (the repo's app build target),
  // because the production build (`storybook build`) and the dev server
  // (`storybook dev`) take different esbuild paths:
  //   - build.target governs the production `build-storybook` bundle.
  //   - optimizeDeps.esbuildOptions.target governs the dev server's dependency
  //     pre-bundling, where esbuild transforms node_modules deps
  //     (@storybook/react-dom-shim, @storybook/addon-docs, …). Without it,
  //     `storybook dev` crashes on startup before serving any story.
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      build: { target: "es2022" },
      optimizeDeps: { esbuildOptions: { target: "es2022" } },
    }),
};

export default config;
