// The office-hours local-snapshot WIRE CONTRACT: one shared home for the on-disk
// snapshot type and the serialize/decode pair, imported by BOTH the
// firebase-admin producer (`office-hours-snapshot/src/`) and the reader dashboard
// (`office-hours/src/`).
//
// Why this module exists: the producer used to define its own write shape and
// the reader its own read shape, each deep-importing the other's internals via
// `../../office-hours/src/*.js`. The two shapes drifted (the producer never
// emitted `version`, and dropped the `memberEmails` auth field every sample
// parser requires), and mock runners / hand-built fixtures kept both isolated
// suites green around a pipeline that could not actually work end-to-end. A
// single serialize→decode contract, exercised by a no-mock round-trip test, is
// the structural fix.
//
// Loadability: this module is imported at runtime by the firebase-admin
// producer, so every import here must be node-loadable. It reuses the
// office-hours per-field parsers (all node-safe — the producer already loads
// them) and `toReminder` (extracted to reminders.ts, away from data.ts's
// `virtual:` seed imports), and throws `SnapshotValidationError` from its own
// zero-dependency module (NOT crypto.ts, whose `@commons-systems/crypto` pulls a
// browser Worker). `decrypt` stays in the reader's `loadSnapshotPanelData`.

import { serializeQueueMetrics, parseQueueMetrics } from "./queue-metrics.js";
import type { QueueMetricsSnapshot } from "./queue-metrics.js";
import { toUsageSample, type UsageSample } from "./usage-samples.js";
import { toIssueSample, type IssueSample } from "./issue-samples.js";
import { toReminder, type Reminder } from "./reminders.js";
import { toTopicUsage, type TopicUsageDoc } from "./topic-usage.js";
import { parseProjectSignals, type ProjectSignalsSnapshot } from "./project-signals.js";
import type { PanelData } from "./panel-equality.js";
import { SnapshotValidationError } from "./snapshot-error.js";

export { SnapshotValidationError };

// ---------------------------------------------------------------------------
// Serialized-shape transform
// ---------------------------------------------------------------------------

/**
 * Mechanically rewrites a domain type to its JSON-safe serialized form by
 * replacing every `Date` (at any depth) with an ISO `string`. Reuses the
 * office-hours domain types rather than redefining their field shapes.
 */
type IsoDates<T> =
  T extends Date ? string :
  T extends (infer U)[] ? IsoDates<U>[] :
  T extends object ? { [K in keyof T]: IsoDates<T[K]> } :
  T;

/**
 * A serialized usage/issue SERIES sample carries the office-hours domain fields
 * (Dates → ISO strings) PLUS the denormalized `memberEmails` auth field. The
 * domain `UsageSample`/`IssueSample` types STRIP `memberEmails` (it is a
 * Firestore security-rule field, not a dashboard field), but the reader's
 * `toUsageSample`/`toIssueSample` parsers REJECT a doc that lacks it. So the wire
 * MUST carry it on every sample even though the reader then drops it again.
 */
export type SerializedUsageSample = IsoDates<UsageSample> & { memberEmails: string[] };
export type SerializedIssueSample = IsoDates<IssueSample> & { memberEmails: string[] };
export type SerializedReminder = IsoDates<Reminder>;
export type SerializedQueueMetrics = IsoDates<QueueMetricsSnapshot>;
export type SerializedProjectSignals = IsoDates<ProjectSignalsSnapshot>;

// ---------------------------------------------------------------------------
// Snapshot metadata types
// ---------------------------------------------------------------------------

/** Whether this snapshot carries the full dashboard or only parked issues. */
export type SnapshotScope = "full" | "parked-only";

/**
 * Coarse chain-health signals. Deliberately open/optional — an absent metric is
 * normal (e.g. the tick age is unknown until the first run).
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
 * The encrypted local snapshot document — the SINGLE on-disk wire shape both the
 * producer and the reader conform to. Plain-JSON-safe: no `Date` or `Timestamp`
 * instances survive — every timestamp is an ISO string.
 *
 * Field provenance (mirrors PanelData in panel-equality.ts exactly):
 *   - `samples`, `issueSamples` — append-only SERIES, carried as bounded
 *     windows (see `window`); each element carries `memberEmails`.
 *   - `reminders`, `queueMetrics`, `topicUsage`, `projectSignals` — current
 *     single snapshots (queueMetrics/projectSignals mutate in place).
 */
export interface OfficeHoursSnapshot {
  /** Wire-format version. The reader rejects any value other than 1. */
  version: 1;
  /** When the producer computed this snapshot (ISO string). */
  computedAt: string;
  /** Full dashboard vs parked-only capture. */
  scope: SnapshotScope;
  /** Coarse chain-health signals. */
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
 * Back-compat alias for the reader's historical name. It is the SAME type — the
 * whole point of this module is that there is one shape, not a read shape and a
 * write shape.
 */
export type OfficeHoursSnapshotV1 = OfficeHoursSnapshot;

/**
 * The assembled in-memory payload handed to `serializeSnapshot`: the six
 * dashboard fields in their core-emitted form (Dates / firebase Timestamps)
 * plus producer metadata and the group's `memberEmails`.
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
  /**
   * The group's denormalized member emails. Stamped onto every serialized
   * series sample so the reader's `toUsageSample`/`toIssueSample` parsers
   * (which require the field) accept them. A single group-level list — samples
   * do not carry it individually in the domain types.
   */
  memberEmails: string[];
}

// ---------------------------------------------------------------------------
// Timestamp normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes a timestamp-bearing value to an ISO string. The reader parses plain
 * JSON, so every form a producer can emit must collapse to a string here. Three
 * input forms, detected structurally:
 *
 *   (a) a firebase-admin/-client `Timestamp` — has a `.toDate()` method →
 *       `.toDate().toISOString()`.
 *   (b) a plain `Date` → `.toISOString()`.
 *   (c) a `FieldValue.serverTimestamp()` SENTINEL — no concrete time, not a
 *       `Date`, no `.toDate()` → substitute the producer's `now`.
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

function serializeUsageSample(
  s: UsageSample,
  now: string,
  memberEmails: string[],
): SerializedUsageSample {
  return {
    sampledAt: toIso(s.sampledAt, now),
    fiveHourUsedPct: s.fiveHourUsedPct,
    weeklyUsedPct: s.weeklyUsedPct,
    fiveHourResetsAt: toIso(s.fiveHourResetsAt, now),
    weeklyResetsAt: toIso(s.weeklyResetsAt, now),
    activeWorkers: s.activeWorkers,
    targetWorkers: s.targetWorkers,
    groupId: s.groupId,
    memberEmails,
  };
}

function serializeIssueSample(
  s: IssueSample,
  now: string,
  memberEmails: string[],
): SerializedIssueSample {
  return {
    sampledAt: toIso(s.sampledAt, now),
    openSecurity: s.openSecurity,
    openBug: s.openBug,
    openEnhancement: s.openEnhancement,
    openOther: s.openOther,
    groupId: s.groupId,
    memberEmails,
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
 * `computedAt` is the fallback for any unresolved serverTimestamp sentinel. Every
 * series sample is stamped with the group's `memberEmails`, and the document
 * carries `version: 1` — both required by the reader's parsers.
 */
export function serializeSnapshot(input: SnapshotInput): OfficeHoursSnapshot {
  const now = toIso(input.computedAt, new Date().toISOString());

  return {
    version: 1,
    computedAt: now,
    scope: input.scope,
    chainHealth: input.chainHealth,
    // Omit `window` entirely when absent — undefined would be dropped by
    // JSON.stringify and break a deep round-trip equality check.
    ...(input.window !== undefined ? { window: input.window } : {}),
    samples: input.samples.map((s) => serializeUsageSample(s, now, input.memberEmails)),
    reminders: input.reminders.map((r) => serializeReminder(r, now)),
    queueMetrics:
      input.queueMetrics === null ? null : serializeQueueMetricsToIso(input.queueMetrics, now),
    issueSamples: input.issueSamples.map((s) => serializeIssueSample(s, now, input.memberEmails)),
    topicUsage: input.topicUsage,
    projectSignals:
      input.projectSignals === null ? null : serializeProjectSignals(input.projectSignals, now),
  };
}

// ---------------------------------------------------------------------------
// Decode (reader side)
// ---------------------------------------------------------------------------

/**
 * Strict ISO-8601 full-datetime matcher: date + `T` + time + (`Z` | `±HH:MM`),
 * with optional fractional seconds. Deliberately narrow so it never converts a
 * bare date ("2026-06-30"), a URL, a label, or a phase string into a shim —
 * those must survive untouched (topicUsage[].date stays a string; the
 * projectSignals sub-objects feed a JSON.stringify equality and must not gain
 * shim objects that serialize to `{}`).
 */
const ISO_DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * `JSON.parse` reviver that turns each strict-ISO datetime string into a
 * `{ toDate: () => new Date(iso) }` shim. JSON has no Date type, and four of the
 * per-collection parsers detect a Firestore Timestamp by `typeof x.toDate ===
 * "function"` (a plain `Date` fails that test). The reviver fires per node, so
 * nested timestamps (parked[].createdAt, the three sample dates, etc.) convert
 * for free. Any other value is returned unchanged. The parsers are NOT modified
 * — they sit on the live owner path.
 */
export function reviveTimestamps(_key: string, value: unknown): unknown {
  if (typeof value === "string" && ISO_DATETIME_RE.test(value)) {
    return { toDate: (): Date => new Date(value) };
  }
  return value;
}

/**
 * Coerces a top-level snapshot field to an array of doc maps. A missing/null
 * field is an empty collection; a present-but-non-array field is a clear
 * malformation and throws rather than silently yielding a half-populated panel.
 */
function asDocArray(value: unknown, field: string): Record<string, unknown>[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new SnapshotValidationError(`Snapshot field '${field}' must be an array.`);
  }
  return value as Record<string, unknown>[]; // type-safety-ok: Array.isArray guard above ensures the cast is safe
}

/**
 * Parses a decrypted snapshot plaintext into PanelData + a top-level
 * `computedAt` Date. Throws SnapshotValidationError on a wrong version, a
 * missing/invalid top-level `computedAt`, or a non-array collection field. Reuses
 * the SIX existing per-collection parsers unchanged (toReminder / toUsageSample /
 * toIssueSample / toTopicUsage / parseQueueMetrics / parseProjectSignals) rather
 * than re-implementing their validation.
 */
export function decodeSnapshot(plaintext: string): { data: PanelData; computedAt: Date } {
  const parsed = JSON.parse(plaintext, reviveTimestamps) as unknown; // type-safety-ok: narrowing JSON.parse's any to unknown for safe downstream checks
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new SnapshotValidationError("Snapshot is not a JSON object.");
  }
  const raw = parsed as Record<string, unknown>; // type-safety-ok: runtime object check on line above (typeof, not null, not Array) ensures safe cast

  if (raw.version !== 1) {
    throw new SnapshotValidationError(
      `Unsupported snapshot version: ${String(raw.version)} (expected 1).`,
    );
  }

  // Top-level computedAt must be read as a real Date, NOT through the shim. The
  // reviver above already rewrote raw.computedAt into a `{ toDate }` shim, so we
  // re-parse WITHOUT the reviver to recover the original ISO string. This keeps
  // the shim confined to the per-doc maps (where the parsers expect it) and the
  // staleness stamp a plain Date.
  const plain = JSON.parse(plaintext) as Record<string, unknown>; // type-safety-ok: reading only plain.computedAt string; outer object check already validated structure
  if (typeof plain.computedAt !== "string") {
    throw new SnapshotValidationError("Snapshot missing top-level 'computedAt' string.");
  }
  const computedAt = new Date(plain.computedAt);
  if (Number.isNaN(computedAt.getTime())) {
    throw new SnapshotValidationError(
      `Snapshot 'computedAt' is not a valid date: ${plain.computedAt}`,
    );
  }

  const reminders = asDocArray(raw.reminders, "reminders")
    .map((d, i) => toReminder(`reminder-${i}`, d))
    .filter((r): r is Reminder => r !== null);

  const samples = asDocArray(raw.samples, "samples")
    .map((d, i) => toUsageSample(`sample-${i}`, d))
    .filter((s): s is UsageSample => s !== null);

  const issueSamples = asDocArray(raw.issueSamples, "issueSamples")
    .map((d, i) => toIssueSample(`issue-sample-${i}`, d))
    .filter((s): s is IssueSample => s !== null);

  const topicUsage = asDocArray(raw.topicUsage, "topicUsage")
    .map((d) => toTopicUsage(d))
    .filter((t): t is TopicUsageDoc => t !== null);

  const queueMetrics = raw.queueMetrics
    ? parseQueueMetrics(raw.queueMetrics as Record<string, unknown>) // type-safety-ok: truthiness guard above ensures non-null; interface declares Record<string,unknown>|null
    : null;
  const projectSignals = raw.projectSignals
    ? parseProjectSignals(raw.projectSignals as Record<string, unknown>) // type-safety-ok: truthiness guard above ensures non-null; interface declares Record<string,unknown>|null
    : null;

  return {
    data: { samples, reminders, queueMetrics, issueSamples, topicUsage, projectSignals },
    computedAt,
  };
}
