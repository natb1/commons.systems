import { collection, getDocs, query, where, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import { logError } from "@commons-systems/errorutil/log";
import seedReminders from "virtual:office-hours-seed-data";
import seedQueueMetrics from "virtual:office-hours-queue-seed";
import type { Reminder } from "./reminders.js";
import type { QueueMetricsSnapshot } from "./queue-metrics.js";

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
    memberEmails: [...seedQueueMetrics.memberEmails],
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
