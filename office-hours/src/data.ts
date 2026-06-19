import { collection, doc, getDoc, getDocs, query, where, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import { logError } from "@commons-systems/errorutil/log";
import { classifyError } from "@commons-systems/errorutil/classify";
import seedReminders from "virtual:office-hours-seed-data";
import seedQueueMetrics from "virtual:office-hours-queue-seed";
import type { OfficeHoursItem, MergePrItem } from "./reminders.js";
import { parseQueueMetrics, type QueueMetricsSnapshot } from "./queue-metrics.js";

export function getDemoReminders(): OfficeHoursItem[] {
  return seedReminders.map((s) => ({
    kind: "reminder",
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
  };
}

export async function getOwnerReminders(
  db: Firestore,
  namespace: Namespace,
  user: User,
): Promise<OfficeHoursItem[]> {
  if (!user.email) return [];
  const path = nsCollectionPath(namespace, "items");
  const q = query(collection(db, path), where("memberEmails", "array-contains", user.email));
  const snapshot = await getDocs(q);
  const reminders: OfficeHoursItem[] = [];
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
  return parseQueueMetrics(snap.data());
}

export function toReminder(id: string, data: Record<string, unknown>): OfficeHoursItem | null {
  if (data.kind === "merge-pr") {
    return toMergePrItem(id, data);
  }
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
  return { kind: "reminder", jitKey, title, repo, issueNumber, dueAt };
}

function toMergePrItem(id: string, data: Record<string, unknown>): MergePrItem | null {
  const title = typeof data.title === "string" && data.title !== "" ? data.title : null;
  const repo = typeof data.repo === "string" && data.repo !== "" ? data.repo : null;
  const issueNumber = typeof data.issueNumber === "number" ? data.issueNumber : null;
  const prTitle = typeof data.prTitle === "string" && data.prTitle !== "" ? data.prTitle : null;
  const prUrl =
    typeof data.prUrl === "string" && data.prUrl.startsWith("https://github.com/")
      ? data.prUrl
      : null;
  const prNumber =
    typeof data.prNumber === "number" && Number.isInteger(data.prNumber) && data.prNumber > 0
      ? data.prNumber
      : null;
  const prRepo = typeof data.prRepo === "string" && data.prRepo !== "" ? data.prRepo : null;
  if (
    title === null ||
    repo === null ||
    issueNumber === null ||
    prTitle === null ||
    prUrl === null ||
    prNumber === null ||
    prRepo === null
  ) {
    logError(new Error("office-hours merge-pr item missing required fields"), {
      operation: "reminder-validation",
      itemId: id,
    });
    return null;
  }
  return { kind: "merge-pr", title, repo, issueNumber, prTitle, prUrl, prNumber, prRepo };
}
