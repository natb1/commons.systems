import { logError } from "@commons-systems/errorutil/log";
import seedReminders from "virtual:office-hours-seed-data";
import seedQueueMetrics from "virtual:office-hours-queue-seed";
import type { Reminder } from "./reminders.js";
import { type QueueMetricsSnapshot } from "./queue-metrics.js";

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

export function toReminder(id: string, data: Record<string, unknown>): Reminder | null {
  const title = typeof data.title === "string" ? data.title : null;
  const repo = typeof data.repo === "string" ? data.repo : null;
  const issueNumber = typeof data.issueNumber === "number" ? data.issueNumber : null;
  const dueAtRaw = data.dueAt;
  const dueAt =
    dueAtRaw && typeof (dueAtRaw as { toDate?: unknown }).toDate === "function"
      ? (dueAtRaw as { toDate: () => Date }).toDate()
      : null;
  if (title === null || repo === null || issueNumber === null || dueAt === null) {
    logError(new Error("office-hours item missing required fields"), {
      operation: "reminder-validation",
      itemId: id,
    });
    return null;
  }
  let jitKey: string;
  if (typeof data.jitKey === "string") {
    jitKey = data.jitKey;
  } else {
    logError(new Error("office-hours item missing jitKey; falling back to document id"), {
      operation: "reminder-validation",
      itemId: id,
    });
    jitKey = id;
  }
  return { jitKey, title, repo, issueNumber, dueAt };
}
