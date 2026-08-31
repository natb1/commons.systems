import { describe, expect, it } from "vitest";
import type { IntentionNode } from "../src/schema.js";
import {
  buildRows,
  renderCensus,
  parseEntryDate,
  UNRECORDED,
  COMPLETENESS_QUESTION,
  CATEGORY_PROMPTS,
  type EntryDateLookup,
} from "../scripts/ledger-census.js";

/** Build an IntentionNode fixture, filling required/default fields. */
function node(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind ?? "delegation",
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
    status: partial.status ?? "codified",
    parent: partial.parent ?? null,
    serves: partial.serves ?? [],
    recovers: partial.recovers ?? [],
    rationale: partial.rationale ?? null,
    reading: partial.reading ?? null,
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attention: partial.attention ?? null,
    phase: partial.phase ?? null,
    execution: partial.execution ?? null,
    validates: partial.validates ?? [],
    blocked_by: partial.blocked_by ?? [],
    superseded_by: partial.superseded_by ?? [],
    supersession_expiry: partial.supersession_expiry ?? null,
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/** A lookup backed by a plain id→date map; missing ids render UNRECORDED. */
function lookup(map: Record<string, string>): EntryDateLookup {
  return (id: string) => map[id] ?? UNRECORDED;
}

describe("buildRows", () => {
  it("excludes non-delegation kinds", () => {
    const nodes = [
      node({ id: "delegation-a" }),
      node({ id: "strategy-x", kind: "strategy" }),
      node({ id: "tactic-y", kind: "tactic" }),
      node({ id: "delegation-b" }),
    ];
    const rows = buildRows(nodes, lookup({ "delegation-a": "2026-07-01", "delegation-b": "2026-07-02" }));
    expect(rows.map((r) => r.id)).toEqual(["delegation-a", "delegation-b"]);
  });

  it("sorts by entry date ascending, with unrecorded last", () => {
    const nodes = [
      node({ id: "delegation-late" }),
      node({ id: "delegation-early" }),
      node({ id: "delegation-untracked" }),
      node({ id: "delegation-mid" }),
    ];
    const rows = buildRows(
      nodes,
      lookup({
        "delegation-late": "2026-07-09",
        "delegation-early": "2026-07-01",
        "delegation-mid": "2026-07-05",
        // delegation-untracked absent → UNRECORDED
      }),
    );
    expect(rows.map((r) => r.id)).toEqual([
      "delegation-early",
      "delegation-mid",
      "delegation-late",
      "delegation-untracked",
    ]);
    expect(rows[3].entry).toBe(UNRECORDED);
  });

  it("renders '-' for absent last_assessed and origin", () => {
    const nodes = [
      node({ id: "delegation-bare", attributes: {} }),
      node({
        id: "delegation-full",
        attributes: { last_assessed: "2026-07-02", origin: "chosen" },
      }),
    ];
    const rows = buildRows(
      nodes,
      lookup({ "delegation-bare": "2026-07-03", "delegation-full": "2026-07-02" }),
    );
    const bare = rows.find((r) => r.id === "delegation-bare");
    expect(bare?.lastAssessed).toBe("-");
    expect(bare?.origin).toBe("-");
    const full = rows.find((r) => r.id === "delegation-full");
    expect(full?.lastAssessed).toBe("2026-07-02");
    expect(full?.origin).toBe("chosen");
  });
});

describe("parseEntryDate", () => {
  it("returns the last line as the earliest add (git lists newest-first)", () => {
    // Newest-first: the record was re-added at 2026-07-09, first added 2026-07-01.
    expect(parseEntryDate("2026-07-09\n2026-07-05\n2026-07-01\n")).toBe("2026-07-01");
  });

  it("returns the single line when there is only one add", () => {
    expect(parseEntryDate("2026-07-01\n")).toBe("2026-07-01");
  });

  it("returns UNRECORDED for empty output", () => {
    expect(parseEntryDate("")).toBe(UNRECORDED);
  });

  it("ignores trailing/blank lines when picking the last date", () => {
    expect(parseEntryDate("2026-07-09\n2026-07-01\n\n")).toBe("2026-07-01");
  });
});

describe("renderCensus", () => {
  const nodes = [
    node({
      id: "delegation-full",
      status: "codified",
      attributes: { last_assessed: "2026-07-02", origin: "inherited" },
    }),
    node({ id: "delegation-untracked" }),
  ];
  const rows = buildRows(nodes, lookup({ "delegation-full": "2026-07-02" }));
  const out = renderCensus(rows);

  it("prints a header row and each record", () => {
    expect(out).toContain("ID");
    expect(out).toContain("ENTRY");
    expect(out).toContain("LAST ASSESSED");
    expect(out).toContain("delegation-full");
    expect(out).toContain("delegation-untracked");
    expect(out).toContain(UNRECORDED);
  });

  it("prints the record count", () => {
    expect(out).toContain("2 delegation records.");
  });

  it("prints the completeness question and category prompts", () => {
    expect(out).toContain(COMPLETENESS_QUESTION);
    for (const prompt of CATEGORY_PROMPTS) {
      expect(out).toContain(prompt);
    }
  });

  it("singularizes the count for one record", () => {
    const one = renderCensus(buildRows([node({ id: "delegation-solo" })], lookup({})));
    expect(one).toContain("1 delegation record.");
  });
});
