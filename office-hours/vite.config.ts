import { createAppConfig } from "@commons-systems/config/vite";
import { officeHoursSeedDataPlugin } from "./src/vite-plugin-seed-data";
import { usageSamplesSeedDataPlugin } from "./src/vite-plugin-usage-samples-seed";
import { issueSamplesSeedDataPlugin } from "./src/vite-plugin-issue-samples-seed";
import { officeHoursQueueSeedPlugin } from "./src/vite-plugin-queue-seed";

export default createAppConfig({
  plugins: [
    officeHoursSeedDataPlugin(),
    usageSamplesSeedDataPlugin(),
    issueSamplesSeedDataPlugin(),
    officeHoursQueueSeedPlugin(),
  ],
});
