import type { Plugin } from "vite";
import { seedReminders } from "./seed-reminders.js";

const VIRTUAL_MODULE_ID = "virtual:office-hours-seed-data";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function officeHoursSeedDataPlugin(): Plugin {
  let moduleCode: string;

  return {
    name: "office-hours-seed-data",
    buildStart() {
      moduleCode =
        `const seeds = ${JSON.stringify(seedReminders)};\n` +
        `const now = Date.now();\n` +
        `export default seeds.map(({ jitKey, title, repo, issueNumber, dueInMinutes }) => ({\n` +
        `  jitKey, title, repo, issueNumber, dueAt: new Date(now + dueInMinutes * 60000),\n` +
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
