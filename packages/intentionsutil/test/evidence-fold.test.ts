import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Criterion } from "../src/criteria.js";
import { IntentionSchemaError } from "../src/errors.js";
import {
  EVIDENCE_LEDGER_SCHEMA,
  evidenceLedgerDir,
  foldEvidence,
  journalBytes,
  journalEntryPath,
  shouldFold,
  unmatchedEvidence,
  writeEvidenceLedger,
} from "../src/evidence-fold.js";
import { canonicalJson, validateEvidenceEntry } from "../src/operational-records.js";
import { appendEvidence, readEvidence } from "../src/operational-store.js";

const STRATEGY = "strategy-graph-native-dispatch";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "evidence-fold-"));
}

/**
 * Fixtures are plain objects, not typed records — the same convention
 * `operational-records.test.ts` uses, and for the same reason: the validators
 * take `unknown` by contract, so typing the fixtures would force a cast at
 * every negative call site.
 */
function evidence(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema: "evidence.v1",
    strategy: STRATEGY,
    criterion: "criterion-3",
    gap: null,
    finding: "The ladder skipped main-qa for a node carrying residue.",
    disposition: "fixed",
    proof: { sha: "0123456789abcdef0123", pr: null, stamp: null, check: null },
    recurrence_key: "mainqa-skip",
    claim: null,
    observed_at: "2026-09-01",
    ...overrides,
  };
}

function criterion(overrides: Partial<Criterion> = {}): Criterion {
  return {
    id: "criterion-3",
    statement: "Every node with residue reaches main-qa.",
    class: "functional",
    authority: "ratified",
    recorded: "2026-08-01",
    ...overrides,
  };
}

/** Oldest first by date, but deliberately NOT handed to the fold in that order. */
const OLDEST = evidence({
  criterion: "criterion-3",
  finding: "First skip, on a residue-bearing node.",
  observed_at: "2026-08-28",
  disposition: "fixed",
  recurrence_key: "mainqa-skip",
  proof: { sha: "aaaaaaaaaaaaaaaaaaaa", pr: null, stamp: null, check: null },
});

const MIDDLE = evidence({
  criterion: "criterion-3",
  finding: "The ladder stalled before main-qa.",
  observed_at: "2026-08-30",
  disposition: "refuted",
  recurrence_key: "ladder-stall",
  proof: { sha: null, pr: null, stamp: "round-7", check: null },
});

/** Newest in the criterion-3 group, and carries NO disposition. */
const NEWEST = evidence({
  criterion: "criterion-3",
  finding: "Same skip observed again after the fix landed.",
  observed_at: "2026-09-01",
  disposition: null,
  recurrence_key: "mainqa-skip",
  proof: { sha: null, pr: 42, stamp: null, check: null },
});

const OTHER_CRITERION = evidence({
  criterion: "criterion-1",
  finding: "A claim outlived its expiry.",
  observed_at: "2026-08-29",
  disposition: "fixed",
  recurrence_key: "stale-claim",
  proof: { sha: null, pr: null, stamp: null, check: "lint" },
});

const GAP_ENTRY = evidence({
  criterion: null,
  gap: "boost-node scripts are named by a done node and absent from disk",
  finding: "Three named deliverables do not exist.",
  observed_at: "2026-09-02",
  disposition: "frontier-routed",
  recurrence_key: "absent-deliverable",
  proof: { sha: null, pr: null, stamp: "census-2026-09-02", check: null },
});

const JOURNAL = [NEWEST, OTHER_CRITERION, GAP_ENTRY, OLDEST, MIDDLE];

describe("foldEvidence", () => {
  it("restates one ledger line per criterion-or-gap subject, in deterministic order", () => {
    const { ledger } = foldEvidence(JOURNAL, { dir: "/store", strategy: STRATEGY });

    expect(ledger.map((entry) => entry.criterion ?? entry.gap)).toEqual([
      "criterion-1",
      "criterion-3",
      "boost-node scripts are named by a done node and absent from disk",
    ]);
    expect(ledger.map((entry) => entry.count)).toEqual([1, 3, 1]);
  });

  it("takes the newest entry's disposition verbatim, null included", () => {
    const { ledger } = foldEvidence(JOURNAL, { dir: "/store", strategy: STRATEGY });
    const line = ledger[1];

    // The newest criterion-3 entry records a recurrence with no disposition;
    // keeping the older "fixed" would report a live recurrence as resolved.
    expect(line.disposition).toBeNull();
    expect(line.newest_observed_at).toBe("2026-09-01");
    expect(line.oldest_observed_at).toBe("2026-08-28");
  });

  it("counts recurrences per recurrence_key and subsumes the distinct proofs", () => {
    const { ledger } = foldEvidence(JOURNAL, { dir: "/store", strategy: STRATEGY });
    const line = ledger[1];

    expect(line.recurrences).toEqual([
      { recurrence_key: "ladder-stall", count: 1 },
      { recurrence_key: "mainqa-skip", count: 2 },
    ]);
    expect(line.proofs).toEqual([
      { sha: "aaaaaaaaaaaaaaaaaaaa", pr: null, stamp: null, check: null },
      { sha: null, pr: null, stamp: "round-7", check: null },
      { sha: null, pr: 42, stamp: null, check: null },
    ]);
  });

  it("collapses repeats of one proof rather than listing it twice", () => {
    const twice = [
      evidence({ finding: "Observed once.", observed_at: "2026-08-28" }),
      evidence({ finding: "Observed again.", observed_at: "2026-08-29" }),
    ];
    const { ledger } = foldEvidence(twice, { dir: "/store", strategy: STRATEGY });

    expect(ledger[0].count).toBe(2);
    expect(ledger[0].proofs).toHaveLength(1);
    expect(ledger[0].recurrences).toEqual([{ recurrence_key: "mainqa-skip", count: 2 }]);
  });

  it("cites every folded entry by its store-relative path, in journal order", () => {
    const { folded, record } = foldEvidence(JOURNAL, { dir: "/store", strategy: STRATEGY });

    expect(record.schema).toBe(EVIDENCE_LEDGER_SCHEMA);
    expect(record.folds).toEqual(folded);
    expect(folded).toHaveLength(JOURNAL.length);
    for (const path of folded) {
      expect(path.startsWith(`operational/evidence/${STRATEGY}/`)).toBe(true);
      expect(path).not.toContain("/store");
    }
    // Journal order is date-then-hash, so the oldest entry is cited first.
    expect(folded[0]).toBe(journalEntryPath(validateEvidenceEntry(OLDEST)));
    // The record's date half is the newest observation, never a clock read.
    expect(record.folded_through).toBe("2026-09-02");
  });

  it("is deterministic: input order does not change the record or its path", () => {
    const forward = foldEvidence(JOURNAL, { dir: "/store", strategy: STRATEGY });
    const reversed = foldEvidence([...JOURNAL].reverse(), { dir: "/store", strategy: STRATEGY });

    expect(canonicalJson(reversed.record)).toBe(canonicalJson(forward.record));
    expect(reversed.citation).toBe(forward.citation);
  });

  it("puts the record at operational/evidence-ledger/<strategy>/<YYYYMMDD>-<hash12>.json", () => {
    const { citation } = foldEvidence(JOURNAL, { dir: "/store", strategy: STRATEGY });

    expect(dirname(citation)).toBe(evidenceLedgerDir("/store", STRATEGY));
    expect(/^20260902-[0-9a-f]{12}\.json$/.test(citation.slice(dirname(citation).length + 1))).toBe(
      true,
    );
  });

  it("refuses a journal bearing on another strategy", () => {
    const mixed = [evidence(), evidence({ strategy: "strategy-explicit-intent" })];

    expect(() => foldEvidence(mixed, { dir: "/store", strategy: STRATEGY })).toThrow(
      IntentionSchemaError,
    );
    expect(() => foldEvidence(mixed, { dir: "/store", strategy: STRATEGY })).toThrow(
      /strategy-explicit-intent/,
    );
  });

  it("refuses an empty journal rather than writing a record citing nothing", () => {
    expect(() => foldEvidence([], { dir: "/store", strategy: STRATEGY })).toThrow(
      IntentionSchemaError,
    );
  });

  it("validates its inputs, naming the offending index", () => {
    expect(() =>
      foldEvidence([evidence(), evidence({ recurrence_key: "Not A Slug" })], {
        dir: "/store",
        strategy: STRATEGY,
      }),
    ).toThrow(/entries\[1\]\.recurrence_key/);
  });
});

describe("writeEvidenceLedger", () => {
  it("folds a journal read back off disk and lands one record", () => {
    const dir = tempDir();
    for (const entry of JOURNAL) appendEvidence(dir, entry);

    const fold = foldEvidence(readEvidence(dir, STRATEGY), { dir, strategy: STRATEGY });
    const path = writeEvidenceLedger(dir, fold.record);

    expect(path).toBe(fold.citation);
    expect(readdirSync(evidenceLedgerDir(dir, STRATEGY))).toHaveLength(1);
    expect(JSON.parse(readFileSync(path, "utf8")).folds).toEqual(fold.folded);
    // The folded entries are left untouched — this unit records, never deletes.
    expect(readEvidence(dir, STRATEGY)).toHaveLength(JOURNAL.length);
  });

  it("is idempotent: re-folding the same journal is a no-op at the same path", () => {
    const dir = tempDir();
    for (const entry of JOURNAL) appendEvidence(dir, entry);

    const first = foldEvidence(readEvidence(dir, STRATEGY), { dir, strategy: STRATEGY });
    const firstPath = writeEvidenceLedger(dir, first.record);
    const second = foldEvidence(readEvidence(dir, STRATEGY), { dir, strategy: STRATEGY });
    const secondPath = writeEvidenceLedger(dir, second.record);

    expect(secondPath).toBe(firstPath);
    expect(readdirSync(evidenceLedgerDir(dir, STRATEGY))).toEqual([
      firstPath.slice(evidenceLedgerDir(dir, STRATEGY).length + 1),
    ]);
  });

  it("refuses to overwrite differing content already at the record's path", () => {
    const dir = tempDir();
    const fold = foldEvidence(JOURNAL, { dir, strategy: STRATEGY });
    mkdirSync(dirname(fold.citation), { recursive: true });
    writeFileSync(fold.citation, '{"schema":"evidence-ledger.v1"}\n');

    expect(() => writeEvidenceLedger(dir, fold.record)).toThrow(IntentionSchemaError);
    expect(() => writeEvidenceLedger(dir, fold.record)).toThrow(/different content/);
  });
});

describe("unmatchedEvidence", () => {
  it("flags an entry naming a criterion the strategy does not have", () => {
    const criteria = [criterion({ id: "criterion-1" }), criterion({ id: "criterion-3" })];
    const stray = evidence({ criterion: "criterion-99", finding: "Bears on nothing recorded." });

    const findings = unmatchedEvidence([...JOURNAL, stray], criteria);

    expect(findings).toHaveLength(1);
    expect(findings[0].criterion).toBe("criterion-99");
    expect(findings[0].path).toBe(journalEntryPath(validateEvidenceEntry(stray)));
  });

  it("does NOT flag a legitimate prose-gap entry", () => {
    const criteria = [criterion({ id: "criterion-1" }), criterion({ id: "criterion-3" })];

    expect(unmatchedEvidence([GAP_ENTRY], criteria)).toEqual([]);
    // ... not even when the strategy has no criteria at all.
    expect(unmatchedEvidence([GAP_ENTRY], [])).toEqual([]);
  });

  it("orders findings by entry path and flags every criterion-bearing entry when the set is empty", () => {
    const findings = unmatchedEvidence(JOURNAL, []);

    expect(findings).toHaveLength(4);
    expect(findings.map((finding) => finding.path)).toEqual(
      [...findings.map((finding) => finding.path)].sort(),
    );
  });
});

describe("shouldFold", () => {
  it("triggers above the budget, and not at or below it", () => {
    const size = journalBytes(JOURNAL);

    expect(shouldFold(JOURNAL, size - 1)).toBe(true);
    expect(shouldFold(JOURNAL, size)).toBe(false);
    expect(shouldFold(JOURNAL, size + 1)).toBe(false);
  });

  it("measures the canonical bytes the store actually holds", () => {
    const dir = tempDir();
    let onDisk = 0;
    for (const entry of JOURNAL) {
      onDisk += Buffer.byteLength(readFileSync(appendEvidence(dir, entry), "utf8"), "utf8");
    }

    expect(journalBytes(JOURNAL)).toBe(onDisk);
  });

  it("refuses a budget it would have to invent or clamp", () => {
    expect(() => shouldFold(JOURNAL, -1)).toThrow(IntentionSchemaError);
    expect(() => shouldFold(JOURNAL, 1.5)).toThrow(/non-negative integer byte budget/);
  });
});
