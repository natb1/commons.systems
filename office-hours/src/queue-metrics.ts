import { logError } from "@commons-systems/errorutil/log";

/**
 * A single point-in-time snapshot of the dispatch-queue metrics.
 * Stored at: office-hours/{env}/metrics/dispatch-queue
 */
export interface QueueMetricsSnapshot {
  /** Count of open issues labeled "help wanted" — the current queue depth. */
  openHelpWanted: number;
  /** Closed-as-complete issues per day, averaged over the trailing `windowDays` window. */
  closedPerDay: number;
  /** Created issues per day, averaged over the trailing `windowDays` window. */
  createdPerDay: number;
  /** Net drain rate: `closedPerDay − createdPerDay`. Negative means queue is growing. */
  netDrainPerDay: number;
  /**
   * Expected days until the queue empties at the current net drain rate:
   * `openHelpWanted / netDrainPerDay`. Null when `netDrainPerDay ≤ 0` (queue
   * flat or growing) — never negative or infinite.
   */
  runwayDays: number | null;
  /** Averaging window in days (14). */
  windowDays: number;
  /** Timestamp when this snapshot was computed. Stored as a Firestore Timestamp. */
  computedAt: Date;
  /** Owning group identifier. */
  groupId: string;
  /** Denormalized member emails for Firestore security-rule auth checks. */
  memberEmails: string[];
}

/**
 * Serializes a QueueMetricsSnapshot to a plain field map suitable for writing
 * to Firestore. `computedAt` is left as a Date — the SDK converts it to a
 * Timestamp automatically.
 */
export function serializeQueueMetrics(s: QueueMetricsSnapshot): Record<string, unknown> {
  return {
    openHelpWanted: s.openHelpWanted,
    closedPerDay: s.closedPerDay,
    createdPerDay: s.createdPerDay,
    netDrainPerDay: s.netDrainPerDay,
    runwayDays: s.runwayDays,
    windowDays: s.windowDays,
    computedAt: s.computedAt,
    groupId: s.groupId,
    memberEmails: s.memberEmails,
  };
}

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate();
  }
  return null;
}

/**
 * Parses a raw Firestore document map into a QueueMetricsSnapshot. Returns
 * null and logs an error if any required field is missing or has an unexpected
 * type. Handles both plain Date values and Firestore Timestamp objects (via
 * `.toDate()`).
 */
export function parseQueueMetrics(data: Record<string, unknown>): QueueMetricsSnapshot | null {
  const openHelpWanted = typeof data.openHelpWanted === "number" ? data.openHelpWanted : null;
  const closedPerDay = typeof data.closedPerDay === "number" ? data.closedPerDay : null;
  const createdPerDay = typeof data.createdPerDay === "number" ? data.createdPerDay : null;
  const netDrainPerDay = typeof data.netDrainPerDay === "number" ? data.netDrainPerDay : null;
  const windowDays = typeof data.windowDays === "number" ? data.windowDays : null;
  const groupId = typeof data.groupId === "string" ? data.groupId : null;
  const memberEmails =
    Array.isArray(data.memberEmails) && data.memberEmails.every((e) => typeof e === "string")
      ? (data.memberEmails as string[])
      : null;
  const computedAt = toDate(data.computedAt);

  let runwayDays: number | null;
  let runwayDaysValid: boolean;
  if (data.runwayDays === null) {
    runwayDays = null;
    runwayDaysValid = true;
  } else if (typeof data.runwayDays === "number") {
    runwayDays = data.runwayDays;
    runwayDaysValid = true;
  } else {
    runwayDays = null;
    runwayDaysValid = false;
  }

  if (
    openHelpWanted === null ||
    closedPerDay === null ||
    createdPerDay === null ||
    netDrainPerDay === null ||
    windowDays === null ||
    groupId === null ||
    memberEmails === null ||
    computedAt === null ||
    !runwayDaysValid
  ) {
    logError(new Error("office-hours queue metrics missing or invalid required fields"), {
      operation: "queue-metrics-validation",
    });
    return null;
  }

  return {
    openHelpWanted,
    closedPerDay,
    createdPerDay,
    netDrainPerDay,
    runwayDays,
    windowDays,
    computedAt,
    groupId,
    memberEmails,
  };
}
