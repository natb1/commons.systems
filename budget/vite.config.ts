import { createAppConfig } from "@commons-systems/config/vite";
import { configDefaults } from "vitest/config";
import { budgetSeedDataPlugin } from "./src/vite-plugin-seed-data";

export default createAppConfig({
  plugins: [budgetSeedDataPlugin()],
  test: {
    exclude: [
      ...configDefaults.exclude,
      "test/smoke/prerender.smoke.test.ts",
    ],
  },
});
