import seedProjectSignals from "virtual:office-hours-project-signal-seed-data";
import { type ProjectSignalsSnapshot } from "./project-signals.js";

export function getDemoProjectSignals(): ProjectSignalsSnapshot {
  return {
    computedAt: seedProjectSignals.computedAt,
    groupId: seedProjectSignals.groupId,
    // memberEmails is a denormalized auth field stripped from the public seed
    // bundle (see vite-plugin-project-signal-seed.ts); the demo snapshot carries none.
    memberEmails: [],
    ...(seedProjectSignals.github !== undefined ? { github: seedProjectSignals.github } : {}),
    ...(seedProjectSignals.ga4 !== undefined ? { ga4: seedProjectSignals.ga4 } : {}),
    ...(seedProjectSignals.gsc !== undefined ? { gsc: seedProjectSignals.gsc } : {}),
    ...(seedProjectSignals.psi !== undefined ? { psi: seedProjectSignals.psi } : {}),
  };
}
