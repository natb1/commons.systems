import type { Plugin } from "vite";
import { auditAggregateSeeds } from "./audit-aggregate-seeds.js";

const VIRTUAL_MODULE_ID = "virtual:office-hours-audit-aggregate-seed-data";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function auditAggregateSeedPlugin(): Plugin {
  let moduleCode: string;

  return {
    name: "office-hours-audit-aggregate-seed-data",
    buildStart() {
      // Strip memberEmails (a denormalized auth field holding real email
      // addresses) before serializing — it must never be baked into the
      // public JS bundle. The UI never reads it; Firestore rules gate access
      // server-side.
      const publicSeeds = auditAggregateSeeds.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure-omit memberEmails from the public bundle
        ({ memberEmails, ...rest }) => rest,
      );
      moduleCode =
        `const seeds = ${JSON.stringify(publicSeeds)};\n` +
        `const now = Date.now();\n` +
        `export default seeds.map(({ computedAtOffsetMin, windowDays, groupId, phaseSpend, cacheRead, cacheCreation }) => ({\n` +
        `  computedAt: new Date(now + computedAtOffsetMin * 60000),\n` +
        `  windowDays,\n` +
        `  groupId,\n` +
        `  phaseSpend,\n` +
        `  cacheRead,\n` +
        `  cacheCreation,\n` +
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
