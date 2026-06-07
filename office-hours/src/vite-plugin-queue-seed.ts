import type { Plugin } from "vite";
import { seedQueueMetrics } from "./seed-queue-metrics.js";

const VIRTUAL_MODULE_ID = "virtual:office-hours-queue-seed";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function officeHoursQueueSeedPlugin(): Plugin {
  let moduleCode: string;

  return {
    name: "office-hours-queue-seed",
    buildStart() {
      moduleCode =
        `const seed = ${JSON.stringify(seedQueueMetrics)};\n` +
        `const now = Date.now();\n` +
        `const { computedAtMinutesAgo, ...rest } = seed;\n` +
        `export default { ...rest, computedAt: new Date(now - computedAtMinutesAgo * 60000) };\n`;
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) return moduleCode;
    },
  };
}
