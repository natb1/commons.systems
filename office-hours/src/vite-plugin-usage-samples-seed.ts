import type { Plugin } from "vite";
import { usageSampleSeeds } from "./usage-sample-seeds.js";

const VIRTUAL_MODULE_ID = "virtual:office-hours-usage-seed-data";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function usageSamplesSeedDataPlugin(): Plugin {
  let moduleCode: string;

  return {
    name: "office-hours-usage-samples-seed-data",
    buildStart() {
      // Strip memberEmails (a denormalized auth field holding real email
      // addresses) before serializing — it must never be baked into the
      // public JS bundle. The UI never reads it; Firestore rules gate access
      // server-side.
      const publicSeeds = usageSampleSeeds.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure-omit memberEmails from the public bundle
        ({ memberEmails, ...rest }) => rest,
      );
      moduleCode =
        `const seeds = ${JSON.stringify(publicSeeds)};\n` +
        `const now = Date.now();\n` +
        `export default seeds.map(({ sampledAtOffsetMin, fiveHourUsedPct, weeklyUsedPct, fiveHourResetsAtOffsetMin, weeklyResetsAtOffsetMin, activeWorkers, targetWorkers, groupId }) => ({\n` +
        `  sampledAt: new Date(now + sampledAtOffsetMin * 60000),\n` +
        `  fiveHourUsedPct,\n` +
        `  weeklyUsedPct,\n` +
        `  fiveHourResetsAt: new Date(now + fiveHourResetsAtOffsetMin * 60000),\n` +
        `  weeklyResetsAt: new Date(now + weeklyResetsAtOffsetMin * 60000),\n` +
        `  activeWorkers,\n` +
        `  targetWorkers,\n` +
        `  groupId,\n` +
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
