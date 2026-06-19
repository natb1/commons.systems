import { createAppConfig } from "@commons-systems/config/vite";
import { budgetSeedDataPlugin } from "./src/vite-plugin-seed-data";

export default createAppConfig({
  plugins: [budgetSeedDataPlugin()],
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  optimizeDeps: { exclude: ["@commons-systems/ds"] },
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
