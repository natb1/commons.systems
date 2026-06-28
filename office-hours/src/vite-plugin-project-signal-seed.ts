import type { Plugin } from "vite";
import { projectSignalSeeds } from "./project-signal-seeds.js";

const VIRTUAL_MODULE_ID = "virtual:office-hours-project-signal-seed-data";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function projectSignalSeedPlugin(): Plugin {
  let moduleCode: string | undefined;

  return {
    name: "office-hours-project-signal-seed-data",
    buildStart() {
      // Strip memberEmails (a denormalized auth field holding real email
      // addresses) before serializing — it must never be baked into the
      // public JS bundle. The UI never reads it; Firestore rules gate access
      // server-side. computedAtOffsetMin is also omitted: it is converted to
      // computedAt at build time below.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure-omit memberEmails from the public bundle // type-safety-ok: deliberate destructure-omit to exclude memberEmails and computedAtOffsetMin from the public bundle
      const { memberEmails, computedAtOffsetMin, ...rest } = projectSignalSeeds;
      moduleCode =
        `const seed = ${JSON.stringify(rest)};\n` +
        `const now = Date.now();\n` +
        `export default { ...seed, computedAt: new Date(now - ${computedAtOffsetMin} * 60000) };\n`;
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        if (!moduleCode) throw new Error("office-hours-project-signal-seed-data: load called before buildStart");
        return moduleCode;
      }
    },
  };
}
