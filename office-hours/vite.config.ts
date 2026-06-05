import { createAppConfig } from "@commons-systems/config/vite";
import { officeHoursSeedDataPlugin } from "./src/vite-plugin-seed-data";

export default createAppConfig({ plugins: [officeHoursSeedDataPlugin()] });
