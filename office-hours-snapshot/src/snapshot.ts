// Snapshot document type + serializer for the office-hours local snapshot.
//
// This produces the single plain-JSON-safe document the #2659 reader consumes.
// It carries exactly the six dashboard PanelData fields (samples, reminders,
// queueMetrics, issueSamples, topicUsage, projectSignals — see
// ../../office-hours/src/panel-equality.ts) plus producer metadata.
//
// Design notes:
//   - The office-hours per-field TYPES are reused verbatim (imported `type`-only
//     so firebase/firestore — imported at runtime by usage-samples.ts /
//     issue-samples.ts — never enters this firebase-admin package). The field
//     shapes are NOT redefined here; the serialized shapes are mechanically
//     derived from them via the `IsoDates<T>` transform below.
//   - The only office-hours *value* reused is `serializeQueueMetrics` — the one
//     genuine plain-JSON serializer. The `*ToDoc` helpers in usage-samples.ts /
//     issue-samples.ts are Firestore-WRITE helpers (they wrap dates in
//     firebase-client `Timestamp.fromDate` and inject a denormalized
//     `memberEmails` auth field that the domain types don't even carry), so they
//     are unsuitable for plain-JSON snapshot output and are intentionally not
//     reused.
//   - Every timestamp-bearing value is normalized to an ISO string through the
//     single `toIso` helper.

import { serializeQueueMetrics } from "../../office-hours/src/queue-metrics.js";
import type { QueueMetricsSnapshot } from "../../office-hours/src/queue-metrics.js";
import type { UsageSample } from "../../office-hours/src/usage-samples.js";
import type { IssueSample } from "../../office-hours/src/issue-samples.js";
import type { Reminder } from "../../office-hours/src/reminders.js";
import type { ProjectSignalsSnapshot } from "../../office-hours/src/project-signals.js";
import type { TopicUsageDoc } from "../../office-hours/src/topic-usage.js";

// ---------------------------------------------------------------------------
// Serialized-shape transform
// ---------------------------------------------------------------------------

/**
 * Mechanically rewrites a domain type to its JSON-safe serialized form by
 * replacing every `Date` (at any depth) with an ISO `string`. Reuses the
 * office-hours domain types rather than redefining their field shapes.
 */
export type IsoDates<T> =
  T extends Date ? string :
  T extends (infer U)[] ? IsoDates<U>[] :
  T extends object ? { [K in keyof T]: IsoDates<T[K]> } :
  T;

export type SerializedUsageSample = IsoDates<UsageSample>;
export type SerializedIssueSample = IsoDates<IssueSample>;
export type SerializedReminder = IsoDates<Reminder>;
export type SerializedQueueMetrics = IsoDates<QueueMetricsSnapshot>;
export type SerializedProjectSignals = IsoDates<ProjectSignalsSnapshot>;

// ---------------------------------------------------------------------------
// Snapshot metadata types
// ---------------------------------------------------------------------------

/** Whether this snapshot carries the full dashboard or only parked issues. */
export type SnapshotScope = "full" | "parked-only";

/**
 * Coarse chain-health signals. Deliberately open/optional — Unit 6 fills it in;
 * an absent metric is normal (e.g. the tick age is unknown until the first run).
 */
export interface ChainHealth {
  liveSessions?: number;
  lastTickAgeSeconds?: number;
}

/**
 * Bound on the append-only SERIES fields. `samples` and `issueSamples` are
 * carried as bounded windows (the last N points); `queueMetrics` and
 * `projectSignals` are single current snapshots and have no window. This records
 * the N actually applied so the reader can tell a truncated series from a short
 * one.
 */
export interface SnapshotWindow {
  samples: number;
  issueSamples: number;
}

// ---------------------------------------------------------------------------
// Snapshot document + input
// ---------------------------------------------------------------------------

/**
 * The encrypted local snapshot document. Plain-JSON-safe: no `Date` or
 * `Timestamp` instances survive — every timestamp is an ISO string.
 *
 * Field provenance (mirrors PanelData in panel-equality.ts exactly):
 *   - `samples`, `issueSamples` — append-only SERIES, carried as bounded
 *     windows (see `window`).
 *   - `reminders`, `queueMetrics`, `topicUsage`, `projectSignals` — current
 *     single snapshots (queueMetrics/projectSignals mutate in place).
 */
export interface OfficeHoursSnapshot {
  /** When the producer computed this snapshot (ISO string). */
  computedAt: string;
  /** Full dashboard vs parked-only capture. */
  scope: SnapshotScope;
  /** Coarse chain-health signals (Unit 6 fills it). */
  chainHealth: ChainHealth;
  /** Bound applied to the append-only series fields. Absent when uncapped. */
  window?: SnapshotWindow;

  samples: SerializedUsageSample[];
  reminders: SerializedReminder[];
  queueMetrics: SerializedQueueMetrics | null;
  issueSamples: SerializedIssueSample[];
  topicUsage: TopicUsageDoc[];
  projectSignals: SerializedProjectSignals | null;
}

/**
 * The assembled in-memory payload handed to `serializeSnapshot`: the six
 * dashboard fields in their core-emitted form (Dates / firebase Timestamps)
 * plus producer metadata.
 */
export interface SnapshotInput {
  samples: UsageSample[];
  reminders: Reminder[];
  queueMetrics: QueueMetricsSnapshot | null;
  issueSamples: IssueSample[];
  topicUsage: TopicUsageDoc[];
  projectSignals: ProjectSignalsSnapshot | null;
  /** The producer's clock at capture time; also the sentinel fallback. */
  computedAt: Date | string;
  chainHealth: ChainHealth;
  scope: SnapshotScope;
  window?: SnapshotWindow;
}

// ---------------------------------------------------------------------------
// Timestamp normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes a timestamp-bearing value to an ISO string. The #2659 reader parses
 * plain JSON, so every form a producer can emit must collapse to a string here.
 * Three input forms, detected structurally:
 *
 *   (a) a firebase-admin/-client `Timestamp` — has a `.toDate()` method (the
 *       office-hours-sync core emits these for due dates) → `.toDate().toISOString()`.
 *   (b) a plain `Date` (the queue/signals cores emit these) → `.toISOString()`.
 *   (c) a `FieldValue.serverTimestamp()` SENTINEL — no concrete time (firebase
 *       resolves it only server-side), not a `Date`, no `.toDate()` → substitute
 *       the producer's `now`.
 *
 * A value that is ALREADY an ISO string passes through unchanged.
 */
export function toIso(value: unknown, now: string): string {
  // (a) Timestamp — check first; covers both client and admin Timestamps.
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  // (b) plain Date.
  if (value instanceof Date) return value.toISOString();
  // already-ISO string passthrough.
  if (typeof value === "string") return value;
  // (c) serverTimestamp sentinel / unknown → producer's now.
  return now;
}

// ---------------------------------------------------------------------------
// Per-field serializers
// ---------------------------------------------------------------------------

function serializeUsageSample(s: UsageSample, now: string): SerializedUsageSample {
  return {
    sampledAt: toIso(s.sampledAt, now),
    fiveHourUsedPct: s.fiveHourUsedPct,
    weeklyUsedPct: s.weeklyUsedPct,
    fiveHourResetsAt: toIso(s.fiveHourResetsAt, now),
    weeklyResetsAt: toIso(s.weeklyResetsAt, now),
    activeWorkers: s.activeWorkers,
    targetWorkers: s.targetWorkers,
    groupId: s.groupId,
  };
}

function serializeIssueSample(s: IssueSample, now: string): SerializedIssueSample {
  return {
    sampledAt: toIso(s.sampledAt, now),
    openSecurity: s.openSecurity,
    openBug: s.openBug,
    openEnhancement: s.openEnhancement,
    openOther: s.openOther,
    groupId: s.groupId,
  };
}

function serializeReminder(r: Reminder, now: string): SerializedReminder {
  return {
    jitKey: r.jitKey,
    title: r.title,
    repo: r.repo,
    issueNumber: r.issueNumber,
    dueAt: toIso(r.dueAt, now),
  };
}

/**
 * Reuses the office-hours `serializeQueueMetrics` for the field map (scalars,
 * memberEmails, parked construction incl. the optional `phase`), then ISO-ifies
 * the two date-bearing spots it leaves as Dates: top-level `computedAt` and each
 * `parked[].createdAt`.
 */
function serializeQueueMetricsToIso(
  q: QueueMetricsSnapshot,
  now: string,
): SerializedQueueMetrics {
  const base = serializeQueueMetrics(q);
  const parked = (base.parked as Array<Record<string, unknown>>).map((p) => ({ // type-safety-ok: serializeQueueMetrics returns Record<string,unknown>; parked is its known array field
    ...p,
    createdAt: toIso(p.createdAt, now),
  }));
  return {
    ...base,
    computedAt: toIso(base.computedAt, now),
    parked,
  } as SerializedQueueMetrics; // type-safety-ok: base is the reused serializer's Record<string,unknown>; the two Date fields are replaced with ISO strings to satisfy IsoDates<QueueMetricsSnapshot>
}

/**
 * The project-signals snapshot's only Date is top-level `computedAt`; the nested
 * github/ga4/gsc/psi sub-objects carry no Date at any depth (see panel-equality.ts).
 */
function serializeProjectSignals(
  p: ProjectSignalsSnapshot,
  now: string,
): SerializedProjectSignals {
  return {
    ...p,
    computedAt: toIso(p.computedAt, now),
  } as SerializedProjectSignals; // type-safety-ok: spread copies the no-Date sub-objects unchanged; only computedAt is rewritten to an ISO string
}

// ---------------------------------------------------------------------------
// Top-level serializer
// ---------------------------------------------------------------------------

/**
 * Serializes the assembled in-memory payload to the plain-JSON-safe snapshot
 * document. All timestamps become ISO strings (via `toIso`); the producer's
 * `computedAt` is the fallback for any unresolved serverTimestamp sentinel.
 */
export function serializeSnapshot(input: SnapshotInput): OfficeHoursSnapshot {
  const now = toIso(input.computedAt, new Date().toISOString());

  return {
    computedAt: now,
    scope: input.scope,
    chainHealth: input.chainHealth,
    // Omit `window` entirely when absent — undefined would be dropped by
    // JSON.stringify and break a deep round-trip equality check.
    ...(input.window !== undefined ? { window: input.window } : {}),
    samples: input.samples.map((s) => serializeUsageSample(s, now)),
    reminders: input.reminders.map((r) => serializeReminder(r, now)),
    queueMetrics:
      input.queueMetrics === null ? null : serializeQueueMetricsToIso(input.queueMetrics, now),
    issueSamples: input.issueSamples.map((s) => serializeIssueSample(s, now)),
    topicUsage: input.topicUsage,
    projectSignals:
      input.projectSignals === null ? null : serializeProjectSignals(input.projectSignals, now),
  };
}
