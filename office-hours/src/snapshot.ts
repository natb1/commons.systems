/**
 * Decodes a decrypted local-snapshot `.benc` plaintext into the app's PanelData
 * aggregate plus a top-level `computedAt` staleness stamp.
 *
 * This is the read-only local-snapshot counterpart to the Firestore owner path:
 * it reuses the SIX existing per-collection parsers unchanged
 * (toReminder / toUsageSample / toIssueSample / toTopicUsage / parseQueueMetrics
 * / parseProjectSignals) rather than re-implementing their validation.
 *
 * Central mechanism — JSON has no Date type. Four of those parsers detect a
 * Firestore Timestamp by testing `typeof x.toDate === "function"`, and a plain
 * JS `Date` FAILS that test. So Timestamp fields are serialized to ISO-8601
 * strings and revived here into a `{ toDate: () => new Date(iso) }` SHIM, which
 * satisfies all six parsers. The parsers are NOT modified — they sit on the live
 * owner path.
 */
import { SnapshotValidationError, decrypt } from "./crypto.js";
import { toReminder } from "./data.js";
import type { Reminder } from "./reminders.js";
import { toUsageSample, type UsageSample } from "./usage-samples.js";
import { toIssueSample, type IssueSample } from "./issue-samples.js";
import { toTopicUsage, type TopicUsageDoc } from "./topic-usage.js";
import { parseQueueMetrics } from "./queue-metrics.js";
import { parseProjectSignals } from "./project-signals.js";
import type { PanelData } from "./panel-equality.js";

/**
 * On-disk wire shape of a v1 office-hours local snapshot. Every Firestore
 * Timestamp is serialized as an ISO-8601 full-datetime UTC string (e.g.
 * "2026-06-30T10:00:00Z"); plain dates like topicUsage[].date stay bare strings.
 */
export interface OfficeHoursSnapshotV1 {
  version: 1;
  /** ISO-8601 UTC — top-level staleness watermark. */
  computedAt: string;
  /** each → toReminder(syntheticId, data) */
  reminders: Record<string, unknown>[];
  /** each → toUsageSample(syntheticId, data) */
  samples: Record<string, unknown>[];
  /** each → toIssueSample(syntheticId, data) */
  issueSamples: Record<string, unknown>[];
  /** each → toTopicUsage(data) — single-arg, no id */
  topicUsage: Record<string, unknown>[];
  /** → parseQueueMetrics(data) */
  queueMetrics: Record<string, unknown> | null;
  /** → parseProjectSignals(data) */
  projectSignals: Record<string, unknown> | null;
}

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
 * `{ toDate: () => new Date(iso) }` shim. Fires per node, so nested timestamps
 * (parked[].createdAt, the three sample dates, etc.) convert for free. Any other
 * value is returned unchanged.
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
 * missing/invalid top-level `computedAt`, or a non-array collection field.
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

/**
 * Decrypts encrypted snapshot bytes with `password`, then decodes them into
 * PanelData + a `computedAt` staleness stamp.
 */
export async function loadSnapshotPanelData(
  bytes: ArrayBuffer,
  password: string,
): Promise<{ data: PanelData; computedAt: Date }> {
  return decodeSnapshot(await decrypt(bytes, password));
}
