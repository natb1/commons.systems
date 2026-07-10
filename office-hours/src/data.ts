import seedReminders from "virtual:office-hours-seed-data";
import seedQueueMetrics from "virtual:office-hours-queue-seed";
import type { Reminder } from "./reminders.js";
import { type QueueMetricsSnapshot } from "./queue-metrics.js";

// `toReminder` now lives in reminders.ts (a non-vite module every consumer can
// load — the firebase-admin producer cannot load THIS file's virtual: seed
// imports). Re-exported for existing importers of `./data.js`.
export { toReminder } from "./reminders.js";

export function getDemoReminders(): Reminder[] {
  return seedReminders.map((s) => ({
    jitKey: s.jitKey,
    title: s.title,
    repo: s.repo,
    issueNumber: s.issueNumber,
    dueAt: s.dueAt,
  }));
}

export function getDemoQueueMetrics(): QueueMetricsSnapshot {
  return {
    openHelpWanted: seedQueueMetrics.openHelpWanted,
    closedPerDay: seedQueueMetrics.closedPerDay,
    createdPerDay: seedQueueMetrics.createdPerDay,
    netDrainPerDay: seedQueueMetrics.netDrainPerDay,
    runwayDays: seedQueueMetrics.runwayDays,
    windowDays: seedQueueMetrics.windowDays,
    computedAt: seedQueueMetrics.computedAt,
    groupId: seedQueueMetrics.groupId,
    // memberEmails is a denormalized auth field stripped from the public seed
    // bundle (see vite-plugin-queue-seed.ts); the demo snapshot carries none.
    memberEmails: [],
    // parked is hardcoded here rather than read from the virtual module: the
    // vite plugin serializes the seed via JSON.stringify (see
    // vite-plugin-queue-seed.ts), which turns Date objects into ISO strings and
    // would break parseQueueMetrics's toDate() helper (it only accepts Date or
    // Timestamp). Keeping the demo parked items as live Date objects here avoids
    // that incompatibility.
    parked: [
      {
        number: 1466,
        title: "office-hours: surface parked dispatch:office-hours work on the dashboard",
        url: "https://github.com/natb1/commons.systems/issues/1466",
        createdAt: new Date("2026-05-15T10:00:00Z"),
        repo: "natb1/commons.systems",
        phase: "dispatch:plan",
      },
      {
        number: 1403,
        title: "dispatch: stop re-parking idle polling workers on every heartbeat",
        url: "https://github.com/natb1/commons.systems/issues/1403",
        createdAt: new Date("2026-04-28T14:30:00Z"),
        repo: "natb1/commons.systems",
      },
    ],
  };
}
