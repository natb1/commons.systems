import { describe, expect, it } from "vitest";
import { validateNode, type IntentionNode } from "../src/schema.js";
import { computeDebt, decideCensus } from "../scripts/graph-census-debt.js";

// tactic-graph-census-recurrence Unit 2 — the network-free debt computation +
// census birth decision. computeDebt and decideCensus are pure over an
// in-memory node array, so these exercise them directly (no store, no
// subprocess, no tsx-at-root — the reason this lives here and not in the
// pure-bash test-dispatch-scripts.sh hook-tests suite).

const STRATEGY = "strategy-graph-native-dispatch";

function strategy(): IntentionNode {
  return validateNode({
    id: STRATEGY,
    kind: "strategy",
    statement: "s",
    owner: "ai",
    status: "codified",
    serves: [],
  });
}

function doneTactic(id: string): IntentionNode {
  return validateNode({
    id,
    kind: "tactic",
    statement: "t",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    phase: "done",
  });
}

function openTactic(id: string, extra: Record<string, unknown> = {}): IntentionNode {
  return validateNode({
    id,
    kind: "tactic",
    statement: "t",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    phase: "implement",
    ...extra,
  });
}

function openCensusTactic(id: string): IntentionNode {
  return validateNode({
    id,
    kind: "tactic",
    statement: "open census",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    office_hours: { reason: "drain", since: "2026-07-01", recommendation: null, session_type: "other" },
    attributes: { census: true },
  });
}

/**
 * A RETIRED finding record: `phase: "done"` with its summary metrics intact.
 * This is the shape the owed-prune census must never batch for deletion — see
 * `intentions/tactic-eval-finding-ledger.md`.
 *
 * It carries NO `ledger_entry` marker. The exemption keys on
 * `measured_impact` alone, so the fixture must not smuggle in the retired
 * class marker — a fixture that still set it would pass against either
 * predicate and prove nothing about the change.
 */
function retiredFindingRecord(id: string): IntentionNode {
  return validateNode({
    id,
    kind: "tactic",
    statement: "a recurring evaluation finding",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    phase: "done",
    attributes: {
      first_seen: "2026-08-01",
      measured_impact: [
        {
          metric: "recurrence_count",
          value: 7,
          unit: "occurrences",
          window: "all-time",
          sensor: "dispatch-phase-eval",
          measured: "2026-08-12",
        },
      ],
    },
  });
}

const NOW = "2026-07-11";

describe("computeDebt", () => {
  it("counts done-but-present nodes as owed prunes", () => {
    const nodes = [strategy(), doneTactic("tactic-a"), doneTactic("tactic-b")];
    const debt = computeDebt(nodes, new Set());
    expect(debt.donePresent.sort()).toEqual(["tactic-a", "tactic-b"]);
    expect(debt.total).toBe(2);
  });

  it("is zero for a graph with no done nodes, no orphans, no merges", () => {
    const nodes = [strategy(), openTactic("tactic-x"), openTactic("tactic-y")];
    const debt = computeDebt(nodes, new Set());
    expect(debt.total).toBe(0);
  });

  it("counts a node with a dangling serves ref as an orphan", () => {
    const nodes = [strategy(), openTactic("tactic-orphan", { serves: [STRATEGY, "strategy-gone"] })];
    const debt = computeDebt(nodes, new Set());
    expect(debt.orphans).toEqual(["tactic-orphan"]);
    expect(debt.total).toBe(1);
  });

  it("counts a merged-but-open PR node only when its id is in the merged set", () => {
    const merged = openTactic("tactic-merged", { execution: { branch: "b", pr: 42, attempts: {}, markers: [], strategy_fingerprint: null } });
    const notMerged = openTactic("tactic-open", { execution: { branch: "c", pr: 7, attempts: {}, markers: [], strategy_fingerprint: null } });
    const nodes = [strategy(), merged, notMerged];
    const debt = computeDebt(nodes, new Set(["tactic-merged"]));
    expect(debt.mergedUnabsorbed).toEqual(["tactic-merged"]);
    expect(debt.total).toBe(1);
  });

  // tactic-wait-calendar-release: a released WAIT whose source is still live is
  // a re-arm target, not owed-prune debt.

  /** A released WAIT node (phase done) holding `sourceId`. */
  function releasedWait(sourceId: string): IntentionNode {
    return validateNode({
      id: `tactic-wait-${sourceId.replace(/^tactic-/, "")}`,
      kind: "tactic",
      statement: "wait",
      owner: "ai",
      status: "codified",
      serves: [STRATEGY],
      phase: "done",
      attributes: {
        wait_for: sourceId,
        wait_until: "2026-08-07T00:00:00Z",
        wait_reason: "not yet observed",
        wait_recommendation: "re-check next tick",
      },
    });
  }

  /** The source a released WAIT still holds — its `blocked_by` names the wait. */
  function heldSource(id: string): IntentionNode {
    return openTactic(id, { blocked_by: [`tactic-wait-${id.replace(/^tactic-/, "")}`] });
  }

  it("excludes a released WAIT whose source is still present and open", () => {
    const nodes = [strategy(), heldSource("tactic-src"), releasedWait("tactic-src")];
    const debt = computeDebt(nodes, new Set());
    expect(debt.donePresent).toEqual([]);
    expect(debt.total).toBe(0);
  });

  it("counts a released WAIT whose source no longer names it in blocked_by", () => {
    // The edge is what makes the wait a live re-arm target; detached, it holds
    // nothing and no sweep enumerates it (wait-sweep.ts step 3), so it is
    // genuine owed-prune debt rather than a permanently-exempt residue node.
    const nodes = [strategy(), openTactic("tactic-src"), releasedWait("tactic-src")];
    const debt = computeDebt(nodes, new Set());
    expect(debt.donePresent).toEqual(["tactic-wait-src"]);
  });

  it("counts a released WAIT whose source is itself done", () => {
    const nodes = [strategy(), doneTactic("tactic-src"), releasedWait("tactic-src")];
    const debt = computeDebt(nodes, new Set());
    expect(debt.donePresent.sort()).toEqual(["tactic-src", "tactic-wait-src"]);
  });

  it("counts a released WAIT whose source is gone from the store", () => {
    const nodes = [strategy(), releasedWait("tactic-src")];
    const debt = computeDebt(nodes, new Set());
    expect(debt.donePresent).toEqual(["tactic-wait-src"]);
  });

  it("still counts an ordinary done node alongside an excluded WAIT (no regression)", () => {
    const nodes = [
      strategy(),
      heldSource("tactic-src"),
      releasedWait("tactic-src"),
      doneTactic("tactic-ordinary"),
    ];
    const debt = computeDebt(nodes, new Set());
    expect(debt.donePresent).toEqual(["tactic-ordinary"]);
    expect(debt.total).toBe(1);
  });

  it("reports an open census node in openCensus (the latch)", () => {
    const nodes = [strategy(), openCensusTactic("tactic-graph-census-2026-07-01")];
    const debt = computeDebt(nodes, new Set());
    expect(debt.openCensus).toEqual(["tactic-graph-census-2026-07-01"]);
  });

  // tactic-eval-finding-ledger — the prune exemption. donePresent is the batch a
  // census DELETES with `graph-commit --prune`, and a retired ledger entry must
  // survive with its summary metrics intact so a later recurrence resumes the
  // count instead of restarting at 1.
  it("exempts a retired finding record from the owed-prune batch", () => {
    const nodes = [strategy(), retiredFindingRecord("tactic-eval-finding-stop-hook-hold-loop")];
    const debt = computeDebt(nodes, new Set());
    expect(debt.donePresent).toEqual([]);
    expect(debt.total).toBe(0);
  });

  // The exemption is NAMESPACE-FREE. It keyed on attributes.ledger_entry until
  // PR4 Unit 1, a marker only dispatch-eval-finding wrote into
  // `tactic-eval-finding-*`; keying on measured_impact covers every producer.
  // An id outside that prefix is the case the old predicate could not reach.
  it("exempts a done node holding measurements from OUTSIDE the eval-finding namespace", () => {
    const nodes = [strategy(), retiredFindingRecord("tactic-graph-commit-landing-lock")];
    const debt = computeDebt(nodes, new Set());
    expect(debt.donePresent).toEqual([]);
    expect(debt.total).toBe(0);
  });

  it("still counts ordinary done nodes alongside an exempt ledger entry", () => {
    const nodes = [
      strategy(),
      doneTactic("tactic-a"),
      retiredFindingRecord("tactic-eval-finding-stop-hook-hold-loop"),
    ];
    const debt = computeDebt(nodes, new Set());
    expect(debt.donePresent).toEqual(["tactic-a"]);
    expect(debt.total).toBe(1);
  });

  it("does not exempt a done node with no measured_impact at all", () => {
    const nodes = [
      strategy(),
      validateNode({
        id: "tactic-holds-no-measurements",
        kind: "tactic",
        statement: "t",
        owner: "ai",
        status: "codified",
        serves: [STRATEGY],
        phase: "done",
        attributes: { first_seen: "2026-08-01" },
      }),
    ];
    expect(computeDebt(nodes, new Set()).donePresent).toEqual(["tactic-holds-no-measurements"]);
  });

  // An EMPTY array is the boundary the predicate has to get right: it is
  // present and it is an Array, so a bare `Array.isArray` or truthiness test
  // would exempt a node that holds nothing. There are no metrics to lose, so
  // there is nothing to exempt.
  it("does not exempt a done node whose measured_impact is an empty array", () => {
    const nodes = [
      strategy(),
      validateNode({
        id: "tactic-holds-an-empty-measurement-array",
        kind: "tactic",
        statement: "t",
        owner: "ai",
        status: "codified",
        serves: [STRATEGY],
        phase: "done",
        attributes: { measured_impact: [] },
      }),
    ];
    expect(computeDebt(nodes, new Set()).donePresent).toEqual([
      "tactic-holds-an-empty-measurement-array",
    ]);
  });

  // The RETIRED CLASS MARKER no longer exempts anything on its own. This is the
  // un-exempting direction of PR4 Unit 1, and it is the half no other case
  // covers: every fixture above simply omits `ledger_entry`, so a predicate that
  // still read it — `hasMeasurements(n) || isLedgerEntry(n)` — would keep the
  // whole suite green. `dispatch-eval-finding` still stamps the marker until
  // Unit 2 lands, so a marker-carrying node with no measurements is a shape the
  // store can actually hold, and it must be prunable like any other done node.
  it("does not exempt a done node carrying only the retired ledger_entry marker", () => {
    const nodes = [
      strategy(),
      validateNode({
        id: "tactic-marker-without-measurements",
        kind: "tactic",
        statement: "t",
        owner: "ai",
        status: "codified",
        serves: [STRATEGY],
        phase: "done",
        attributes: { ledger_entry: true },
      }),
    ];
    expect(computeDebt(nodes, new Set()).donePresent).toEqual([
      "tactic-marker-without-measurements",
    ]);
  });

  it("keeps a retired ledger entry out of the batch a birthed census would drain", () => {
    const nodes = [
      strategy(),
      doneTactic("tactic-a"),
      doneTactic("tactic-b"),
      doneTactic("tactic-c"),
      retiredFindingRecord("tactic-eval-finding-stop-hook-hold-loop"),
    ];
    const d = decideCensus(nodes, new Set(), 3, NOW);
    expect(d.shouldBirth).toBe(true);
    expect(d.node?.attributes.batch.donePresent.sort()).toEqual([
      "tactic-a",
      "tactic-b",
      "tactic-c",
    ]);
  });
});

describe("decideCensus", () => {
  it("births a born-parked census at/above threshold with no open census", () => {
    const nodes = [strategy(), doneTactic("tactic-a"), doneTactic("tactic-b"), doneTactic("tactic-c")];
    const d = decideCensus(nodes, new Set(), 3, NOW);
    expect(d.shouldBirth).toBe(true);
    expect(d.node?.id).toBe("tactic-graph-census-2026-07-11");
    expect(d.node?.attributes.census).toBe(true);
    expect(d.node?.phase).toBeUndefined(); // born-parked: no phase
    expect(d.node?.office_hours).not.toBeNull();
    expect(d.node?.serves).toEqual([STRATEGY]);
    expect(d.node?.attributes.batch.donePresent.sort()).toEqual(["tactic-a", "tactic-b", "tactic-c"]);
    expect(typeof d.node_body).toBe("string");
  });

  it("births nothing on a zero-debt graph", () => {
    const nodes = [strategy(), openTactic("tactic-x")];
    const d = decideCensus(nodes, new Set(), 3, NOW);
    expect(d.shouldBirth).toBe(false);
    expect(d.node).toBeUndefined();
  });

  it("births nothing below threshold", () => {
    const nodes = [strategy(), doneTactic("tactic-a"), doneTactic("tactic-b")];
    const d = decideCensus(nodes, new Set(), 5, NOW);
    expect(d.total).toBe(2);
    expect(d.shouldBirth).toBe(false);
  });

  it("does not birth a second census while one is open (latch idempotency)", () => {
    const nodes = [
      strategy(),
      doneTactic("tactic-a"),
      doneTactic("tactic-b"),
      doneTactic("tactic-c"),
      doneTactic("tactic-d"),
      openCensusTactic("tactic-graph-census-2026-07-01"),
    ];
    const d = decideCensus(nodes, new Set(), 3, NOW);
    expect(d.total).toBeGreaterThanOrEqual(3);
    expect(d.openCensus).toContain("tactic-graph-census-2026-07-01");
    expect(d.shouldBirth).toBe(false);
  });

  it("does not clobber a done-but-present census sharing the proposed id (id guard)", () => {
    const doneCensus = validateNode({
      id: "tactic-graph-census-2026-07-11",
      kind: "tactic",
      statement: "done census",
      owner: "ai",
      status: "codified",
      serves: [STRATEGY],
      phase: "done",
      attributes: { census: true },
    });
    const nodes = [strategy(), doneTactic("tactic-a"), doneTactic("tactic-b"), doneTactic("tactic-c"), doneCensus];
    const d = decideCensus(nodes, new Set(), 3, NOW);
    // The done census is NOT in openCensus (phase done), so only the id-exists
    // guard prevents a birth that would overwrite it.
    expect(d.openCensus).toEqual([]);
    expect(d.shouldBirth).toBe(false);
  });

  it("births at the exact threshold boundary (total === threshold)", () => {
    const nodes = [strategy(), doneTactic("tactic-a"), doneTactic("tactic-b"), doneTactic("tactic-c")];
    const d = decideCensus(nodes, new Set(), 3, NOW);
    expect(d.total).toBe(3);
    expect(d.shouldBirth).toBe(true);
  });

  it("computes debt but makes no decision when threshold is null", () => {
    const nodes = [strategy(), doneTactic("tactic-a")];
    const d = decideCensus(nodes, new Set(), null, NOW);
    expect(d.total).toBe(1);
    expect(d.shouldBirth).toBe(false);
    expect(d.node).toBeUndefined();
  });
});
