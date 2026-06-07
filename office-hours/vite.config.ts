import { createAppConfig } from "@commons-systems/config/vite";
import { officeHoursSeedDataPlugin } from "./src/vite-plugin-seed-data";
import { officeHoursQueueSeedPlugin } from "./src/vite-plugin-queue-seed";

export default createAppConfig({ plugins: [officeHoursSeedDataPlugin(), officeHoursQueueSeedPlugin()] });
