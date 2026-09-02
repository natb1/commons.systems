/**
 * Gap notes: the `prose-gap` arm's recorded input, and the pure derivation
 * from a gap-note record to a frontier entry.
 *
 * A GAP NOTE is a hand-authored record of a migration frontier item that no
 * mechanical check can itemize — most often a `done`-phase node whose body
 * cites deliverables absent from disk (the `done`-node exclusion every path
 * check here carries is load-bearing: a `done` body is a historical archive
 * that may legitimately name gone paths, so nothing mechanical can tell
 * "absent deliverable" from "historical citation" for it). Unit 7 of
 * `tactic-migration-frontier-projection` records this store's mechanics; the
 * `disposed_by` field is a DELIBERATELY UNCLAIMED open seam — no sibling plan
 * writes it (see `intentions/tactic-consolidation-operation.md`'s Unit 6
 * drift-review note) — so this module reads it and nothing here disposes a
 * note.
 *
 * PURE. No fs, no process, no clock — exactly `basis-pins.ts` and `shims.ts`'s
 * discipline for the arm they each add. The fs half (create-only append,
 * directory read) lives in `gap-note-store.ts`, mirroring the
 * `operational-records.ts` / `operational-store.ts` split; `frontier-reconciliation.ts`
 * reads the records in its CLI/digest layer and passes them through
 * `ReconciliationFrontierInput.gapNotes`, exactly as `checkRuns` already flows.
 *
 * REUSES `operational-records.ts`'s canonical-JSON and content-hash primitives
 * directly (`canonicalJson`, `contentHash12`) rather than reimplementing them:
 * they are already generic over `unknown` and carry no `EvidenceEntry`-specific
 * assumption. The gap-note SHAPE itself is not `evidence.v1` — it has no
 * `schema` tag and exactly the four fields
 * `{subject, detail, recorded_at, disposed_by}` the plan specifies verbatim —
 * so its own closed-key validator is written locally, mirroring
 * `operational-records.ts`'s "REJECT, DON'T IGNORE" idiom rather than importing
 * a shape that does not fit.
 *
 * `deriveGapNoteFrontier` imports `ReconciliationFrontierEntry` TYPE-ONLY:
 * `frontier-reconciliation.ts` imports this module's `deriveGapNoteFrontier` as
 * a VALUE to wire the arm in, so a value import the other way would close a
 * runtime cycle — the same discipline `basis-pins.ts` and `shims.ts` record for
 * the identical reason.
 */
import { IntentionSchemaError } from "./errors.js";
import { isPlainObject } from "./schema.js";
import { canonicalJson, contentHash12 } from "./operational-records.js";
import type { ReconciliationFrontierEntry } from "./frontier-reconciliation.js";

/** One recorded gap-note, exactly the plan's four-field shape — no more, no less. */
export interface GapNoteRecord {
  /** What is out of line — a node id, a field name, a symbol. Stable across runs. */
  subject: string;
  /** Why it is out of line, prose, one line (or a short verbatim transcription). */
  detail: string;
  /** `YYYY-MM-DD`: the date the note was recorded. */
  recorded_at: string;
  /** The disposing actor/mechanism, or `null` while the gap remains open. */
  disposed_by: string | null;
}

/** The closed key set. Order is the canonical field order. */
export const GAP_NOTE_KEYS: readonly string[] = ["subject", "detail", "recorded_at", "disposed_by"];

// --- Local guards ------------------------------------------------------------
// Mirrors criteria.ts's and operational-records.ts's own "Local guards" blocks:
// the same throw-IntentionSchemaError-naming-the-field idiom, kept local for
// the same dependency-discipline reason those two modules record.

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new IntentionSchemaError(`Expected string for ${field}, got ${typeof value}`);
  }
  if (value.trim() === "") {
    throw new IntentionSchemaError(`Expected non-empty string for ${field}`);
  }
  return value;
}

function optionalNonEmptyString(value: unknown, field: string): string | null {
  if (value == null) return null;
  return requireNonEmptyString(value, field);
}

function requireDateString(value: unknown, field: string): string {
  const s = requireNonEmptyString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new IntentionSchemaError(`Expected YYYY-MM-DD date string for ${field}, got "${s}"`);
  }
  return s;
}

/**
 * Validate a gap-note record, returning it normalized (every key present, in
 * canonical field order). Throws `IntentionSchemaError` naming the offending
 * field. Unknown keys are rejected: the note store is data the deriver reads,
 * never a hand-edited gating surface, and a smuggled field would ride along
 * unread.
 */
export function validateGapNoteRecord(value: unknown, field = "gap-note"): GapNoteRecord {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(
      `Expected a {${GAP_NOTE_KEYS.join(", ")}} object for ${field}, got ${
        value === null ? "null" : Array.isArray(value) ? "an array" : typeof value
      }`,
    );
  }
  for (const key of Object.keys(value)) {
    if (!GAP_NOTE_KEYS.includes(key)) {
      throw new IntentionSchemaError(
        `Unknown key ${field}.${key}: the gap-note shape is closed (allowed: ${GAP_NOTE_KEYS.join(", ")})`,
      );
    }
  }
  return {
    subject: requireNonEmptyString(value.subject, `${field}.subject`),
    detail: requireNonEmptyString(value.detail, `${field}.detail`),
    recorded_at: requireDateString(value.recorded_at, `${field}.recorded_at`),
    disposed_by: optionalNonEmptyString(value.disposed_by, `${field}.disposed_by`),
  };
}

// --- Canonicalization and path helpers (fs-free) -----------------------------

/** `<dir>/operational/gap-notes` — one file per record, mirroring `evidenceDir`'s layout. */
export function gapNotesDir(dir: string): string {
  return `${dir}/operational/gap-notes`;
}

/** `<YYYYMMDD>-<hash12>.json`, both halves derived from the record itself — same recipe as `evidenceFileName`. */
export function gapNoteFileName(record: GapNoteRecord): string {
  return `${record.recorded_at.replace(/-/g, "")}-${contentHash12(record)}.json`;
}

/** The one path a record may occupy — content-addressed, exactly as `evidencePath`. */
export function gapNotePath(dir: string, record: GapNoteRecord): string {
  return `${gapNotesDir(dir)}/${gapNoteFileName(record)}`;
}

/** The bytes a gap-note record occupies on disk: canonical JSON plus a trailing newline. */
export function gapNoteFileContent(record: GapNoteRecord): string {
  return `${canonicalJson(record)}\n`;
}

// --- The prose-gap arm --------------------------------------------------------

/**
 * The `prose-gap` arm: one entry per gap-note record whose `disposed_by` is
 * `null`. A disposed record (non-null `disposed_by`) is resolved and drops
 * out of the frontier — the same "absence is the frontier" shape
 * `grounding.ts` and every other arm here shares.
 *
 * Carries no criterion/authority join: a prose gap is not decided by a
 * registered check against a recorded criterion, so both fields are `null`
 * rather than invented (`ReconciliationFrontierEntry`'s own doc note on why
 * those two fields are nullable by design).
 *
 * THE ID CARRIES A CONTENT DISCRIMINATOR because `subject` alone is NOT unique:
 * the store is content-addressed over the whole record, so two open notes on
 * one subject (a node with two distinct absent-deliverable gaps, say) coexist
 * legitimately and would otherwise emit two entries under one id — breaking the
 * "stable, unique-in-practice sort key" `ReconciliationFrontierEntry` promises
 * and making an entry uncitable. `contentHash12` is the same digest the record's
 * own filename carries, so the id is stable across runs and traceable to the
 * file it came from.
 */
export function deriveGapNoteFrontier(
  records: readonly GapNoteRecord[],
): ReconciliationFrontierEntry[] {
  return records
    .filter((record) => record.disposed_by === null)
    .map((record) => ({
      kind: "prose-gap" as const,
      id: `prose-gap:${record.subject}:${contentHash12(record)}`,
      subject: record.subject,
      detail: record.detail,
      criterion: null,
      authority: null,
    }));
}
