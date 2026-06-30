import { collection, doc, getDoc, getDocs, query, where, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import { logError } from "@commons-systems/errorutil/log";
import { classifyError } from "@commons-systems/errorutil/classify";
import seedReminders from "virtual:office-hours-seed-data";
import seedQueueMetrics from "virtual:office-hours-queue-seed";
import type { Reminder } from "./reminders.js";
import { parseQueueMetrics, type QueueMetricsSnapshot } from "./queue-metrics.js";

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

export async function getOwnerReminders(
  db: Firestore,
  namespace: Namespace,
  user: User,
): Promise<Reminder[]> {
  if (!user.email) return [];
  const path = nsCollectionPath(namespace, "items");
  const q = query(collection(db, path), where("memberEmails", "array-contains", user.email));
  const snapshot = await getDocs(q);
  const reminders: Reminder[] = [];
  for (const d of snapshot.docs) {
    const reminder = toReminder(d.id, d.data());
    if (reminder) reminders.push(reminder);
  }
  return reminders;
}

export async function getOwnerQueueMetrics(
  db: Firestore,
  namespace: Namespace,
  user: User,
): Promise<QueueMetricsSnapshot | null> {
  if (!user.email) return null;
  let snap;
  try {
    snap = await getDoc(doc(db, nsCollectionPath(namespace, "metrics"), "dispatch-queue"));
  } catch (err) {
    if (classifyError(err) === "permission-denied") return null;
    throw err;
  }
  if (!snap.exists()) return null;
  // parseQueueMetrics returns null and logs on bad data; null propagates to QueueMetricsPanel which shows the empty placeholder
  return parseQueueMetrics(snap.data());
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
