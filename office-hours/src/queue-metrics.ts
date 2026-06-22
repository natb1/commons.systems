import { logError } from "@commons-systems/errorutil/log";

/**
 * A parked issue waiting for office-hours attention.
 */
export interface ParkedIssue {
  /** GitHub issue number. */
  number: number;
  /** Issue title. */
  title: string;
  /** Full GitHub URL to the issue. */
  url: string;
  /** Timestamp when the issue was created. */
  createdAt: Date;
  /** Repository in "owner/name" form, e.g. "natb1/commons.systems". */
  repo: string;
  /** Best-effort dispatch residue label (e.g. "dispatch:review"); optional. */
  phase?: string;
}

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
  /** Issues currently parked awaiting office-hours attention. */
  parked: ParkedIssue[];
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
    parked: s.parked.map((p) => ({
      number: p.number,
      title: p.title,
      url: p.url,
      createdAt: p.createdAt,
      repo: p.repo,
      ...(p.phase !== undefined ? { phase: p.phase } : {}),
    })),
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
  const openHelpWanted = typeof data.openHelpWanted === "number" && Number.isFinite(data.openHelpWanted) ? data.openHelpWanted : null;
  const closedPerDay = typeof data.closedPerDay === "number" && Number.isFinite(data.closedPerDay) ? data.closedPerDay : null;
  const createdPerDay = typeof data.createdPerDay === "number" && Number.isFinite(data.createdPerDay) ? data.createdPerDay : null;
  const netDrainPerDay = typeof data.netDrainPerDay === "number" && Number.isFinite(data.netDrainPerDay) ? data.netDrainPerDay : null;
  const windowDays = typeof data.windowDays === "number" && Number.isFinite(data.windowDays) ? data.windowDays : null;
  const groupId = typeof data.groupId === "string" ? data.groupId : null;
  const memberEmails =
    Array.isArray(data.memberEmails) && data.memberEmails.every((e) => typeof e === "string")
      ? (data.memberEmails as string[])
      : null;
  const computedAt = toDate(data.computedAt);

  // Parse parked issues leniently and independently of the strict required-field
  // gate below. A missing, null, or malformed parked field must never fail the
  // whole snapshot parse — it degrades gracefully to an empty array instead.
  const parked: ParkedIssue[] = Array.isArray(data.parked)
    ? (data.parked as unknown[]).flatMap((item) => {
        if (typeof item !== "object" || item === null) return [];
        const i = item as Record<string, unknown>;
        const number = typeof i.number === "number" && Number.isFinite(i.number) ? i.number : null;
        const title = typeof i.title === "string" ? i.title : null;
        const url = typeof i.url === "string" ? i.url : null;
        const repo = typeof i.repo === "string" ? i.repo : null;
        const createdAt = toDate(i.createdAt);
        if (number === null || title === null || url === null || repo === null || createdAt === null) return [];
        const parsed: ParkedIssue = { number, title, url, createdAt, repo };
        if (typeof i.phase === "string") parsed.phase = i.phase;
        return [parsed];
      })
    : [];

  let runwayDays: number | null;
  let runwayDaysValid: boolean;
  if (data.runwayDays === null || data.runwayDays === undefined) {
    runwayDays = null;
    runwayDaysValid = true;
  } else if (typeof data.runwayDays === "number" && Number.isFinite(data.runwayDays) && data.runwayDays >= 0) {
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

  // Cross-field invariant — mirrors computeQueueMetrics in
  // functions/src/dispatch-queue-metrics.ts: runwayDays is non-null exactly when
  // the queue is draining (netDrainPerDay > 0). A snapshot violating this is
  // corrupt (e.g. netDrainPerDay > 0 with runwayDays null) — reject it at the
  // boundary rather than letting runwayReadout render a misleading verdict.
  if ((netDrainPerDay > 0) !== (runwayDays !== null)) {
    logError(new Error("office-hours queue metrics violate the runwayDays/netDrainPerDay invariant"), {
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
    parked,
  };
}
