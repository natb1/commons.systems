/**
 * Evidence-log folding: the operational carrier of the consolidation
 * (restatement) operation.
 *
 * A consolidation is a RESTATEMENT — a read of an append-accreted journal and a
 * write of a ledger holding its current state, citing what it consolidated.
 * `consolidation.ts` is the node carrier of that shape (clarifications and
 * bodies, behind the authority gate); this module is the second carrier, over
 * the operational evidence log. Same shape, one operation family.
 *
 * BUILT ON THE REAL STORE, NOT ON A PARALLEL CONVENTION. The plan for this unit
 * was written when `operational-records.ts` and `operational-store.ts` did not
 * exist and carried a fallback contract for that case. Both modules landed
 * (checked 2026-09-02), so the fallback does not apply and nothing here
 * re-derives the record shape. Reused verbatim: `validateEvidenceEntry` (every
 * entry that reaches the fold is validated and normalized by the owner of
 * `evidence.v1`), `evidenceFileName` (the journal ordering AND the citation
 * paths), `canonicalJson` / `recordFileContent` / `contentHash12` (the one
 * canonicalization used for both the hash and the bytes on disk),
 * `operationalDir` / `OPERATIONAL_DIRNAME`, and `createOnly` from
 * `operational-store.ts` — exported there precisely so a sibling create-only
 * store reuses the `wx` idiom rather than reimplementing it.
 *
 * THE HASH RECIPE IS INHERITED, NOT INVENTED. `hash12` is
 * `contentHash12`: the first 12 hex chars of the sha256 of the canonical JSON
 * of the record. That is `strategyFingerprint`'s recipe shape
 * (`packages/intentionsutil/src/router.ts:103-113` — sha256 over a canonical
 * JSON serialization of the substance) narrowed to 12 chars for a file name,
 * and it is the same call `evidenceFileName` makes, so the journal and the
 * ledger address content identically.
 *
 * PURE, EXCEPT ONE WRITER. The fold, the detector and the threshold are
 * fs-free, clock-free functions of their arguments. `writeEvidenceLedger` is
 * the single filesystem call in the module and is a three-line delegation to
 * `createOnly`, mirroring `appendEvidence` exactly (validate, derive the path
 * from the content, create-only). It exists so the record convention has ONE
 * call site instead of every caller re-spelling path plus bytes plus label.
 *
 * NO CLOCK. The record's date component is `folded_through` — the newest
 * `observed_at` among the folded entries — and never `now`. A fold is therefore
 * a pure function of its inputs: re-folding the same journal produces
 * byte-identical content at the same path, so the second write is a create-only
 * no-op instead of a second record. A clock would make the same fold land twice
 * on two different days. When the fold happened is recorded by git.
 *
 * CREATE-ONLY, NEVER A HOT FILE. The ledger record is a NEW file under
 * `<store>/operational/evidence-ledger/<strategy-id>/<YYYYMMDD>-<hash12>.json`,
 * one file per fold, exactly the layout that makes concurrent operational
 * writes disjoint file creations and therefore commutative under a git merge. A
 * single mutable ledger file is what the ratified layout forbids, and this
 * module does not write one.
 *
 * FOLDED ENTRIES ARE LEFT ON DISK. This unit records the fold; it never deletes
 * what it folded. Their archive is git, their removal is a separate later
 * gesture, and separating the two means a fold can never lose an entry it
 * failed to record.
 *
 * LANDING NOTE — NOTHING HERE LANDS. `graph-commit` stages EXACTLY
 * `intentions/$id.md` per node id (`packages/intentionsutil/scripts/graph-commit:1534`,
 * the "Stage exactly our id files" contract, and `:1549`, the
 * `git add -- "intentions/$id.md"` loop it describes), so no file under
 * `intentions/operational/` can reach main through it. The landing path for
 * operational records is `tactic-ladder-reconciliation-observe`'s integration
 * surface, exactly as the schema sibling's Unit 6 states. This module writes
 * records; landing them is somebody else's surface.
 *
 * OPEN SEAM — `disposed_by` IS DELIBERATELY UNCLAIMED HERE. A disposed gap-note
 * (`intentions/operational/gap-notes/<note-id>.json`, shape `{subject, detail,
 * recorded_at, disposed_by}`,
 * `intentions/tactic-migration-frontier-projection.md:710-720`) is folded by
 * this same operation — a gap-note and a `gap`-bearing evidence entry are the
 * same prose-gap subject seen from two stores. But this module does NOT write
 * `disposed_by`, and no function here touches the note store. The frontier plan
 * documents that store as data the deriver reads, never a hand-edited gating
 * surface; turning it into a surface this operation writes changes that
 * contract and needs the frontier owner's agreement, not a unilateral write.
 * Recorded as an open seam so the next reader knows the omission is a decision.
 */
import { join } from "node:path";
import type { Criterion } from "./criteria.js";
import { IntentionSchemaError } from "./errors.js";
import {
  OPERATIONAL_DIRNAME,
  canonicalJson,
  contentHash12,
  evidenceFileName,
  operationalDir,
  recordFileContent,
  validateEvidenceEntry,
  type Disposition,
  type EvidenceEntry,
  type EvidenceProof,
} from "./operational-records.js";
import { createOnly } from "./operational-store.js";
import { assertPathSafeId } from "./store.js";

export const EVIDENCE_LEDGER_SCHEMA = "evidence-ledger.v1";

/** `<store>/operational/evidence-ledger` — one subdirectory per strategy. */
export const EVIDENCE_LEDGER_DIRNAME = "evidence-ledger";

/** How many entries in a fold group share one `recurrence_key`. */
export interface RecurrenceCount {
  recurrence_key: string;
  count: number;
}

/**
 * The current state of one journal subject: one strategy plus one criterion, or
 * one strategy plus one prose gap. Exactly one of `criterion` / `gap` is
 * non-null, inherited from the entries it subsumes.
 */
export interface LedgerEntry {
  strategy: string;
  criterion: string | null;
  gap: string | null;
  /** The disposition of the newest subsumed entry, `null` included — see `foldEvidence`. */
  disposition: Disposition | null;
  /** How many journal entries this line subsumes. */
  count: number;
  /** Per-`recurrence_key` counts, ordered by key. */
  recurrences: RecurrenceCount[];
  /** `YYYY-MM-DD` of the newest subsumed entry. */
  newest_observed_at: string;
  /** `YYYY-MM-DD` of the oldest subsumed entry. */
  oldest_observed_at: string;
  /** The distinct proofs of the subsumed entries, oldest occurrence first. */
  proofs: EvidenceProof[];
}

/** The `evidence-ledger.v1` record one fold writes. */
export interface EvidenceLedgerRecord {
  schema: typeof EVIDENCE_LEDGER_SCHEMA;
  strategy: string;
  /** The newest `observed_at` folded, and the record file name's date half. */
  folded_through: string;
  entries: LedgerEntry[];
  /** The citation: store-relative paths of every folded journal entry, in journal order. */
  folds: string[];
}

export interface FoldOptions {
  /** The intentions store directory (`intentions/`). */
  dir: string;
  /** The strategy every entry must bear on; the record lives under this id. */
  strategy: string;
}

export interface EvidenceFold {
  /** The restated current state, in the deterministic order `foldEvidence` documents. */
  ledger: LedgerEntry[];
  /** Store-relative paths of the folded entries — the same array as `record.folds`. */
  folded: string[];
  /** The absolute path the ledger record occupies under `opts.dir`. */
  citation: string;
  /** The record itself, ready for `writeEvidenceLedger`. */
  record: EvidenceLedgerRecord;
}

/** One unmatched-evidence finding: an entry naming a criterion the strategy does not have. */
export interface UnmatchedEntry {
  entry: EvidenceEntry;
  /** Store-relative path of the entry, so a digest finding can cite it. */
  path: string;
  /** The criterion id that matched nothing. */
  criterion: string;
}

/** Code-unit string order, the order `readdirSync(...).sort()` and file names already agree on. */
function compare(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * The store-relative path of a journal entry:
 * `operational/evidence/<strategy>/<YYYYMMDD>-<hash12>.json`.
 *
 * Relative and POSIX-separated ON PURPOSE. The citation is part of the record's
 * content, the content determines the record's own hash and therefore its path,
 * so an absolute path would make the same fold land at different paths on two
 * machines and break idempotence.
 */
export function journalEntryPath(entry: EvidenceEntry): string {
  return [OPERATIONAL_DIRNAME, "evidence", entry.strategy, evidenceFileName(entry)].join("/");
}

/** `<dir>/operational/evidence-ledger/<strategy-id>`. */
export function evidenceLedgerDir(dir: string, strategy: string): string {
  assertPathSafeId(strategy);
  return join(operationalDir(dir), EVIDENCE_LEDGER_DIRNAME, strategy);
}

/** `<YYYYMMDD>-<hash12>.json`, both halves derived from the record itself. */
export function evidenceLedgerFileName(record: EvidenceLedgerRecord): string {
  return `${record.folded_through.replace(/-/g, "")}-${contentHash12(record)}.json`;
}

/** The one path a ledger record may occupy, content-addressed by construction. */
export function evidenceLedgerPath(dir: string, record: EvidenceLedgerRecord): string {
  return join(evidenceLedgerDir(dir, record.strategy), evidenceLedgerFileName(record));
}

/**
 * Create the ledger record, or accept an identical one already there.
 *
 * The single filesystem call in this module. Identical content at the same path
 * is a no-op success — that is re-folding the same journal, which is one fold,
 * not two. Different content at the same path throws, because the path is
 * content-addressed and a differing payload there is a hash collision, not a
 * merge (`createOnly`, `operational-store.ts`).
 *
 * @returns the path written or already holding this content.
 */
export function writeEvidenceLedger(dir: string, record: EvidenceLedgerRecord): string {
  return createOnly(
    evidenceLedgerPath(dir, record),
    recordFileContent(record),
    "evidence ledger record",
  );
}

/** The fold group a journal entry belongs to: its strategy plus its criterion-or-gap subject. */
function groupKey(entry: EvidenceEntry): string {
  return canonicalJson([entry.strategy, entry.criterion, entry.gap]);
}

/**
 * Ordering of ledger lines: strategy id, then criterion id, then recurrence
 * key, as this unit's plan states — with two additions that make the order
 * TOTAL rather than merely stated. Criterion-bearing lines precede prose-gap
 * lines (a named criterion outranks prose), gap text discriminates two gap
 * lines under one strategy, and the recurrence keys break any remaining tie.
 */
function compareLedgerEntries(a: LedgerEntry, b: LedgerEntry): number {
  const byStrategy = compare(a.strategy, b.strategy);
  if (byStrategy !== 0) return byStrategy;
  const kindRank = (entry: LedgerEntry): number => (entry.criterion === null ? 1 : 0);
  const byKind = kindRank(a) - kindRank(b);
  if (byKind !== 0) return byKind;
  const byCriterion = compare(a.criterion ?? "", b.criterion ?? "");
  if (byCriterion !== 0) return byCriterion;
  const byGap = compare(a.gap ?? "", b.gap ?? "");
  if (byGap !== 0) return byGap;
  const keys = (entry: LedgerEntry): string =>
    entry.recurrences.map((recurrence) => recurrence.recurrence_key).join(",");
  return compare(keys(a), keys(b));
}

/** Validate every input entry, naming the offending index when one is malformed. */
function validateAll(entries: readonly unknown[]): EvidenceEntry[] {
  return entries.map((entry, index) => validateEvidenceEntry(entry, `entries[${index}]`));
}

/**
 * Journal order: by file name, which is `<observed_at><hash12>` — precisely the
 * order `readEvidence` returns entries in, so "the newest entry" means the same
 * thing here and on disk. Date first, content hash as a stable tiebreaker
 * within a date, since `observed_at` is day precision and same-day entries are
 * the common case.
 */
function inJournalOrder(entries: readonly EvidenceEntry[]): EvidenceEntry[] {
  return [...entries].sort((a, b) => compare(evidenceFileName(a), evidenceFileName(b)));
}

function recurrenceCounts(group: readonly EvidenceEntry[]): RecurrenceCount[] {
  const counts = new Map<string, number>();
  for (const entry of group) {
    counts.set(entry.recurrence_key, (counts.get(entry.recurrence_key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([recurrence_key, count]) => ({ recurrence_key, count }))
    .sort((a, b) => compare(a.recurrence_key, b.recurrence_key));
}

/** The distinct proofs of a group, oldest occurrence first, compared by canonical form. */
function distinctProofs(group: readonly EvidenceEntry[]): EvidenceProof[] {
  const seen = new Set<string>();
  const proofs: EvidenceProof[] = [];
  for (const entry of group) {
    const key = canonicalJson(entry.proof);
    if (seen.has(key)) continue;
    seen.add(key);
    proofs.push(entry.proof);
  }
  return proofs;
}

function foldGroup(group: readonly EvidenceEntry[]): LedgerEntry {
  const oldest = group[0];
  const newest = group[group.length - 1];
  return {
    strategy: newest.strategy,
    criterion: newest.criterion,
    gap: newest.gap,
    disposition: newest.disposition,
    count: group.length,
    recurrences: recurrenceCounts(group),
    newest_observed_at: newest.observed_at,
    oldest_observed_at: oldest.observed_at,
    proofs: distinctProofs(group),
  };
}

/**
 * Fold one strategy's evidence journal into a ledger of current state.
 *
 * One `LedgerEntry` per (strategy, criterion-or-gap) subject, holding the
 * newest entry's `disposition`, the per-`recurrence_key` counts, the newest and
 * oldest `observed_at`, and the distinct proofs of everything it subsumes.
 *
 * "Newest disposition" is taken verbatim, `null` included. Correction in this
 * store is a superseding append, never an edit, so an entry appended after a
 * `fixed` one and carrying no disposition genuinely means "observed again, not
 * yet dispositioned" — silently keeping the older `fixed` would report a
 * recurrence as resolved.
 *
 * Deterministic end to end: entries are validated and normalized first, ordered
 * by journal order, grouped, and emitted in `compareLedgerEntries` order. No
 * clock is read. Two folds of the same journal produce byte-identical records
 * at one path.
 *
 * Throws when `entries` is empty (a fold of nothing has no `folded_through` and
 * nothing to cite) or when an entry bears on a strategy other than
 * `opts.strategy` — the record is per-strategy, so a foreign entry is a caller
 * bug, and a clear error beats silently dropping observed evidence
 * (`.claude/rules/code-style.md`).
 */
export function foldEvidence(entries: readonly unknown[], opts: FoldOptions): EvidenceFold {
  assertPathSafeId(opts.strategy);
  const validated = validateAll(entries);
  if (validated.length === 0) {
    throw new IntentionSchemaError(
      `Refusing to fold an empty evidence journal for ${opts.strategy}: a fold cites ` +
        `what it consolidated, and there is nothing to cite.`,
    );
  }
  const foreign = [...new Set(validated.map((entry) => entry.strategy))]
    .filter((strategy) => strategy !== opts.strategy)
    .sort();
  if (foreign.length > 0) {
    throw new IntentionSchemaError(
      `Evidence for ${foreign.join(", ")} was passed to a fold of ${opts.strategy}: one ` +
        `ledger record covers exactly one strategy. Read the journal per strategy ` +
        `(readEvidence(dir, strategy)) rather than folding a mixed list.`,
    );
  }

  const ordered = inJournalOrder(validated);
  const groups = new Map<string, EvidenceEntry[]>();
  for (const entry of ordered) {
    const key = groupKey(entry);
    const group = groups.get(key);
    if (group === undefined) groups.set(key, [entry]);
    else group.push(entry);
  }

  const ledger = [...groups.values()].map(foldGroup).sort(compareLedgerEntries);
  const folded = ordered.map(journalEntryPath);
  const record: EvidenceLedgerRecord = {
    schema: EVIDENCE_LEDGER_SCHEMA,
    strategy: opts.strategy,
    folded_through: ordered[ordered.length - 1].observed_at,
    entries: ledger,
    folds: folded,
  };
  return { ledger, folded, citation: evidenceLedgerPath(opts.dir, record), record };
}

/**
 * Entries whose `criterion` names no criterion in the strategy's recorded set.
 *
 * The mechanical form of the ratified rule "diff satisfying no criterion is an
 * unmatched-evidence digest finding" (`intentions/strategy-graph-native-dispatch.md`,
 * the evidence-log-compaction clarification). An entry bearing on a prose `gap`
 * is NOT unmatched: `evidence.v1` requires exactly one of criterion/gap, and a
 * gap entry is the sanctioned way to record work no criterion covers yet.
 * Flagging it would punish the honest recording of a gap.
 *
 * `criteria` is the effective set for the strategy these entries bear on —
 * `effectiveCriteria` (`criteria.ts`) is what produces it. Matching is by id;
 * pairing the right criteria with the right entries is the caller's job.
 *
 * Returns findings ordered by entry path. It never edits an entry — the store
 * has no update primitive, and a finding is a digest row, not a correction.
 */
export function unmatchedEvidence(
  entries: readonly unknown[],
  criteria: readonly Criterion[],
): UnmatchedEntry[] {
  const known = new Set(criteria.map((criterion) => criterion.id));
  const findings: UnmatchedEntry[] = [];
  for (const entry of validateAll(entries)) {
    const criterion = entry.criterion;
    if (criterion === null) continue;
    if (known.has(criterion)) continue;
    findings.push({ entry, path: journalEntryPath(entry), criterion });
  }
  return findings.sort((a, b) => compare(a.path, b.path));
}

/**
 * The canonical on-disk size of a journal, in bytes: the sum of each entry's
 * record file content. Equal to the bytes the store actually holds, because
 * `appendEvidence` writes exactly `recordFileContent(validated)`.
 */
export function journalBytes(entries: readonly unknown[]): number {
  let total = 0;
  for (const entry of validateAll(entries)) {
    total += Buffer.byteLength(recordFileContent(entry), "utf8");
  }
  return total;
}

/**
 * Whether a journal has outgrown `targetBytes` and should be folded.
 *
 * STRICTLY GREATER: a journal exactly at its budget is within budget, so the
 * threshold triggers only once the budget is exceeded.
 *
 * The budget is an ARGUMENT and has no default here, deliberately. The ratified
 * text places this in the same trigger family as materialized-context
 * compaction (`tactic-context-materialization`'s surface); a shared threshold
 * must be settable from one place when that lands, and a literal here would be
 * the duplicate that makes the shared setting impossible. A negative or
 * non-integer budget throws rather than being clamped.
 */
export function shouldFold(entries: readonly unknown[], targetBytes: number): boolean {
  if (!Number.isInteger(targetBytes) || targetBytes < 0) {
    throw new IntentionSchemaError(
      `Expected a non-negative integer byte budget for shouldFold, got ${targetBytes}. ` +
        `The budget is supplied by the caller; this function never invents one.`,
    );
  }
  return journalBytes(entries) > targetBytes;
}
