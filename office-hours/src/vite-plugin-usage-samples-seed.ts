import type { Plugin } from "vite";
import { usageSampleSeeds } from "./usage-sample-seeds.js";

const VIRTUAL_MODULE_ID = "virtual:office-hours-usage-seed-data";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function usageSamplesSeedDataPlugin(): Plugin {
  let moduleCode: string;

  return {
    name: "office-hours-usage-samples-seed-data",
    buildStart() {
      moduleCode =
        `const seeds = ${JSON.stringify(usageSampleSeeds)};\n` +
        `const now = Date.now();\n` +
        `export default seeds.map(({ sampledAtOffsetMin, fiveHourUsedPct, weeklyUsedPct, fiveHourResetsAtOffsetMin, weeklyResetsAtOffsetMin, activeWorkers, targetWorkers, groupId, memberEmails }) => ({\n` +
        `  sampledAt: new Date(now + sampledAtOffsetMin * 60000),\n` +
        `  fiveHourUsedPct,\n` +
        `  weeklyUsedPct,\n` +
        `  fiveHourResetsAt: new Date(now + fiveHourResetsAtOffsetMin * 60000),\n` +
        `  weeklyResetsAt: new Date(now + weeklyResetsAtOffsetMin * 60000),\n` +
        `  activeWorkers,\n` +
        `  targetWorkers,\n` +
        `  groupId,\n` +
        `  memberEmails,\n` +
        `}));\n`;
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) return moduleCode;
    },
  };
}
