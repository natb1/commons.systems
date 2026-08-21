// checkParity — snapshot SHAPE/WIRING validation against the live Firestore.
//
// Confirms the produced local snapshot's SHAPE matches what the current
// Firestore producers write, BEFORE any cutover. This is deliberately NOT an
// independent recompute: the snapshot producer (produce.ts) shares the cores'
// compute code, so re-deriving metric values would only re-test the cores.
// checkParity is a field-presence / type / key-set diff — it never compares
// metric VALUES or series lengths (the snapshot carries bounded windows, so a
// length diff is expected and meaningless).
//
// The six dashboard fields map to these Firestore locations (namespace = `ns`):
//
//   | snapshot field   | Firestore location                | kind        |
//   |------------------|-----------------------------------|-------------|
//   | queueMetrics     | doc `${ns}/metrics/dispatch-queue`| single doc  |
//   | projectSignals   | doc `${ns}/metrics/project-signals`| single doc |
//   | reminders        | collection `${ns}/items` (kind=reminder) | collection |
//   | issueSamples     | collection `${ns}/issue-samples`  | collection  |
//   | topicUsage       | collection `${ns}/topic-usage`    | collection  |
//   | samples          | collection `${ns}/usage-samples`  | collection  |
//
// Comparison reference — the load-bearing asymmetry:
//   - SINGLE DOCS (queueMetrics, projectSignals) diff against the RAW Firestore
//     doc. Those snapshot fields CARRY `memberEmails` (it is part of
//     QueueMetricsSnapshot / ProjectSignalsSnapshot, and both serializers emit
//     it), so the raw doc's key set matches the snapshot's.
//   - COLLECTIONS (reminders, issueSamples, topicUsage, samples) diff against the
//     PARSED/mapped reference, NOT the raw doc: the office-hours parsers drop
//     fields the snapshot never carries — the write-only `kind` / `updatedAt`,
//     and the `memberEmails` auth field the serialized SERIES samples
//     deliberately omit (the offline wire never exports the group ACL; see
//     office-hours/src/snapshot-wire.ts) — so a raw-doc comparison would falsely
//     report them as missing keys on every clean element. The parsers still run
//     in their default strict mode here, so a live Firestore sample doc that has
//     LOST its memberEmails auth field is still caught, as a "parse-failure".
//
// Parsers reused (a parser that returns null / throws on a live Firestore doc is
// itself a shape divergence — reported as kind "parse-failure"):
//   - parseQueueMetrics   (office-hours/src/queue-metrics.ts)   — queueMetrics
//   - parseProjectSignals (office-hours/src/project-signals.ts) — projectSignals
//   - toIssueSample       (office-hours/src/issue-samples.ts)   — issueSamples
//   - toUsageSample       (office-hours/src/usage-samples.ts)   — samples
//   - toTopicUsage        (office-hours/src/topic-usage.ts)     — topicUsage
//   reminders has NO standalone Firestore parser (`toReminder` lives in a
//   vite virtual-import module this package cannot load — see produce.ts), so it
//   is mapped + validated inline here, mirroring produce.ts's inline mapping.

import { parseQueueMetrics } from "../../office-hours/src/queue-metrics.js";
import { parseProjectSignals } from "../../office-hours/src/project-signals.js";
import { toIssueSample } from "../../office-hours/src/issue-samples.js";
import { toUsageSample } from "../../office-hours/src/usage-samples.js";
import { toTopicUsage } from "../../office-hours/src/topic-usage.js";

import type { OfficeHoursSnapshot } from "./snapshot.js";

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/**
 * Minimal Firestore read surface checkParity needs. Unit 9 supplies a real
 * firebase-admin-backed reader; tests supply an in-memory mock. Kept narrow so
 * this firebase-admin package's parity check can be unit-tested without a DB.
 */
export interface FirestoreReader {
  /** Read one document map at the given path, or null when it does not exist. */
  getDoc(path: string): Promise<Record<string, unknown> | null>;
  /** List every document map in the collection at the given path. */
  listCollection(path: string): Promise<Record<string, unknown>[]>;
}

/** Injected dependencies for checkParity. */
export interface ParityDeps {
  /** Reads the live (or mocked) Firestore producer output. */
  reader: FirestoreReader;
  /** Firestore namespace prefix, e.g. "office-hours/prod". */
  namespace: string;
}

/**
 * One detected shape divergence. `kind` is defined relative to the SNAPSHOT
 * (the artifact being validated):
 *   - "missing-key":  a key present in the Firestore reference but ABSENT from
 *                     the snapshot field (i.e. a Firestore doc carries a key the
 *                     snapshot lacks).
 *   - "extra-key":    a key present in the snapshot field but ABSENT from the
 *                     Firestore reference.
 *   - "type-mismatch": a key's value has incompatible shape kinds on the two
 *                     sides (after Timestamp↔ISO-string and nullable
 *                     reconciliation).
 *   - "presence":     one side has data while the other is empty/null.
 *   - "parse-failure": an office-hours parser rejected (null) or threw on the
 *                     live Firestore doc.
 */
export interface ParityDivergence {
  field: string;
  kind: "missing-key" | "extra-key" | "type-mismatch" | "presence" | "parse-failure";
  detail: string;
}

/** Structured parity result. `ok` is true exactly when `divergences` is empty. */
export interface ParityResult {
  ok: boolean;
  divergences: ParityDivergence[];
}

// ---------------------------------------------------------------------------
// Shape-kind classification + recursive diff
// ---------------------------------------------------------------------------

type ShapeKind =
  | "null"
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "timestamp"
  | "other";

/**
 * Classifies a value's SHAPE kind. A Firestore `Timestamp` is detected
 * structurally (`.toDate()` method or a `_seconds` field) and a plain `Date` is
 * folded into the same "timestamp" kind, so the snapshot's ISO-string
 * normalization reconciles cleanly (see diffValue).
 */
function shapeKind(v: unknown): ShapeKind {
  if (v === null || v === undefined) return "null";
  if (v instanceof Date) return "timestamp";
  if (Array.isArray(v)) return "array";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>; // type-safety-ok: object guard above; structural Timestamp probe by named field
    if (typeof (o as { toDate?: unknown }).toDate === "function" || "_seconds" in o) return "timestamp";
    return "object";
  }
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return t;
  return "other";
}

// Object fields whose KEYS are data, not structure (token-usage bucket maps:
// `byTopic`/`byType` keyed by topic/type name). For these the key set varies by
// data and MUST NOT be diffed — only a representative value's shape is checked.
const MAP_KEYS = new Set(["byTopic", "byType"]);

// Snapshot-only keys the hosted Firestore producer never emits: the local
// snapshot producer collects them, but parity compares against the RAW Firestore
// doc, so their presence on the snapshot side would falsely report as an
// extra-key. Excluded from the extra-key check:
//   - `forksDetail` (project-signals github sub-object) — a local-only
//     fork-and-derivative enrichment.
//   - `scope` (queueMetrics) — the parked-only capture marks its fabricated
//     depth/rate/runway placeholders with `scope: "parked-only"`; the live
//     Firestore producer never writes it (see the field doc on
//     office-hours/src/queue-metrics.ts). Without this exclusion EVERY
//     `--scope parked-only --parity` run would report a permanent, unfixable
//     divergence and mask the real drift the check exists to catch.
// Keyed by the top-level snapshot field so the exemption is narrow: a `scope`
// key appearing anywhere OTHER than queueMetrics is still reported.
const LOCAL_ONLY_KEYS = new Map<string, Set<string>>([
  ["projectSignals", new Set(["forksDetail"])],
  ["queueMetrics", new Set(["scope"])],
]);

// The MIRROR of LOCAL_ONLY_KEYS: keys the live Firestore doc carries that the
// snapshot wire deliberately STRIPS, excluded from the missing-key check.
//   - `memberEmails` (queueMetrics + projectSignals) — the group's real member
//     list. The Firestore rules require it on the doc; the offline wire never
//     carries it, because a `--plaintext` run would land the ACL unencrypted in
//     the shared Drive dir (see office-hours/src/snapshot-wire.ts). Without this
//     exclusion EVERY `--parity` run would report a permanent, unfixable
//     divergence — the same failure mode the `scope` entry above prevents.
// Keyed by top-level field for the same reason: a `memberEmails` key appearing
// anywhere OTHER than these two blocks is still reported.
const STRIPPED_KEYS = new Map<string, Set<string>>([
  ["queueMetrics", new Set(["memberEmails"])],
  ["projectSignals", new Set(["memberEmails"])],
]);

/**
 * Recursively diffs the SHAPE of a snapshot value against its Firestore/parsed
 * reference, pushing divergences for `field`. SHAPE only — scalars are compared
 * by kind, never by value, and arrays by a representative element, never length.
 *
 * Reconciliations (NOT divergences):
 *   - Firestore Timestamp / Date  ↔  snapshot ISO string.
 *   - null on either side (a nullable field carrying no value is
 *     shape-compatible; top-level presence is handled separately).
 */
function diffValue(
  field: string,
  snap: unknown,
  ref: unknown,
  label: string,
  out: ParityDivergence[],
  treatAsMap = false,
): void {
  const sk = shapeKind(snap);
  const rk = shapeKind(ref);

  // null is shape-compatible on either side (nullable field; presence handled elsewhere).
  if (sk === "null" || rk === "null") return;
  // Firestore Timestamp/Date ↔ snapshot ISO string.
  if ((sk === "string" && rk === "timestamp") || (sk === "timestamp" && rk === "string")) return;

  if (sk !== rk) {
    out.push({
      field,
      kind: "type-mismatch",
      detail: `${label}: snapshot ${sk} vs Firestore ${rk}`,
    });
    return;
  }

  if (sk === "object") {
    const snapObj = snap as Record<string, unknown>; // type-safety-ok: shapeKind narrowed both sides to object
    const refObj = ref as Record<string, unknown>; // type-safety-ok: shapeKind narrowed both sides to object (same guard as snapObj above)
    if (treatAsMap) {
      // Dynamic-keyed map: compare a representative value's shape, not the keys.
      const sv = Object.values(snapObj)[0];
      const rv = Object.values(refObj)[0];
      if (sv !== undefined && rv !== undefined) diffValue(field, sv, rv, `${label}{}`, out);
      return;
    }
    diffObject(field, snapObj, refObj, label, out);
    return;
  }

  if (sk === "array") {
    const sa = snap as unknown[]; // type-safety-ok: shapeKind narrowed both sides to array
    const ra = ref as unknown[]; // type-safety-ok: shapeKind narrowed both sides to array (same guard as sa above)
    // SHAPE only — representative element, never length.
    if (sa.length > 0 && ra.length > 0) diffValue(field, sa[0], ra[0], `${label}[0]`, out);
    return;
  }

  // Scalars (string/number/boolean/other): kinds already match — no value compare.
}

/** Diffs an object's key set (both directions) + recurses into common keys. */
function diffObject(
  field: string,
  snap: Record<string, unknown>,
  ref: Record<string, unknown>,
  label: string,
  out: ParityDivergence[],
): void {
  for (const k of Object.keys(ref)) {
    if (STRIPPED_KEYS.get(field)?.has(k)) continue; // auth field the wire deliberately strips.
    if (!(k in snap)) {
      out.push({
        field,
        kind: "missing-key",
        detail: `${label}.${k}: present in Firestore, absent from snapshot`,
      });
    }
  }
  for (const k of Object.keys(snap)) {
    if (LOCAL_ONLY_KEYS.get(field)?.has(k)) continue; // snapshot-only field the hosted producer never emits.
    if (!(k in ref)) {
      out.push({
        field,
        kind: "extra-key",
        detail: `${label}.${k}: present in snapshot, absent from Firestore`,
      });
    }
  }
  for (const k of Object.keys(ref)) {
    if (k in snap) diffValue(field, snap[k], ref[k], `${label}.${k}`, out, MAP_KEYS.has(k));
  }
}

// ---------------------------------------------------------------------------
// Parser invocation (null OR throw → parse-failure)
// ---------------------------------------------------------------------------

/**
 * Runs an office-hours parser on a live Firestore doc. A parser that returns
 * null OR throws is a shape divergence — the doc no longer matches the shape the
 * parser (and thus the dashboard) expects. Returns the parsed reference, or null
 * with a parse-failure divergence pushed.
 */
function runParser<T>(
  field: string,
  doc: Record<string, unknown>,
  parser: (doc: Record<string, unknown>) => T | null,
  out: ParityDivergence[],
): T | null {
  let parsed: T | null;
  try {
    parsed = parser(doc);
  } catch (err) {
    out.push({
      field,
      kind: "parse-failure",
      detail: `office-hours parser threw on the Firestore doc: ${err instanceof Error ? err.message : String(err)}`,
    });
    return null;
  }
  if (parsed === null) {
    out.push({
      field,
      kind: "parse-failure",
      detail: "office-hours parser rejected the Firestore doc (returned null)",
    });
    return null;
  }
  return parsed;
}

/**
 * Inline reminder validator + mapper, mirroring produce.ts (no standalone
 * Firestore parser exists for reminders). Returns the 5-field reminder reference
 * shape, or null when a required source field is missing/mistyped so reminder
 * drift still surfaces as a parse-failure. `dueAt` is left as its raw
 * Timestamp-like value so diffValue reconciles it against the snapshot's ISO
 * string.
 */
function mapReminderRef(doc: Record<string, unknown>): Record<string, unknown> | null {
  if (
    typeof doc.jitKey !== "string" ||
    typeof doc.title !== "string" ||
    typeof doc.repo !== "string" ||
    typeof doc.issueNumber !== "number" ||
    shapeKind(doc.dueAt) !== "timestamp"
  ) {
    return null;
  }
  return {
    jitKey: doc.jitKey,
    title: doc.title,
    repo: doc.repo,
    issueNumber: doc.issueNumber,
    dueAt: doc.dueAt,
  };
}

/**
 * Series-sample reference: the office-hours parser's output, unmodified. The
 * parser runs in its default STRICT mode, so a Firestore doc that is malformed
 * OR missing the required `memberEmails` auth field is rejected here and reported
 * as a parse-failure. Its output strips `memberEmails`, which is exactly the
 * serialized sample's shape — the offline wire never carries the group ACL (see
 * office-hours/src/snapshot-wire.ts), so the two key sets line up.
 */
function sampleRef(
  parse: (id: string, doc: Record<string, unknown>) => object | null,
  doc: Record<string, unknown>,
): Record<string, unknown> | null {
  const parsed = parse("parity", doc);
  if (parsed === null) return null;
  return { ...parsed }; // type-safety-ok: parsed is a validated sample object; the shape diff reads it structurally
}

// ---------------------------------------------------------------------------
// Per-field checks
// ---------------------------------------------------------------------------

/** Single-doc field: presence + parser-accepts + raw-doc shape diff. */
async function checkSingleDoc(
  field: string,
  path: string,
  snapField: Record<string, unknown> | null,
  parser: (doc: Record<string, unknown>) => unknown,
  reader: FirestoreReader,
  out: ParityDivergence[],
): Promise<void> {
  const doc = await reader.getDoc(path);
  const snapNull = snapField === null;
  const docNull = doc === null;

  if (snapNull !== docNull) {
    out.push({
      field,
      kind: "presence",
      detail: `snapshot ${snapNull ? "null" : "present"} but Firestore ${path} ${docNull ? "missing" : "present"}`,
    });
    return;
  }
  if (snapNull || doc === null) return; // both empty — nothing to compare.

  // Parser-accepts the Firestore doc (null/throw → parse-failure).
  runParser(field, doc, parser, out);
  // Shape diff: snapshot field vs the RAW Firestore doc (single-doc fields carry
  // memberEmails, so raw key sets line up).
  diffValue(field, snapField, doc, field, out);
}

/**
 * Collection field: presence + (for the representative element) parser-accepts +
 * shape diff against the PARSED/mapped reference. The parsed ref drops
 * write-only fields the snapshot also omits, so it is the correct reference.
 */
async function checkCollection(
  field: string,
  path: string,
  snapArr: unknown[],
  refOf: (doc: Record<string, unknown>) => Record<string, unknown> | null,
  reader: FirestoreReader,
  out: ParityDivergence[],
  filter?: (doc: Record<string, unknown>) => boolean,
): Promise<void> {
  let docs = await reader.listCollection(path);
  if (filter) docs = docs.filter(filter);

  const snapNonEmpty = snapArr.length > 0;
  const fsNonEmpty = docs.length > 0;

  if (snapNonEmpty !== fsNonEmpty) {
    out.push({
      field,
      kind: "presence",
      detail: `snapshot ${snapNonEmpty ? "non-empty" : "empty"} but Firestore ${path} ${fsNonEmpty ? "non-empty" : "empty"}`,
    });
    return;
  }
  if (!snapNonEmpty || !fsNonEmpty) return; // both empty — nothing to compare.

  // Representative element shape (never lengths/values — series differ by window).
  const ref = refOf(docs[0]);
  if (ref === null) {
    out.push({
      field,
      kind: "parse-failure",
      detail: "office-hours parser/mapper rejected the representative Firestore doc (returned null)",
    });
    return;
  }
  diffValue(field, snapArr[0], ref, `${field}[0]`, out);
}

// ---------------------------------------------------------------------------
// checkParity
// ---------------------------------------------------------------------------

/**
 * Validates that `snapshot`'s SHAPE/WIRING matches the current Firestore
 * producers' output. Returns a structured result; `ok` is true exactly when no
 * divergences were found. Does not throw on per-field parser failures — those
 * are reported as "parse-failure" divergences.
 */
export async function checkParity(
  snapshot: OfficeHoursSnapshot,
  deps: ParityDeps,
): Promise<ParityResult> {
  const { reader, namespace: ns } = deps;
  const divergences: ParityDivergence[] = [];

  await checkSingleDoc(
    "queueMetrics",
    `${ns}/metrics/dispatch-queue`,
    snapshot.queueMetrics,
    parseQueueMetrics,
    reader,
    divergences,
  );

  await checkSingleDoc(
    "projectSignals",
    `${ns}/metrics/project-signals`,
    snapshot.projectSignals,
    parseProjectSignals,
    reader,
    divergences,
  );

  await checkCollection(
    "reminders",
    `${ns}/items`,
    snapshot.reminders,
    mapReminderRef,
    reader,
    divergences,
    (d) => d.kind === "reminder",
  );

  await checkCollection(
    "issueSamples",
    `${ns}/issue-samples`,
    snapshot.issueSamples,
    (d) => sampleRef(toIssueSample, d),
    reader,
    divergences,
  );

  await checkCollection(
    "topicUsage",
    `${ns}/topic-usage`,
    snapshot.topicUsage,
    (d) => toTopicUsage(d) as Record<string, unknown> | null, // type-safety-ok: parsed TopicUsageDoc read structurally by the shape diff; cast supplies the Record index signature the interface lacks
    reader,
    divergences,
  );

  await checkCollection(
    "samples",
    `${ns}/usage-samples`,
    snapshot.samples,
    (d) => sampleRef(toUsageSample, d),
    reader,
    divergences,
  );

  return { ok: divergences.length === 0, divergences };
}
