import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import {
  RECONCILIATION_FRONTIER_KINDS,
  deriveReconciliationFrontier,
  renderReconciliationFrontier,
  type ReconciliationCheckRun,
  type ReconciliationFrontierEntry,
} from "../src/frontier-reconciliation.js";
import { dispositionHash } from "../src/basis-pins.js";
import type { CheckResult, CheckTier } from "../src/checks.js";
import type { IntentionNode } from "../src/schema.js";

const DATE = "2026-09-01";

/** A full node fixture; `attributes` is what every test here varies. */
function node(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
    status: partial.status ?? "raw",
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

/**
 * Criteria fixtures are plain objects rather than typed `Criterion`s because
 * they ride inside `attributes`, which is `Record<string, unknown>` — the same
 * shape the real store hands the deriver after YAML parsing.
 */
function criterion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "nf-test-integrity",
    statement: "A failing test is fixed in the code or escalated.",
    class: "non-functional",
    authority: "deferred",
    recorded: DATE,
    ...overrides,
  };
}

/** The standing home, carrying `standing` as its standing set. */
function standingHome(standing: unknown[] = []): IntentionNode {
  return node({
    id: "kind-strategy",
    kind: "kind",
    status: "codified",
    attributes: { standing_criteria: standing },
  });
}

function run(partial: {
  id: string;
  criterion: string;
  tier?: CheckTier;
  result?: Partial<CheckResult>;
}): ReconciliationCheckRun {
  return {
    check: {
      id: partial.id,
      criterion: partial.criterion,
      describe: `Describes ${partial.id}`,
      run: () => ({ ok: true, detail: "ok", entries: [] }),
    },
    tier: partial.tier ?? "observe",
    result: {
      ok: partial.result?.ok ?? true,
      detail: partial.result?.detail ?? "ok",
      entries: partial.result?.entries ?? [],
    },
  };
}

function ids(entries: readonly ReconciliationFrontierEntry[]): string[] {
  return entries.map((e) => e.id);
}

describe("deriveReconciliationFrontier — the unsatisfied-criterion arm", () => {
  it("reports every standing criterion as unsatisfied when no check is registered", () => {
    const nodes = [
      standingHome([criterion({ id: "nf-security" }), criterion({ id: "nf-style" })]),
      node({ id: "strategy-a", kind: "strategy" }),
    ];
    const entries = deriveReconciliationFrontier({ nodes, checkRuns: [] });
    expect(ids(entries)).toEqual([
      "unsatisfied-criterion:nf-security",
      "unsatisfied-criterion:nf-style",
    ]);
    // The criterion's HOME, not every strategy it binds to: the standing set is
    // projected on read and never copied, so it has exactly one home.
    expect(entries[0].subject).toBe("kind-strategy");
    expect(entries[0].detail).toContain("no registered check binds");
    expect(entries[0].criterion).toBe("nf-security");
    expect(entries[0].authority).toBe("deferred");
    expect(entries[0].kind).toBe("unsatisfied-criterion");
  });

  it("reports a functional criterion authored on a strategy, homed on that strategy", () => {
    const nodes = [
      standingHome(),
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: {
          criteria: [criterion({ id: "fn-a", class: "functional", authority: "ratified" })],
        },
      }),
    ];
    const entries = deriveReconciliationFrontier({ nodes, checkRuns: [] });
    expect(ids(entries)).toEqual(["unsatisfied-criterion:fn-a"]);
    expect(entries[0].subject).toBe("strategy-a");
    expect(entries[0].authority).toBe("ratified");
  });

  it("sees a criterion authored on a goal-layer node that is not a strategy", () => {
    const nodes = [
      standingHome(),
      node({
        id: "tactic-a",
        kind: "tactic",
        attributes: { criteria: [criterion({ id: "fn-tactic", class: "functional" })] },
      }),
    ];
    expect(ids(deriveReconciliationFrontier({ nodes, checkRuns: [] }))).toEqual([
      "unsatisfied-criterion:fn-tactic",
    ]);
  });

  it("drops a criterion once a bound check passes", () => {
    const nodes = [standingHome([criterion({ id: "nf-style" })])];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [run({ id: "check-style", criterion: "nf-style" })],
    });
    expect(entries).toEqual([]);
  });

  it("keeps a criterion whose bound check failed, naming the failing check", () => {
    const nodes = [standingHome([criterion({ id: "nf-style" })])];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [
        run({ id: "check-b", criterion: "nf-style", result: { ok: false, detail: "red" } }),
        run({ id: "check-a", criterion: "nf-style", result: { ok: false, detail: "red" } }),
      ],
    });
    expect(ids(entries)).toContain("unsatisfied-criterion:nf-style");
    const unsatisfied = entries.find((e) => e.kind === "unsatisfied-criterion");
    // Failing check ids are sorted, so the detail is byte-stable under a
    // reordering of the runs.
    expect(unsatisfied?.detail).toBe("bound check(s) reported not-ok: check-a, check-b");
  });

  it("keeps a criterion when ONE of its bound checks fails", () => {
    const nodes = [standingHome([criterion({ id: "nf-style" })])];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [
        run({ id: "check-a", criterion: "nf-style" }),
        run({ id: "check-b", criterion: "nf-style", result: { ok: false, detail: "red" } }),
      ],
    });
    expect(ids(entries)).toContain("unsatisfied-criterion:nf-style");
  });

  it("counts a passing GATING check as satisfying its criterion (tier is not consulted here)", () => {
    const nodes = [
      standingHome(),
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: {
          criteria: [criterion({ id: "fn-a", class: "functional", authority: "ratified" })],
        },
      }),
    ];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [run({ id: "check-a", criterion: "fn-a", tier: "gating" })],
    });
    expect(entries).toEqual([]);
  });

  it("NEVER emits an assumption-class criterion as a work item", () => {
    // Author-ratified kind-kind refinement 7 (2026-09-01): an assumption is a
    // world-premise evaluated by assessment; a violation re-derives the
    // strategy rather than scheduling a task. No assessment machinery exists,
    // so the class is excluded from this arm outright.
    const nodes = [
      standingHome([criterion({ id: "nf-style" })]),
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: {
          criteria: [
            criterion({ id: "as-market", class: "assumption", authority: "ratified" }),
            criterion({ id: "fn-a", class: "functional" }),
          ],
        },
      }),
    ];
    const entries = deriveReconciliationFrontier({ nodes, checkRuns: [] });
    expect(ids(entries)).toEqual([
      "unsatisfied-criterion:fn-a",
      "unsatisfied-criterion:nf-style",
    ]);
    expect(ids(entries)).not.toContain("unsatisfied-criterion:as-market");
    // And not by any other route either — no entry mentions it at all.
    expect(entries.some((e) => e.criterion === "as-market")).toBe(false);
  });

  it("excludes an assumption even when a bound check reports it failing", () => {
    const nodes = [
      standingHome(),
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: {
          criteria: [criterion({ id: "as-market", class: "assumption" })],
        },
      }),
    ];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [
        run({
          id: "check-a",
          criterion: "as-market",
          tier: "gating",
          result: { ok: false, detail: "premise violated" },
        }),
      ],
    });
    expect(entries.filter((e) => e.kind === "unsatisfied-criterion")).toEqual([]);
  });

  it("refuses a truncated node list rather than reporting a smaller frontier", () => {
    expect(() =>
      deriveReconciliationFrontier({ nodes: [node({ id: "strategy-a", kind: "strategy" })], checkRuns: [] }),
    ).toThrow(IntentionSchemaError);
  });
});

describe("deriveReconciliationFrontier — the observe-failure arm", () => {
  it("emits one entry per seed of a failing observe-tier check", () => {
    const nodes = [standingHome([criterion({ id: "nf-style" })])];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [
        run({
          id: "check-style",
          criterion: "nf-style",
          result: {
            ok: false,
            detail: "2 files remain",
            entries: [
              { subject: "src/b.ts", detail: "uses a business metaphor" },
              { subject: "src/a.ts", detail: "buries an error in a fallback" },
            ],
          },
        }),
      ],
    });
    const observe = entries.filter((e) => e.kind === "observe-failure");
    expect(ids(observe)).toEqual([
      "observe-failure:check-style:src/a.ts",
      "observe-failure:check-style:src/b.ts",
    ]);
    expect(observe[0].subject).toBe("src/a.ts");
    expect(observe[0].detail).toBe("buries an error in a fallback");
    expect(observe[0].criterion).toBe("nf-style");
    expect(observe[0].authority).toBe("deferred");
  });

  it("emits one entry carrying the check's own detail when a red check itemizes nothing", () => {
    const nodes = [standingHome([criterion({ id: "nf-style" })])];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [
        run({ id: "check-style", criterion: "nf-style", result: { ok: false, detail: "red, unitemized" } }),
      ],
    });
    const observe = entries.filter((e) => e.kind === "observe-failure");
    expect(ids(observe)).toEqual(["observe-failure:check-style"]);
    expect(observe[0].detail).toBe("red, unitemized");
  });

  it("surfaces the seeds of an ok observe check that still reports remaining items", () => {
    // checks.ts names this "exactly the migration-frontier case": these remain,
    // and that is expected today. The items are still remaining work.
    const nodes = [standingHome([criterion({ id: "nf-style" })])];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [
        run({
          id: "check-style",
          criterion: "nf-style",
          result: { ok: true, detail: "1 known remainder", entries: [{ subject: "src/a.ts", detail: "legacy" }] },
        }),
      ],
    });
    expect(ids(entries)).toContain("observe-failure:check-style:src/a.ts");
    // The criterion itself is satisfied — its bound check reported ok.
    expect(ids(entries)).not.toContain("unsatisfied-criterion:nf-style");
  });

  it("emits nothing for a clean observe check", () => {
    const nodes = [standingHome([criterion({ id: "nf-style" })])];
    expect(
      deriveReconciliationFrontier({
        nodes,
        checkRuns: [run({ id: "check-style", criterion: "nf-style" })],
      }),
    ).toEqual([]);
  });

  it("excludes a failing GATING check — a block is the runner's verdict, not a listing", () => {
    const nodes = [standingHome([criterion({ id: "nf-style" })])];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [
        run({
          id: "check-style",
          criterion: "nf-style",
          tier: "gating",
          result: { ok: false, detail: "red", entries: [{ subject: "src/a.ts", detail: "x" }] },
        }),
      ],
    });
    expect(entries.filter((e) => e.kind === "observe-failure")).toEqual([]);
    // The criterion arm still reports it — the criterion is decided, and no.
    expect(ids(entries)).toEqual(["unsatisfied-criterion:nf-style"]);
  });

  it("leaves criterion/authority null when the check binds outside the criteria in force", () => {
    const nodes = [standingHome()];
    const entries = deriveReconciliationFrontier({
      nodes,
      checkRuns: [run({ id: "check-x", criterion: "ghost", result: { ok: false, detail: "red" } })],
    });
    expect(entries[0].criterion).toBe("ghost");
    expect(entries[0].authority).toBeNull();
  });
});

describe("deriveReconciliationFrontier — the stale-intent arm (unit 4)", () => {
  const QUESTION = "What is the intent-layer reconciliation criterion?";
  const cited = node({
    id: "strategy-graph-integrity",
    kind: "strategy",
    clarifications: [{ question: QUESTION, answer: "An amendment derives a frontier. 2026-09-01." }],
  });
  const REF = `strategy-graph-integrity#clarification:${QUESTION}`;

  /** The citing node, carrying one pin against `hash`. */
  function citing(hash: string): IntentionNode {
    return node({
      id: "strategy-explicit-intent",
      kind: "strategy",
      attributes: { basis_pins: [{ cites: REF, hash, pinned_at: DATE }] },
    });
  }

  it("contributes nothing when every pin still matches — an empty pin corpus is an empty arm", () => {
    const fresh = citing(dispositionHash(cited, REF));
    const entries = deriveReconciliationFrontier({
      nodes: [standingHome(), cited, fresh],
      checkRuns: [],
    });
    expect(entries.filter((e) => e.kind === "stale-intent")).toEqual([]);
  });

  it("appends a stale-intent entry through the same entry type and render path", () => {
    const stale = citing("a1b2c3d4".repeat(8));
    const entries = deriveReconciliationFrontier({
      nodes: [standingHome(), cited, stale],
      checkRuns: [],
    });
    const staleEntries = entries.filter((e) => e.kind === "stale-intent");
    expect(staleEntries).toHaveLength(1);
    expect(staleEntries[0].subject).toBe("strategy-explicit-intent");
    // The renderer needed no change to carry the new arm.
    const out = renderReconciliationFrontier(entries);
    expect(out).toContain("## stale-intent (1)");
    expect(out).toContain(`- **stale-intent:strategy-explicit-intent:${REF}**`);
  });

  it("sorts the new arm in with the others, and stays stable under a node permutation", () => {
    const nodes = [
      standingHome([criterion({ id: "nf-style" })]),
      cited,
      citing("a1b2c3d4".repeat(8)),
    ];
    const forward = deriveReconciliationFrontier({ nodes, checkRuns: [] });
    expect(ids(forward)).toEqual([...ids(forward)].sort());
    expect(forward.map((e) => e.kind)).toContain("stale-intent");
    expect(deriveReconciliationFrontier({ nodes: [...nodes].reverse(), checkRuns: [] })).toEqual(
      forward,
    );
  });

  it("refuses a malformed pin list rather than reporting a smaller frontier", () => {
    expect(() =>
      deriveReconciliationFrontier({
        nodes: [standingHome(), node({ id: "strategy-a", kind: "strategy", attributes: { basis_pins: [{}] } })],
        checkRuns: [],
      }),
    ).toThrow(IntentionSchemaError);
  });
});

describe("deriveReconciliationFrontier — the overdue-shim arm (unit 5)", () => {
  function shim(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: "finding-ledger",
      target: "a structured finding-ledger record",
      liquidation: "the finding-ledger deriver goes live",
      liquidated_by: null,
      declared: DATE,
      ...overrides,
    };
  }

  it("contributes nothing when every shim is live (liquidated_by: null) — the honest bootstrap reading", () => {
    const nodes = [
      standingHome(),
      node({ id: "strategy-a", kind: "strategy", attributes: { shims: [shim()] } }),
    ];
    const entries = deriveReconciliationFrontier({ nodes, checkRuns: [] });
    expect(entries.filter((e) => e.kind === "overdue-shim")).toEqual([]);
  });

  it("appends an overdue-shim entry through the same entry type and render path", () => {
    const nodes = [
      standingHome(),
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: { shims: [shim({ id: "x", liquidated_by: "validate-graph" })] },
      }),
    ];
    const checkRuns = [
      run({ id: "validate-graph", criterion: "fn-graph-validate", tier: "gating", result: { ok: true } }),
    ];
    const entries = deriveReconciliationFrontier({ nodes, checkRuns });
    const shimEntries = entries.filter((e) => e.kind === "overdue-shim");
    expect(shimEntries).toHaveLength(1);
    expect(shimEntries[0].subject).toBe("strategy-a");
    expect(shimEntries[0].id).toBe("overdue-shim:strategy-a:x");
    // The renderer needed no change to carry the new arm.
    const out = renderReconciliationFrontier(entries);
    expect(out).toContain("## overdue-shim (1)");
    expect(out).toContain("- **overdue-shim:strategy-a:x**");
  });

  it("sorts the new arm in with the others, and stays stable under a node permutation", () => {
    const checkRuns = [
      run({ id: "validate-graph", criterion: "fn-graph-validate", tier: "gating", result: { ok: true } }),
    ];
    const nodes = [
      standingHome([criterion({ id: "nf-style" })]),
      node({
        id: "strategy-a",
        kind: "strategy",
        attributes: { shims: [shim({ id: "x", liquidated_by: "validate-graph" })] },
      }),
    ];
    const forward = deriveReconciliationFrontier({ nodes, checkRuns });
    expect(ids(forward)).toEqual([...ids(forward)].sort());
    expect(forward.map((e) => e.kind)).toContain("overdue-shim");
    expect(deriveReconciliationFrontier({ nodes: [...nodes].reverse(), checkRuns })).toEqual(forward);
  });

  it("refuses a malformed shims list rather than reporting a smaller frontier", () => {
    expect(() =>
      deriveReconciliationFrontier({
        nodes: [standingHome(), node({ id: "strategy-a", kind: "strategy", attributes: { shims: [{}] } })],
        checkRuns: [],
      }),
    ).toThrow(IntentionSchemaError);
  });
});

describe("deriveReconciliationFrontier — ordering and totality", () => {
  const nodes = [
    standingHome([criterion({ id: "nf-style" }), criterion({ id: "nf-security" })]),
    node({
      id: "strategy-a",
      kind: "strategy",
      attributes: { criteria: [criterion({ id: "fn-a", class: "functional" })] },
    }),
  ];
  const checkRuns = [
    run({
      id: "check-z",
      criterion: "nf-style",
      result: { ok: false, detail: "red", entries: [{ subject: "b", detail: "x" }, { subject: "a", detail: "y" }] },
    }),
  ];

  it("returns entries in id order", () => {
    const entries = deriveReconciliationFrontier({ nodes, checkRuns });
    expect(ids(entries)).toEqual([...ids(entries)].sort());
  });

  it("is independent of node and check-run order", () => {
    const forward = deriveReconciliationFrontier({ nodes, checkRuns });
    const reversed = deriveReconciliationFrontier({
      nodes: [...nodes].reverse(),
      checkRuns: [...checkRuns].reverse(),
    });
    expect(reversed).toEqual(forward);
  });

  it("is stable across repeated derivations — a projection, not a store", () => {
    expect(deriveReconciliationFrontier({ nodes, checkRuns })).toEqual(
      deriveReconciliationFrontier({ nodes, checkRuns }),
    );
  });

  it("orders two seeds sharing one subject deterministically rather than arbitrarily", () => {
    // Colliding ids: the comparator falls through to detail, so the order is
    // total and the same on every run.
    const colliding = [
      run({
        id: "check-z",
        criterion: "nf-style",
        result: {
          ok: false,
          detail: "red",
          entries: [{ subject: "a", detail: "second" }, { subject: "a", detail: "first" }],
        },
      }),
    ];
    const entries = deriveReconciliationFrontier({ nodes, checkRuns: colliding });
    const observe = entries.filter((e) => e.kind === "observe-failure");
    expect(observe.map((e) => e.detail)).toEqual(["first", "second"]);
  });
});

describe("renderReconciliationFrontier", () => {
  it("renders one stable summary line for an empty frontier", () => {
    expect(renderReconciliationFrontier([])).toBe("_No reconciliation frontier items._\n");
  });

  it("is byte-identical across repeated renders of an empty frontier", () => {
    expect(renderReconciliationFrontier([])).toBe(renderReconciliationFrontier([]));
  });

  it("renders an empty real derivation as that same single line", () => {
    const nodes = [standingHome(), node({ id: "strategy-a", kind: "strategy" })];
    const entries = deriveReconciliationFrontier({ nodes, checkRuns: [] });
    expect(renderReconciliationFrontier(entries)).toBe("_No reconciliation frontier items._\n");
  });

  it("emits a section only for kinds that have entries", () => {
    const nodes = [standingHome([criterion({ id: "nf-style" })])];
    const out = renderReconciliationFrontier(deriveReconciliationFrontier({ nodes, checkRuns: [] }));
    expect(out).toContain("**Reconciliation frontier — 1 item.**");
    expect(out).toContain("## unsatisfied-criterion (1)");
    for (const kind of RECONCILIATION_FRONTIER_KINDS) {
      if (kind === "unsatisfied-criterion") continue;
      expect(out).not.toContain(`## ${kind}`);
    }
    expect(out.endsWith("\n")).toBe(true);
  });

  it("appends the criterion and authority markers only when non-null", () => {
    const marked: ReconciliationFrontierEntry = {
      kind: "unsatisfied-criterion",
      id: "unsatisfied-criterion:nf-style",
      subject: "kind-strategy",
      detail: "no registered check binds",
      criterion: "nf-style",
      authority: "deferred",
    };
    const unmarked: ReconciliationFrontierEntry = {
      kind: "prose-gap",
      id: "prose-gap:a",
      subject: "a",
      detail: "d",
      criterion: null,
      authority: null,
    };
    const out = renderReconciliationFrontier([marked, unmarked]);
    expect(out).toContain(
      "- **unsatisfied-criterion:nf-style** — kind-strategy — no registered check binds [criterion nf-style] [authority deferred]",
    );
    expect(out).toContain("- **prose-gap:a** — a — d\n");
    expect(out).not.toContain("null");
  });

  it("renders kinds in the declared order regardless of the order given", () => {
    const observe: ReconciliationFrontierEntry = {
      kind: "observe-failure",
      id: "observe-failure:c:a",
      subject: "a",
      detail: "d",
      criterion: null,
      authority: null,
    };
    const unsatisfied: ReconciliationFrontierEntry = {
      kind: "unsatisfied-criterion",
      id: "unsatisfied-criterion:nf-style",
      subject: "kind-strategy",
      detail: "d",
      criterion: null,
      authority: null,
    };
    const out = renderReconciliationFrontier([observe, unsatisfied]);
    expect(out.indexOf("## unsatisfied-criterion")).toBeLessThan(out.indexOf("## observe-failure"));
    // Any permutation of the same entries renders identically.
    expect(renderReconciliationFrontier([unsatisfied, observe])).toBe(out);
  });

  it("uses the plural noun for a multi-item frontier", () => {
    const nodes = [standingHome([criterion({ id: "nf-style" }), criterion({ id: "nf-security" })])];
    const out = renderReconciliationFrontier(deriveReconciliationFrontier({ nodes, checkRuns: [] }));
    expect(out).toContain("**Reconciliation frontier — 2 items.**");
  });
});
