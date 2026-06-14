import type { Plugin } from "vite";
import { seedQueueMetrics } from "./seed-queue-metrics.js";

const VIRTUAL_MODULE_ID = "virtual:office-hours-queue-seed";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function officeHoursQueueSeedPlugin(): Plugin {
  let moduleCode: string | undefined;

  return {
    name: "office-hours-queue-seed",
    buildStart() {
      // Strip memberEmails (a denormalized auth field holding real email
      // addresses) before serializing — it must never be baked into the
      // public JS bundle. The UI never reads it; Firestore rules gate access
      // server-side. computedAtMinutesAgo is also omitted: it is converted to
      // computedAt at build time below.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure-omit memberEmails from the public bundle
      const { memberEmails, computedAtMinutesAgo, ...rest } = seedQueueMetrics;
      moduleCode =
        `const seed = ${JSON.stringify(rest)};\n` +
        `const now = Date.now();\n` +
        `export default { ...seed, computedAt: new Date(now - ${computedAtMinutesAgo} * 60000) };\n`;
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        if (!moduleCode) throw new Error("office-hours-queue-seed: load called before buildStart");
        return moduleCode;
      }
    },
  };
}
