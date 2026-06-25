import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: {} },
  staticDirs: ["./public"],
  // Storybook's builder leaves build.target unset, so Vite falls back to its
  // default browser list. esbuild then refuses to lower the rest-with-defaults
  // destructuring in our components ("Transforming destructuring to the
  // configured target environment is not supported yet"). Raising the target to
  // es2022 (the repo's app build target) makes destructuring native, so esbuild
  // skips the transform.
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, { build: { target: "es2022" } }),
};

export default config;
