import { createAppConfig } from "@commons-systems/config/vite";
import { budgetSeedDataPlugin } from "./src/vite-plugin-seed-data";

export default createAppConfig({ plugins: [budgetSeedDataPlugin()] });
