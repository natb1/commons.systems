import { describe, expect, it } from "vitest";
import type { IntentionNode, OfficeHours } from "../src/schema.js";
import { computeReviewCoverage, renderCoverageTable } from "../src/coverage.js";

/** A well-formed office_hours record for a parked fixture node. */
function parked(reason: string): OfficeHours {
  return { reason, since: "2026-07-01", recommendation: null, session_type: "other" };
}

/** Build an IntentionNode fixture, filling required/default fields. */
function node(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind ?? "tactic",
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

/** A body map that yields empty text for every id (no frontier entries). */
function noBodies(): Map<string, string> {
  return new Map();
}

/** Look up the single row for an id, asserting exactly one exists. */
function rowFor(rows: ReturnType<typeof computeReviewCoverage>, id: string) {
  const matches = rows.filter((r) => r.id === id);
  expect(matches).toHaveLength(1);
  return matches[0];
}

describe("computeReviewCoverage — denominator", () => {
  it("includes only durable kinds; excludes tactics and unknown kinds", () => {
    const nodes = [
      node({ id: "v", kind: "virtue" }),
      node({ id: "s", kind: "strategy" }),
      node({ id: "k", kind: "kind" }),
      node({ id: "tr", kind: "tradition" }),
      node({ id: "d", kind: "delegation", attributes: { review_trigger: "x" } }),
      node({ id: "t", kind: "tactic" }),
      node({ id: "u", kind: "somethingelse" }),
    ];
    const rows = computeReviewCoverage(nodes, noBodies());
    expect(rows.map((r) => r.id).sort()).toEqual(["d", "k", "s", "tr", "v"]);
  });

  it("preserves input order of the surviving durable nodes", () => {
    const nodes = [
      node({ id: "z", kind: "virtue" }),
      node({ id: "a", kind: "strategy" }),
    ];
    const rows = computeReviewCoverage(nodes, noBodies());
    expect(rows.map((r) => r.id)).toEqual(["z", "a"]);
  });
});

describe("computeReviewCoverage — mode derivation (rule 2)", () => {
  it("delegation is mode A", () => {
    const rows = computeReviewCoverage(
      [node({ id: "d", kind: "delegation", attributes: { review_trigger: "x" } })],
      noBodies(),
    );
    expect(rowFor(rows, "d").mode).toBe("A");
  });

  it("tradition is mode A", () => {
    const rows = computeReviewCoverage([node({ id: "tr", kind: "tradition" })], noBodies());
    expect(rowFor(rows, "tr").mode).toBe("A");
  });

  it("a delegated-status node of another kind is mode A", () => {
    const rows = computeReviewCoverage(
      [node({ id: "s", kind: "strategy", status: "delegated" })],
      noBodies(),
    );
    expect(rowFor(rows, "s").mode).toBe("A");
  });

  it("an author-owned node defaults to mode B", () => {
    const rows = computeReviewCoverage(
      [node({ id: "s", kind: "strategy", status: "codified" })],
      noBodies(),
    );
    expect(rowFor(rows, "s").mode).toBe("B");
  });
});

describe("computeReviewCoverage — path precedence (rule 3)", () => {
  it("a frontier entry beats the class path", () => {
    const subject = node({ id: "strategy-x", kind: "strategy", status: "codified" });
    const entry = node({
      id: "tactic-parked-review",
      kind: "tactic",
      phase: "draft",
      office_hours: parked("review strategy-x someday"),
    });
    const bodyById = new Map<string, string>([
      ["tactic-parked-review", "This entry reviews strategy-x in prose."],
    ]);
    const rows = computeReviewCoverage([subject, entry], bodyById);
    expect(rowFor(rows, "strategy-x").path).toBe("frontier-entry:tactic-parked-review");
  });

  it("picks the lexicographically smallest entry id when several match", () => {
    const subject = node({ id: "strategy-x", kind: "strategy" });
    const bodyById = new Map<string, string>([
      ["entry-b", "names strategy-x"],
      ["entry-a", "names strategy-x"],
    ]);
    const nodes = [
      subject,
      node({ id: "entry-b", kind: "tactic", phase: "qa", office_hours: parked("r") }),
      node({ id: "entry-a", kind: "tactic", phase: "qa", office_hours: parked("r") }),
    ];
    const rows = computeReviewCoverage(nodes, bodyById);
    expect(rowFor(rows, "strategy-x").path).toBe("frontier-entry:entry-a");
  });

  it("a done-phase parked node does not count as a frontier entry", () => {
    const subject = node({ id: "strategy-x", kind: "strategy", status: "codified" });
    const doneEntry = node({
      id: "tactic-done",
      kind: "tactic",
      phase: "done",
      office_hours: parked("review strategy-x"),
    });
    const bodyById = new Map<string, string>([["tactic-done", "reviews strategy-x"]]);
    const rows = computeReviewCoverage([subject, doneEntry], bodyById);
    // Falls through to the class path, not frontier-entry.
    expect(rowFor(rows, "strategy-x").path).toBe("frontier-reachable");
  });

  it("a null-office_hours node naming the subject is not a frontier entry", () => {
    const subject = node({ id: "strategy-x", kind: "strategy", status: "codified" });
    const other = node({ id: "strategy-y", kind: "strategy", office_hours: null });
    const bodyById = new Map<string, string>([["strategy-y", "mentions strategy-x"]]);
    const rows = computeReviewCoverage([subject, other], bodyById);
    expect(rowFor(rows, "strategy-x").path).toBe("frontier-reachable");
  });
});

describe("computeReviewCoverage — class paths (rules 2b, 3, 4, 5, 6)", () => {
  it("delegation with review_trigger → event-based-review", () => {
    const rows = computeReviewCoverage(
      [node({ id: "d", kind: "delegation", attributes: { review_trigger: "runway breach" } })],
      noBodies(),
    );
    expect(rowFor(rows, "d").path).toBe("event-based-review");
  });

  it("delegation without review_trigger → MISSING", () => {
    const rows = computeReviewCoverage(
      [node({ id: "d", kind: "delegation", attributes: {} })],
      noBodies(),
    );
    expect(rowFor(rows, "d").path).toBe("MISSING");
  });

  it("delegation with an empty-string review_trigger → MISSING", () => {
    const rows = computeReviewCoverage(
      [node({ id: "d", kind: "delegation", attributes: { review_trigger: "   " } })],
      noBodies(),
    );
    expect(rowFor(rows, "d").path).toBe("MISSING");
  });

  it("tradition → reading-program", () => {
    const rows = computeReviewCoverage([node({ id: "tr", kind: "tradition" })], noBodies());
    expect(rowFor(rows, "tr").path).toBe("reading-program");
  });

  it("author-owned strategy with non-empty conditions → condition-sweep", () => {
    const rows = computeReviewCoverage(
      [node({ id: "s", kind: "strategy", attributes: { conditions: ["c1", "c2"] } })],
      noBodies(),
    );
    expect(rowFor(rows, "s").path).toBe("condition-sweep");
  });

  it("author-owned strategy with an empty conditions array → frontier-reachable", () => {
    const rows = computeReviewCoverage(
      [node({ id: "s", kind: "strategy", attributes: { conditions: [] } })],
      noBodies(),
    );
    expect(rowFor(rows, "s").path).toBe("frontier-reachable");
  });

  it("author-owned virtue (no conditions rule) → frontier-reachable", () => {
    const rows = computeReviewCoverage([node({ id: "v", kind: "virtue" })], noBodies());
    expect(rowFor(rows, "v").path).toBe("frontier-reachable");
  });

  it("a mode-A node no class rule covers → MISSING", () => {
    // A delegated-status virtue: mode A, not delegation/tradition, no frontier
    // entry → falls through to MISSING.
    const rows = computeReviewCoverage(
      [node({ id: "v", kind: "virtue", status: "delegated" })],
      noBodies(),
    );
    expect(rowFor(rows, "v").path).toBe("MISSING");
  });
});

describe("computeReviewCoverage — last_reviewed (rule 4)", () => {
  it("picks the newest date across clarification provenance", () => {
    const rows = computeReviewCoverage(
      [
        node({
          id: "s",
          kind: "strategy",
          clarifications: [
            { question: "q1", answer: "Recorded 2026-05-01." },
            { question: "q2", answer: "Amended 2026-06-15." },
          ],
        }),
      ],
      noBodies(),
    );
    expect(rowFor(rows, "s").last_reviewed).toBe("2026-06-15");
  });

  it("picks the newest across nested last_assessed / last_exercised stamps", () => {
    const rows = computeReviewCoverage(
      [
        node({
          id: "d",
          kind: "delegation",
          attributes: {
            review_trigger: "x",
            last_assessed: "2026-07-02",
            irreversibility: { last_exercised: "2026-07-08" },
          },
        }),
      ],
      noBodies(),
    );
    expect(rowFor(rows, "d").last_reviewed).toBe("2026-07-08");
  });

  it("combines clarification and attribute dates, taking the newest overall", () => {
    const rows = computeReviewCoverage(
      [
        node({
          id: "d",
          kind: "delegation",
          clarifications: [{ question: "q", answer: "Reviewed 2026-08-01." }],
          attributes: { review_trigger: "x", last_assessed: "2026-07-02" },
        }),
      ],
      noBodies(),
    );
    expect(rowFor(rows, "d").last_reviewed).toBe("2026-08-01");
  });

  it("ignores a null nested stamp with no other date → null", () => {
    const rows = computeReviewCoverage(
      [
        node({
          id: "d",
          kind: "delegation",
          attributes: { review_trigger: "x", irreversibility: { last_exercised: null } },
        }),
      ],
      noBodies(),
    );
    expect(rowFor(rows, "d").last_reviewed).toBeNull();
  });

  it("is null when no date is present anywhere", () => {
    const rows = computeReviewCoverage([node({ id: "v", kind: "virtue" })], noBodies());
    expect(rowFor(rows, "v").last_reviewed).toBeNull();
  });
});

describe("renderCoverageTable", () => {
  it("is deterministic — two calls are byte-identical", () => {
    const rows = computeReviewCoverage(
      [
        node({ id: "b", kind: "strategy", attributes: { conditions: ["c"] } }),
        node({ id: "a", kind: "virtue" }),
      ],
      noBodies(),
    );
    expect(renderCoverageTable(rows)).toBe(renderCoverageTable(rows));
  });

  it("sorts rows by id regardless of input order", () => {
    const rows = computeReviewCoverage(
      [node({ id: "z", kind: "virtue" }), node({ id: "a", kind: "virtue" })],
      noBodies(),
    );
    const out = renderCoverageTable(rows);
    const dataLines = out.split("\n").filter((l) => l.startsWith("| a ") || l.startsWith("| z "));
    expect(dataLines[0].startsWith("| a ")).toBe(true);
    expect(dataLines[1].startsWith("| z ")).toBe(true);
  });

  it("names the missing nodes in the summary line", () => {
    const rows = computeReviewCoverage(
      [
        node({ id: "d1", kind: "delegation", attributes: {} }),
        node({ id: "ok", kind: "tradition" }),
        node({ id: "d2", kind: "delegation", attributes: {} }),
      ],
      noBodies(),
    );
    const out = renderCoverageTable(rows);
    expect(out.trimEnd().endsWith("3 durable nodes; 2 missing a review path: d1, d2")).toBe(true);
  });

  it("reports 0 missing when every durable node has a path", () => {
    const rows = computeReviewCoverage(
      [node({ id: "tr", kind: "tradition" }), node({ id: "v", kind: "virtue" })],
      noBodies(),
    );
    const out = renderCoverageTable(rows);
    expect(out.trimEnd().endsWith("2 durable nodes; 0 missing a review path")).toBe(true);
  });
});
