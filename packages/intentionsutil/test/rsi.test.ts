import { describe, expect, it } from "vitest";
import type { IntentionNode, OfficeHours } from "../src/schema.js";
import {
  DISPATCH_STRATEGY_ID,
  OFFICE_HOURS_STRATEGY_ID,
  PARKED_UNBANDED_SHOWN,
  RSI_STRATEGY_ID,
  SUMMARY_STALE_DAYS,
  attributeSpend,
  daysBetween,
  externalLedgersOf,
  queueSummaryOf,
  renderRsiPlan,
  rsiTaskCost,
  spendBucketsFrom,
  workflowOfSkill,
  type ParkedItem,
  type RsiRenderInput,
} from "../src/rsi.js";
import { parseParkedList } from "../scripts/render-rsi-plan.js";

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
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/**
 * The minimum graph a render needs: the `kind-*` nodes (`resolveAttention`
 * treats only kinds whose node sets `goal_layer: true` as eligible) plus the
 * three queue-owning strategies.
 */
function baseNodes(overrides: IntentionNode[] = []): IntentionNode[] {
  const base = [
    node({ id: "kind-strategy", kind: "kind", attributes: { goal_layer: true } }),
    node({ id: "kind-tactic", kind: "kind", attributes: { goal_layer: true } }),
    node({ id: DISPATCH_STRATEGY_ID, kind: "strategy" }),
    node({ id: OFFICE_HOURS_STRATEGY_ID, kind: "strategy" }),
    node({ id: RSI_STRATEGY_ID, kind: "strategy" }),
  ];
  const byId = new Map(base.map((n) => [n.id, n]));
  for (const o of overrides) byId.set(o.id, o);
  return [...byId.values()];
}

function input(partial: Partial<RsiRenderInput> = {}): RsiRenderInput {
  return {
    nodes: partial.nodes ?? baseNodes(),
    parked: partial.parked ?? [],
    spend: partial.spend ?? null,
    spendWindow: partial.spendWindow ?? "7d",
    registeredSensors: partial.registeredSensors ?? new Set<string>(),
    ref: partial.ref ?? "origin/main",
    sha: partial.sha ?? "abcdef1234567890",
    generatedAt: partial.generatedAt ?? "2026-08-10",
  };
}

function parkedRow(partial: Partial<ParkedItem> & { id: string }): ParkedItem {
  return {
    rank: partial.rank ?? 1,
    sessionType: partial.sessionType ?? "other",
    id: partial.id,
    since: partial.since ?? "2026-08-01",
    note: partial.note ?? null,
  };
}

describe("queueSummaryOf", () => {
  it("reads a well-formed dated summary", () => {
    const n = node({
      id: "s",
      kind: "strategy",
      attributes: { queue_summary: { date: "2026-08-10", summary: "  all clear  " } },
    });
    expect(queueSummaryOf(n)).toEqual({ date: "2026-08-10", summary: "all clear" });
  });

  it("returns null for an absent, malformed, or undated summary", () => {
    expect(queueSummaryOf(undefined)).toBeNull();
    expect(queueSummaryOf(node({ id: "s" }))).toBeNull();
    expect(
      queueSummaryOf(node({ id: "s", attributes: { queue_summary: "just a string" } })),
    ).toBeNull();
    expect(
      queueSummaryOf(
        node({ id: "s", attributes: { queue_summary: { date: "yesterday", summary: "x" } } }),
      ),
    ).toBeNull();
    expect(
      queueSummaryOf(
        node({ id: "s", attributes: { queue_summary: { date: "2026-08-10", summary: "  " } } }),
      ),
    ).toBeNull();
  });
});

describe("rsiTaskCost", () => {
  it("defaults to 0 and reads a declared cost", () => {
    expect(rsiTaskCost(node({ id: "t" }))).toBe(0);
    expect(rsiTaskCost(node({ id: "t", attributes: { rsi_cost: 1 } }))).toBe(1);
  });

  it("ignores a non-numeric or negative declared cost rather than trusting it", () => {
    expect(rsiTaskCost(node({ id: "t", attributes: { rsi_cost: "1" } }))).toBe(0);
    expect(rsiTaskCost(node({ id: "t", attributes: { rsi_cost: -3 } }))).toBe(0);
  });
});

describe("daysBetween", () => {
  it("counts whole days forward", () => {
    expect(daysBetween("2026-08-01", "2026-08-10")).toBe(9);
    expect(daysBetween("2026-08-10", "2026-08-10")).toBe(0);
  });
});

describe("workflowOfSkill / attributeSpend", () => {
  it("maps each workflow's skills, and unknown skills to other", () => {
    expect(workflowOfSkill("qa-fix")).toBe("dispatch");
    expect(workflowOfSkill("office-hours")).toBe("office-hours");
    expect(workflowOfSkill("rsi")).toBe("rsi");
    expect(workflowOfSkill("some-future-skill")).toBe("other");
  });

  it("folds per-skill buckets into shares over the four workflows", () => {
    const spend = attributeSpend({
      "qa-fix": { price_proxy_usd: 60, cost_usd: 20, turns: 6 },
      implement: { price_proxy_usd: 20, cost_usd: 10, turns: 2 },
      "office-hours": { price_proxy_usd: 10, cost_usd: 5, turns: 1 },
      rsi: { price_proxy_usd: 10, cost_usd: 5, turns: 1 },
    });
    expect(spend.map((s) => s.workflow)).toEqual(["dispatch", "office-hours", "rsi", "other"]);
    expect(spend[0]).toMatchObject({ priceProxyUsd: 80, costUsd: 30, turns: 8, share: 0.8 });
    expect(spend[1].share).toBeCloseTo(0.1);
    expect(spend[3]).toMatchObject({ priceProxyUsd: 0, share: 0 });
  });

  it("does not divide by zero on an empty window", () => {
    expect(attributeSpend({}).every((s) => s.share === 0)).toBe(true);
  });
});

describe("spendBucketsFrom", () => {
  it("extracts by_phase buckets, coercing each field to a finite number", () => {
    expect(
      spendBucketsFrom({
        by_phase: { "qa-fix": { price_proxy_usd: 5, cost_usd: 1, turns: 2 } },
      }),
    ).toEqual({ "qa-fix": { price_proxy_usd: 5, cost_usd: 1, turns: 2 } });
  });

  it("zeroes a missing or non-finite field rather than propagating NaN", () => {
    expect(
      spendBucketsFrom({ by_phase: { "qa-fix": { price_proxy_usd: "5", turns: null } } }),
    ).toEqual({ "qa-fix": { price_proxy_usd: 0, cost_usd: 0, turns: 0 } });
  });

  it("skips an unreadable bucket instead of inventing a zero-spend row for it", () => {
    expect(spendBucketsFrom({ by_phase: { "qa-fix": "not-a-bucket" } })).toEqual({});
  });

  it("returns null — not an empty map — for a document that is not an aggregate", () => {
    expect(spendBucketsFrom(null)).toBeNull();
    expect(spendBucketsFrom("[]")).toBeNull();
    expect(spendBucketsFrom({ totals: {} })).toBeNull();
  });
});

describe("parseParkedList", () => {
  it("parses tab-separated rows and binds a following NOTE to the row above", () => {
    const rows = parseParkedList(
      [
        "55.3\tother\ttactic-a\t2026-08-05",
        "NOTE — tactic-a ranks at tier 1 band 55.3 via tactic-b (own score 5)",
        "1\trequirement-discovery\ttactic-c\t2026-08-01",
        "",
      ].join("\n"),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ rank: 55.3, id: "tactic-a", sessionType: "other" });
    expect(rows[0].note).toContain("via tactic-b");
    expect(rows[1]).toMatchObject({ id: "tactic-c", note: null });
  });

  it("skips malformed rows rather than inventing ranks for them", () => {
    expect(parseParkedList("not-a-rank\tother\ttactic-a\t2026-08-05")).toHaveLength(0);
    expect(parseParkedList("1\tother\ttactic-a")).toHaveLength(0);
  });
});

describe("renderRsiPlan", () => {
  it("is deterministic for identical inputs", () => {
    expect(renderRsiPlan(input()).markdown).toBe(renderRsiPlan(input()).markdown);
  });

  it("declares itself generated, naming the ref and short sha", () => {
    const md = renderRsiPlan(input()).markdown;
    expect(md).toContain("**Generated file — do not hand-edit.**");
    expect(md).toContain("`origin/main` (`abcdef12`)");
    expect(md).toContain("a hand-edited section is a defect");
  });

  it("renders all six sections", () => {
    const md = renderRsiPlan(input()).markdown;
    for (const heading of [
      "## 1. Top author priorities",
      "## 2. Dispatch queue",
      "## 3. Office-hours queue",
      "## 4. Metrics",
      "## 5. Recommended additional telemetry",
      "## 6. RSI task plan",
    ]) {
      expect(md).toContain(heading);
    }
  });

  it("flags each missing queue summary, one per owning strategy", () => {
    const flags = renderRsiPlan(input()).flags.filter((f) => f.kind === "summary-missing");
    expect(flags.map((f) => f.subject).sort()).toEqual(
      [DISPATCH_STRATEGY_ID, OFFICE_HOURS_STRATEGY_ID, RSI_STRATEGY_ID].sort(),
    );
  });

  it("renders a fresh summary verbatim and does not flag it", () => {
    const nodes = baseNodes([
      node({
        id: DISPATCH_STRATEGY_ID,
        kind: "strategy",
        attributes: {
          queue_summary: { date: "2026-08-09", summary: "REAPGATE is one merge from clearing." },
        },
      }),
    ]);
    const { markdown, flags } = renderRsiPlan(input({ nodes }));
    expect(markdown).toContain("REAPGATE is one merge from clearing.");
    expect(flags.some((f) => f.subject === DISPATCH_STRATEGY_ID)).toBe(false);
  });

  it("flags a summary older than the staleness window", () => {
    const nodes = baseNodes([
      node({
        id: RSI_STRATEGY_ID,
        kind: "strategy",
        attributes: { queue_summary: { date: "2026-07-01", summary: "stale news" } },
      }),
    ]);
    const flag = renderRsiPlan(input({ nodes })).flags.find(
      (f) => f.kind === "summary-stale" && f.subject === RSI_STRATEGY_ID,
    );
    expect(flag?.detail).toContain(`limit ${SUMMARY_STALE_DAYS}d`);
  });

  it("renders only registered sensors as metrics, and flags unread ones and breaches", () => {
    const signal = (sensor: string, threshold: string) => ({
      observable: "o",
      sensor,
      threshold,
      is_proxy: false,
    });
    const nodes = baseNodes([
      node({
        id: "strategy-measured",
        kind: "strategy",
        success_signal: signal("live-sensor", "green"),
        reading: "red",
      }),
      node({
        id: "strategy-unread",
        kind: "strategy",
        success_signal: signal("live-sensor", "green"),
        reading: null,
      }),
      node({
        id: "strategy-unregistered",
        kind: "strategy",
        success_signal: signal("aspirational-sensor", "green"),
        reading: "red",
      }),
    ]);
    const { markdown, flags } = renderRsiPlan(
      input({ nodes, registeredSensors: new Set(["live-sensor"]) }),
    );
    // Scope the assertions to §4 — §1 lists every strategy by name, so a
    // whole-document match would pass regardless of what the metrics table holds.
    const metrics = markdown.slice(markdown.indexOf("## 4."), markdown.indexOf("## 5."));
    expect(metrics).toContain("`strategy-measured`");
    expect(metrics).toContain("`strategy-unread`");
    // A node naming an UNREGISTERED sensor is not a metric: nothing measures it,
    // so rendering its stale reading beside measured ones would be a false claim.
    expect(metrics).not.toContain("`strategy-unregistered`");
    expect(flags).toContainEqual(
      expect.objectContaining({ kind: "threshold-breach", subject: "strategy-measured" }),
    );
    expect(flags).toContainEqual(
      expect.objectContaining({ kind: "unread-sensor", subject: "strategy-unread" }),
    );
  });

  it("reports absent token attribution instead of rendering it as zero spend", () => {
    const md = renderRsiPlan(input({ spend: null })).markdown;
    expect(md).toContain("*unavailable.*");
    expect(md).toContain("aggregate-usage.sh");
  });

  it("flags a window where dispatch does not outpace the other workflows", () => {
    const spend = attributeSpend({
      "qa-fix": { price_proxy_usd: 10, cost_usd: 1, turns: 1 },
      rsi: { price_proxy_usd: 90, cost_usd: 9, turns: 9 },
    });
    const flag = renderRsiPlan(input({ spend })).flags.find(
      (f) => f.kind === "spend-deviation",
    );
    expect(flag?.detail).toContain("rsi");
  });

  it("does not flag a window where dispatch dominates", () => {
    const spend = attributeSpend({
      "qa-fix": { price_proxy_usd: 90, cost_usd: 9, turns: 9 },
      rsi: { price_proxy_usd: 10, cost_usd: 1, turns: 1 },
    });
    expect(
      renderRsiPlan(input({ spend })).flags.some((f) => f.kind === "spend-deviation"),
    ).toBe(false);
  });

  it("shows every banded park, caps unbanded ones, and states what it dropped", () => {
    const banded = parkedRow({
      id: "tactic-hold-x",
      rank: 2,
      note: "tactic-hold-x ranks at tier 1 band 2 via tactic-source (own score 0)",
    });
    const unbanded = Array.from({ length: PARKED_UNBANDED_SHOWN + 5 }, (_, i) =>
      parkedRow({ id: `tactic-park-${String(i).padStart(2, "0")}`, rank: 100 - i }),
    );
    const md = renderRsiPlan(input({ parked: [...unbanded, banded] })).markdown;
    expect(md).toContain("`tactic-hold-x`");
    // The BAND SOURCE is what the column carries — not the park's own id.
    expect(md).toContain("| `tactic-source` |");
    expect(md).toContain("`tactic-park-00`");
    expect(md).not.toContain("`tactic-park-14`");
    expect(md).toContain("The remaining **5** are not shown here");
  });

  it("counts open nodes held by a blocked_by edge onto a parked node", () => {
    const nodes = baseNodes([
      node({ id: "tactic-parked", office_hours: parked("needs a ruling") }),
      node({ id: "tactic-held", phase: "qa", blocked_by: ["tactic-parked"] }),
      node({ id: "tactic-done-held", phase: "done", blocked_by: ["tactic-parked"] }),
    ]);
    const md = renderRsiPlan(input({ nodes })).markdown;
    expect(md).toContain("onto a parked node: **1**");
  });

  it("renders every sensor-kind tooling goal, and no actuator ones", () => {
    const nodes = baseNodes([
      node({
        id: "strategy-wants-telemetry",
        kind: "strategy",
        tooling_goals: [
          { kind: "sensor", statement: "a conflict-encounter counter" },
          { kind: "actuator", statement: "a merge driver" },
        ],
      }),
    ]);
    const md = renderRsiPlan(input({ nodes })).markdown;
    expect(md).toContain("a conflict-encounter counter");
    expect(md).not.toContain("a merge driver");
  });

  it("renders the task plan from nodes with their declared costs", () => {
    const nodes = baseNodes([
      node({
        id: "tactic-rsi-costly",
        serves: [RSI_STRATEGY_ID],
        phase: "implement",
        attributes: { rsi_cost: 1 },
      }),
      node({ id: "tactic-rsi-free", serves: [RSI_STRATEGY_ID] }),
      node({ id: "tactic-elsewhere", serves: [DISPATCH_STRATEGY_ID] }),
    ]);
    const md = renderRsiPlan(input({ nodes })).markdown;
    const taskPlan = md.slice(md.indexOf("## 6."));
    expect(taskPlan).toContain("| `tactic-rsi-costly` | 1 | implement | open");
    expect(taskPlan).toContain("| `tactic-rsi-free` | 0 | — | draft");
    expect(taskPlan).not.toContain("tactic-elsewhere");
  });

  it("flags a completed or parked task still carried in the plan", () => {
    const nodes = baseNodes([
      node({ id: "tactic-rsi-done", serves: [RSI_STRATEGY_ID], phase: "done" }),
      node({
        id: "tactic-rsi-parked",
        serves: [RSI_STRATEGY_ID],
        office_hours: parked("awaits an author ruling"),
      }),
    ]);
    const flags = renderRsiPlan(input({ nodes })).flags;
    expect(flags).toContainEqual(
      expect.objectContaining({ kind: "task-done", subject: "tactic-rsi-done" }),
    );
    expect(flags).toContainEqual(
      expect.objectContaining({ kind: "task-parked", subject: "tactic-rsi-parked" }),
    );
  });

  it("orders priorities by effective tier before rank", () => {
    const nodes = baseNodes([
      node({
        id: "strategy-tier-three",
        kind: "strategy",
        attributes: { tier: 3 },
      }),
      node({
        id: "strategy-boosted",
        kind: "strategy",
        attention: { boosts: { "1": 50 }, rationale: "urgent" },
      }),
    ]);
    const md = renderRsiPlan(input({ nodes })).markdown;
    expect(md.indexOf("strategy-tier-three")).toBeLessThan(md.indexOf("strategy-boosted"));
  });
});

describe("externalLedgersOf", () => {
  it("reads well-formed entries in order, trimming", () => {
    const n = node({
      id: "s",
      kind: "strategy",
      attributes: {
        external_ledgers: [
          { path: "  /a/one.md  ", note: "  carries the traps  " },
          { path: "/b/two.md", note: "carries the recipes" },
        ],
      },
    });
    expect(externalLedgersOf(n)).toEqual([
      { path: "/a/one.md", note: "carries the traps" },
      { path: "/b/two.md", note: "carries the recipes" },
    ]);
  });

  it("returns [] for absent, non-array, or empty values", () => {
    expect(externalLedgersOf(undefined)).toEqual([]);
    expect(externalLedgersOf(node({ id: "s" }))).toEqual([]);
    expect(
      externalLedgersOf(node({ id: "s", attributes: { external_ledgers: "one.md" } })),
    ).toEqual([]);
    expect(externalLedgersOf(node({ id: "s", attributes: { external_ledgers: [] } }))).toEqual(
      [],
    );
  });

  it("skips malformed entries without dropping well-formed siblings", () => {
    const n = node({
      id: "s",
      kind: "strategy",
      attributes: {
        external_ledgers: [
          "bare string",
          { path: "/keep.md", note: "kept" },
          { path: "", note: "no path" },
          { path: "/no-note.md", note: "   " },
          { path: 42, note: "wrong type" },
        ],
      },
    });
    expect(externalLedgersOf(n)).toEqual([{ path: "/keep.md", note: "kept" }]);
  });
});

describe("renderRsiPlan §7 external ledgers", () => {
  function withLedgers(ledgers: unknown): IntentionNode[] {
    return baseNodes([
      node({
        id: RSI_STRATEGY_ID,
        kind: "strategy",
        attributes: { external_ledgers: ledgers },
      }),
    ]);
  }

  it("renders each ledger's path and note", () => {
    const md = renderRsiPlan(
      input({
        nodes: withLedgers([
          { path: "~/.claude/plans/prototype.md", note: "invariants I13-I30, not yet absorbed" },
        ]),
      }),
    ).markdown;
    expect(md).toContain("## 7. External operational ledgers");
    expect(md).toContain("`~/.claude/plans/prototype.md`");
    expect(md).toContain("invariants I13-I30, not yet absorbed");
  });

  it("omits the section entirely when no ledger is recorded", () => {
    expect(renderRsiPlan(input()).markdown).not.toContain("External operational ledgers");
    expect(renderRsiPlan(input({ nodes: withLedgers([]) })).markdown).not.toContain(
      "External operational ledgers",
    );
  });

  it("raises no flag for an absent ledger list — an empty ledger is the goal state", () => {
    expect(renderRsiPlan(input()).flags.some((f) => f.subject === RSI_STRATEGY_ID
      && f.detail.includes("ledger"))).toBe(false);
  });

  it("renders §7 last, after the task plan", () => {
    const md = renderRsiPlan(
      input({ nodes: withLedgers([{ path: "/p.md", note: "n" }]) }),
    ).markdown;
    expect(md.indexOf("## 7.")).toBeGreaterThan(md.indexOf("## 6."));
  });
});
