import { appendFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import { strategyAlignSelectable, strategyFingerprint } from "../src/router.js";
import type { IntentionNode, Phase } from "../src/schema.js";
import {
  classifySnapshot,
  evaluateSelection,
  EXIT_UNKNOWN_FRESHNESS,
  MAX_SNAPSHOT_AGE_MS,
  MAX_SNAPSHOT_CLOCK_SKEW_MS,
} from "../scripts/check-node-selection.js";
import type { SnapshotProvenance } from "../scripts/check-node-selection.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "check-node-selection-"));
}

/** Minimal full IntentionNode fixture (mirrors router.test.ts's `anode`). */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "ai",
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

function seed(dir: string, node: IntentionNode): void {
  writeNode(dir, node);
}

/** A provably-fresh snapshot attestation — the default for every non-freshness case. */
const fresh = (): SnapshotProvenance => ({
  ref: "origin/main",
  sha: "a".repeat(40),
  fetchedAt: new Date().toISOString(),
});

describe("evaluateSelection", () => {
  it("passes a matching directive and returns the scope fingerprint on stdout", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
    const r = evaluateSelection({ nodeId: "tactic-a", selectedPhase: "implement", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/^[0-9a-f]{64}$/);
    expect(r.stderr).toEqual([]);
  });

  it("exit 12 when the node was pruned (missing file)", () => {
    const dir = tempDir();
    const r = evaluateSelection({ nodeId: "tactic-gone", selectedPhase: "implement", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stdout).toBeNull();
    expect(r.stderr[0]).toMatch(/exists:.*no longer in the store/);
  });

  it("exit 12 on a first-class phase mismatch", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
    const r = evaluateSelection({ nodeId: "tactic-a", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/phase: selected qa but node is now implement/);
  });

  it("exit 12 on a first-class phase mismatch against a non-implement phase", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-sq", kind: "tactic", phase: "qa" }));
    const r = evaluateSelection({ nodeId: "tactic-sq", selectedPhase: "implement", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/node is now qa/);
  });

  it("passes when the selected phase matches the first-class phase", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-sq", kind: "tactic", phase: "qa" }));
    const r = evaluateSelection({ nodeId: "tactic-sq", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
  });

  it("ignores a stray attributes.phase — the squatter fallback read is retired", () => {
    const dir = tempDir();
    // `validateGraph` rule 23 now rejects this key outright, but a hand-edited
    // file could still carry it; `readPhase` must not resurrect it. phase:null
    // first-class means the node reads as phase-less, so an implement selection
    // fails on "node is now draft/null" rather than matching the squatted "qa".
    seed(dir, anode({ id: "tactic-sq", kind: "tactic", phase: null, attributes: { phase: "qa" } }));
    const r = evaluateSelection({ nodeId: "tactic-sq", selectedPhase: "implement", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/node is now draft\/null/);
    expect(r.stderr[0]).not.toMatch(/node is now qa/);
    // And the squatted value is not selectable either.
    const q = evaluateSelection({ nodeId: "tactic-sq", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(q.exitCode).toBe(12);
  });

  it("exit 12 when a review-phase node already carries the reviewed marker", () => {
    const dir = tempDir();
    seed(
      dir,
      anode({
        id: "tactic-r",
        kind: "tactic",
        phase: "review",
        execution: { branch: "b", pr: 1, attempts: {}, markers: ["reviewed"], strategy_fingerprint: null },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-r", selectedPhase: "review", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/tactic-r already carries the reviewed marker/);
  });

  it("passes a review-phase node without the reviewed marker", () => {
    const dir = tempDir();
    seed(
      dir,
      anode({
        id: "tactic-r2",
        kind: "tactic",
        phase: "review",
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-r2", selectedPhase: "review", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
  });

  it("passes a fix selection while execution.fix is set (ladder phase preserved)", () => {
    const dir = tempDir();
    seed(
      dir,
      anode({
        id: "tactic-fx",
        kind: "tactic",
        phase: "qa", // real ladder phase preserved; the interrupt is orthogonal
        execution: {
          branch: "b",
          pr: 1,
          attempts: {},
          markers: [],
          strategy_fingerprint: null,
          fix: { since: "2026-07-18", attempt: 1, pushed_sha: null },
        },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-fx", selectedPhase: "fix", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/^[0-9a-f]{64}$/);
  });

  it("exit 12 on a fix selection once execution.fix was cleared (interrupt resolved since selection)", () => {
    const dir = tempDir();
    seed(
      dir,
      anode({
        id: "tactic-fx",
        kind: "tactic",
        phase: "qa",
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null, fix: null },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-fx", selectedPhase: "fix", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/selected fix but tactic-fx carries no execution\.fix interrupt/);
  });

  it("passes a conflict selection while execution.conflict is set (ladder phase preserved)", () => {
    const dir = tempDir();
    seed(
      dir,
      anode({
        id: "tactic-cf",
        kind: "tactic",
        phase: "review", // real ladder phase preserved; the interrupt is orthogonal
        execution: {
          branch: "b",
          pr: 1,
          attempts: {},
          markers: ["reviewed"],
          strategy_fingerprint: null,
          conflict: { since: "2026-08-03", attempt: 1 },
        },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-cf", selectedPhase: "conflict", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/^[0-9a-f]{64}$/);
  });

  it("exit 12 on a conflict selection once execution.conflict was cleared (resolved since selection)", () => {
    const dir = tempDir();
    seed(
      dir,
      anode({
        id: "tactic-cf",
        kind: "tactic",
        phase: "review",
        execution: {
          branch: "b",
          pr: 1,
          attempts: {},
          markers: ["reviewed"],
          strategy_fingerprint: null,
          conflict: null,
        },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-cf", selectedPhase: "conflict", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/selected conflict but tactic-cf carries no execution\.conflict interrupt/);
  });

  it("exit 12 when parked first-class (office_hours set after selection)", () => {
    const dir = tempDir();
    seed(
      dir,
      anode({
        id: "tactic-p",
        kind: "tactic",
        phase: "implement",
        office_hours: { reason: "author park", since: "2026-07-07", recommendation: null, session_type: "other" },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-p", selectedPhase: "implement", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/not-parked:.*parked to office_hours/);
  });

  it("a stray attributes.office_hours no longer parks — the squatter read is retired", () => {
    // Inverse of the retired behavior: the park gate reads first-class
    // `office_hours` only, so a squatted park is invisible and the node stays
    // selectable. The positive case above (first-class park -> exit 12) is what
    // now carries the park assertion.
    const dir = tempDir();
    seed(
      dir,
      anode({
        id: "tactic-ps",
        kind: "tactic",
        phase: "implement",
        attributes: { office_hours: { reason: "author park", since: "2026-07-07" } },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-ps", selectedPhase: "implement", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
    expect(r.stderr.join("\n")).not.toMatch(/not-parked/);
  });

  it("exit 12 on a stale strategy fingerprint (soft-freeze)", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-x", kind: "strategy", statement: "Own the substrate." }));
    seed(
      dir,
      anode({
        id: "tactic-x",
        kind: "tactic",
        phase: "qa",
        serves: ["strategy-x"],
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: "0".repeat(64) },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/fingerprint:.*strategy-x substance changed/);
  });

  it("throws (fails closed) when a serving strategy's file is corrupt rather than passing the gate", () => {
    // Regression: the gate enumerates the store STRICTLY. Under the tolerant
    // `listNodes` a corrupt strategy file is skipped with a warning, the
    // `byId.get(sid) === undefined → continue` shortcut fires, and this
    // soft-frozen tactic gets a silent exit-0 pass — a required staleness gate
    // turned into a no-op for every tactic serving that strategy.
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-x", kind: "strategy", statement: "Own the substrate." }));
    seed(
      dir,
      anode({
        id: "tactic-x",
        kind: "tactic",
        phase: "qa",
        serves: ["strategy-x"],
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: "0".repeat(64) },
      }),
    );
    // Simulate the partially-written / truncated node file.
    writeFileSync(join(dir, "strategy-x.md"), "");
    expect(() => evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() })).toThrow(
      /strategy-x\.md/,
    );
  });

  it("passes when the stamped strategy fingerprint matches the current substance", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-x", kind: "strategy", statement: "Own the substrate." }));
    const currentFp = strategyFingerprint(readNode(dir, "strategy-x"));
    seed(
      dir,
      anode({
        id: "tactic-x",
        kind: "tactic",
        phase: "qa",
        serves: ["strategy-x"],
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: currentFp },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
  });

  it("a null strategy fingerprint passes even when the serving strategy's substance would differ", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-x", kind: "strategy", statement: "Anything." }));
    seed(
      dir,
      anode({
        id: "tactic-x",
        kind: "tactic",
        phase: "implement",
        serves: ["strategy-x"],
        execution: { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "implement", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
  });

  it("a per-strategy map fresh against BOTH serving strategies passes", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-a", kind: "strategy", statement: "Strategy A." }));
    seed(dir, anode({ id: "strategy-b", kind: "strategy", statement: "Strategy B." }));
    const fpA = strategyFingerprint(readNode(dir, "strategy-a"));
    const fpB = strategyFingerprint(readNode(dir, "strategy-b"));
    seed(
      dir,
      anode({
        id: "tactic-x",
        kind: "tactic",
        phase: "qa",
        serves: ["strategy-a", "strategy-b"],
        execution: {
          branch: "b",
          pr: 1,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": fpA, "strategy-b": fpB },
        },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
  });

  it("exit 12 when the map entry for ONE serving strategy is stale (naming that strategy)", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-a", kind: "strategy", statement: "Strategy A." }));
    seed(dir, anode({ id: "strategy-b", kind: "strategy", statement: "Strategy B." }));
    const fpA = strategyFingerprint(readNode(dir, "strategy-a"));
    seed(
      dir,
      anode({
        id: "tactic-x",
        kind: "tactic",
        phase: "qa",
        serves: ["strategy-a", "strategy-b"],
        // Fresh against strategy-a, deliberately stale against strategy-b.
        execution: {
          branch: "b",
          pr: 1,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": fpA, "strategy-b": "0".repeat(64) },
        },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/fingerprint:.*strategy-b substance changed/);
  });

  it("a serving strategy ABSENT from the map is never stale (per-strategy null)", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-a", kind: "strategy", statement: "Strategy A." }));
    seed(dir, anode({ id: "strategy-b", kind: "strategy", statement: "Strategy B." }));
    const fpA = strategyFingerprint(readNode(dir, "strategy-a"));
    seed(
      dir,
      anode({
        id: "tactic-x",
        kind: "tactic",
        phase: "qa",
        serves: ["strategy-a", "strategy-b"],
        // Only strategy-a is stamped; strategy-b, absent from the map, cannot freeze.
        execution: {
          branch: "b",
          pr: 1,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": fpA },
        },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
  });

  it("an object-form {hash, sha} map fresh against its .hash passes; stale against it fails", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-a", kind: "strategy", statement: "Strategy A." }));
    const fpA = strategyFingerprint(readNode(dir, "strategy-a"));
    seed(
      dir,
      anode({
        id: "tactic-fresh",
        kind: "tactic",
        phase: "qa",
        serves: ["strategy-a"],
        execution: {
          branch: "b",
          pr: 1,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": { hash: fpA, sha: "some-sha" } },
        },
      }),
    );
    const freshCase = evaluateSelection({ nodeId: "tactic-fresh", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(freshCase.exitCode).toBe(0);

    seed(
      dir,
      anode({
        id: "tactic-stale",
        kind: "tactic",
        phase: "qa",
        serves: ["strategy-a"],
        execution: {
          branch: "b",
          pr: 1,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": { hash: "0".repeat(64), sha: "some-sha" } },
        },
      }),
    );
    const staleCase = evaluateSelection({ nodeId: "tactic-stale", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(staleCase.exitCode).toBe(12);
    expect(staleCase.stderr[0]).toMatch(/fingerprint:.*strategy-a substance changed/);
  });

  it("a squatted attributes.execution stamp is not read — a stale squat no longer freezes", () => {
    // Inverse of the retired behavior. The fingerprint gate reads
    // `node.execution.strategy_fingerprint` only, so a stamp squatted under
    // `attributes.execution` is invisible: there is no stamp to compare, and
    // "null is never stale" lets the node through. The first-class object-form
    // {hash, sha} staleness path is covered by the test above.
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-a", kind: "strategy", statement: "Strategy A." }));
    seed(
      dir,
      anode({
        id: "tactic-squat-stale",
        kind: "tactic",
        phase: "qa",
        serves: ["strategy-a"],
        // First-class execution absent; the (stale) stamp is squatted under
        // attributes, which the reader no longer consults.
        attributes: {
          execution: {
            strategy_fingerprint: { "strategy-a": { hash: "0".repeat(64), sha: "some-sha" } },
          },
        },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-squat-stale", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() });
    expect(r.exitCode).toBe(0);
    expect(r.stderr.join("\n")).not.toMatch(/fingerprint:/);
  });

  it("scope fingerprint is stable across state-field edits and changes on a body edit", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-s", kind: "tactic", phase: "implement" }));
    const fp1 = evaluateSelection({ nodeId: "tactic-s", selectedPhase: "implement", dir, stamp: null, snapshot: fresh() }).stdout;

    // A state-field edit (phase) preserves the tactic body -> same scope fingerprint.
    writeNode(dir, { ...readNode(dir, "tactic-s"), phase: "qa" });
    const fp2 = evaluateSelection({ nodeId: "tactic-s", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() }).stdout;
    expect(fp2).toBe(fp1);

    // A body edit (a residue append) changes the scope fingerprint.
    appendFileSync(join(dir, "tactic-s.md"), "\n## residue\n\nnew plan content\n");
    const fp3 = evaluateSelection({ nodeId: "tactic-s", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() }).stdout;
    expect(fp3).not.toBe(fp1);
  });

  describe("align-tactics (strategy phase:null) selection", () => {
    it("passes a codified, phase:null strategy the selector would emit (exit 0)", () => {
      const dir = tempDir();
      // reading:null => deriveGap non-null => unvalidated signal => an align candidate.
      seed(dir, anode({ id: "strategy-a", kind: "strategy", status: "codified" }));
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() });
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toMatch(/^[0-9a-f]{64}$/);
    });

    it("exit 12 when the strategy was parked after selection (not-parked owns the verdict)", () => {
      const dir = tempDir();
      seed(
        dir,
        anode({
          id: "strategy-a",
          kind: "strategy",
          office_hours: { reason: "author park", since: "2026-07-11", recommendation: null, session_type: "other" },
        }),
      );
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/not-parked/);
    });

    it("exit 12 when the signal became validated (no longer align-eligible)", () => {
      const dir = tempDir();
      // reading set, no success_signal => deriveGap null => validated signal => selector drops the strategy.
      seed(dir, anode({ id: "strategy-a", kind: "strategy", reading: "holding at threshold" }));
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/no longer align-eligible/);
    });

    it("exit 12 when the strategy gained a non-draft on-path child", () => {
      const dir = tempDir();
      seed(dir, anode({ id: "strategy-a", kind: "strategy" }));
      seed(
        dir,
        anode({
          id: "tactic-child",
          kind: "tactic",
          serves: ["strategy-a"],
          validates: ["strategy-a"],
          phase: "implement",
        }),
      );
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/no longer align-eligible/);
    });

    it("exit 12 when the strategy is at the rounds cap", () => {
      const dir = tempDir();
      seed(
        dir,
        anode({
          id: "strategy-a",
          kind: "strategy",
          reading: "fresh 2026-07-10",
          rounds: { count: 2, last_completed: "2026-07-01T00:00:00Z", last_aligned: "2026-07-01" },
        }),
      );
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/no longer align-eligible/);
    });

    it("THROWS (malformed store, exit 2) when a strategy carries a stored phase", () => {
      const dir = tempDir();
      // Reclassified from exit 12. A strategy carrying `phase` is not a stale
      // selection — schema rule 12 makes `phase` tactic-only, so no benign path
      // produces this node. Exit 12 told the caller "nothing is wrong, the
      // selection went stale" and sent a re-evaluation worker at a corrupt
      // node; a throw maps to exit 2, the config-class error.
      //
      // The vehicle is the first-class field: the squatter `attributes.phase`
      // representation is retired, so this is the only place a stored phase
      // can now live.
      seed(dir, anode({ id: "strategy-a", kind: "strategy", phase: "implement" }));
      expect(() =>
        evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() }),
      ).toThrow(/malformed store/);
    });

    it("that guard is NOT redundant: the pure selector would admit the same node", () => {
      // Pins WHY the guard above must exist, which is the question a reviewer
      // raised and got wrong ("unreachable in production").
      //
      // Rule 12 is enforced only in validateGraph; graph-commit never runs
      // validateGraph and validateNode accepts the node, so a strategy carrying
      // a phase really does land. The selector's strategy arm never reads
      // `phase`, so it still considers the node selectable — meaning without
      // the guard the gate passes and a worker is launched at a corrupt node.
      const strategy = anode({ id: "strategy-a", kind: "strategy", phase: "implement" });
      expect(strategyAlignSelectable(strategy, [strategy])).toBe(true);
    });

    it("exit 12 when a non-frozen tactic is passed at align-tactics (advanced past draft, not soft-frozen)", () => {
      const dir = tempDir();
      // An ordinary open tactic (phase set, not draft, not soft-frozen) is not a
      // frozenTacticSelectable candidate, so it fails the 3b re-eligibility check.
      seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
      const r = evaluateSelection({ nodeId: "tactic-a", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/no longer frozen-eligible/);
    });

    it("passes a frozen (draft, phase:null) tactic the selector would emit (exit 0)", () => {
      const dir = tempDir();
      // A draft tactic with office_hours null and no blockers is a frozen
      // align-tactics candidate — routes to /align-tactics.
      seed(dir, anode({ id: "tactic-draft", kind: "tactic", phase: null }));
      const r = evaluateSelection({ nodeId: "tactic-draft", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() });
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toMatch(/^[0-9a-f]{64}$/);
    });

    it("passes a soft-frozen tactic (stale fingerprint) the selector re-surfaces (exit 0)", () => {
      const dir = tempDir();
      seed(dir, anode({ id: "strategy-x", kind: "strategy", statement: "Own the substrate." }));
      // An open tactic carrying a STALE serving-strategy fingerprint is
      // soft-frozen: the selector re-surfaces it as an align-tactics candidate.
      // The stale fingerprint IS the re-evaluation reason, so step 4 must be
      // skipped at align-tactics — a literal fingerprint check would exit-12 the
      // very node 3b just admitted and strand the re-evaluation worker.
      seed(
        dir,
        anode({
          id: "tactic-frozen",
          kind: "tactic",
          phase: "qa",
          serves: ["strategy-x"],
          execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: "0".repeat(64) },
        }),
      );
      // Sanity: the SAME node selected at its stored phase exit-12s on the stale
      // fingerprint — proving align-tactics is what suppresses step 4, not the fixture.
      expect(evaluateSelection({ nodeId: "tactic-frozen", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() }).exitCode).toBe(12);
      const r = evaluateSelection({ nodeId: "tactic-frozen", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() });
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toMatch(/^[0-9a-f]{64}$/);
    });

    it("exit 12 when a draft tactic was parked after selection (not-parked owns the verdict)", () => {
      const dir = tempDir();
      // A parked draft tactic never reaches 3b — the earlier not-parked check
      // fires first.
      seed(
        dir,
        anode({
          id: "tactic-draft-p",
          kind: "tactic",
          phase: null,
          office_hours: { reason: "author park", since: "2026-07-16", recommendation: null, session_type: "other" },
        }),
      );
      const r = evaluateSelection({ nodeId: "tactic-draft-p", selectedPhase: "align-tactics", dir, stamp: null, snapshot: fresh() });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/not-parked/);
    });

    it("a normal tactic phase still round-trips unchanged at align-tactics-adjacent phases", () => {
      const dir = tempDir();
      seed(dir, anode({ id: "tactic-q", kind: "tactic", phase: "qa" }));
      expect(evaluateSelection({ nodeId: "tactic-q", selectedPhase: "qa", dir, stamp: null, snapshot: fresh() }).exitCode).toBe(0);
      expect(evaluateSelection({ nodeId: "tactic-q", selectedPhase: "implement", dir, stamp: null, snapshot: fresh() }).exitCode).toBe(12);
    });
  });

  describe("scope chain (--stamp)", () => {
    function seedTactic(dir: string, phase: Phase): string {
      seed(dir, anode({ id: "tactic-c", kind: "tactic", phase }));
      const { stdout } = evaluateSelection({ nodeId: "tactic-c", selectedPhase: phase, dir, stamp: null, snapshot: fresh() });
      if (stdout === null) throw new Error("seedTactic: expected a passing seed to produce a scope fingerprint");
      return stdout;
    }

    it("passes at qa when the stamp matches the current scope fingerprint", () => {
      const dir = tempDir();
      const fp = seedTactic(dir, "qa");
      const stampPath = join(dir, "tactic-c.scope-fingerprint");
      writeFileSync(stampPath, `${fp} abc1234\n`);
      const r = evaluateSelection({ nodeId: "tactic-c", selectedPhase: "qa", dir, stamp: stampPath, snapshot: fresh() });
      expect(r.exitCode).toBe(0);
    });

    it("exit 13 at qa when the stamp fingerprint no longer matches (scope changed)", () => {
      const dir = tempDir();
      seedTactic(dir, "qa");
      const stampPath = join(dir, "tactic-c.scope-fingerprint");
      writeFileSync(stampPath, `${"f".repeat(64)} abc1234\n`);
      const r = evaluateSelection({ nodeId: "tactic-c", selectedPhase: "qa", dir, stamp: stampPath, snapshot: fresh() });
      expect(r.exitCode).toBe(13);
      expect(r.stderr[0]).toMatch(/scope-stale: scope-chain: abc1234\.\.HEAD/);
    });

    it("skips the scope-chain comparison for the implement phase (custody re-established)", () => {
      const dir = tempDir();
      seedTactic(dir, "implement");
      const stampPath = join(dir, "tactic-c.scope-fingerprint");
      // A deliberately-wrong stamp: implement must ignore it and pass.
      writeFileSync(stampPath, `${"f".repeat(64)} abc1234\n`);
      const r = evaluateSelection({ nodeId: "tactic-c", selectedPhase: "implement", dir, stamp: stampPath, snapshot: fresh() });
      expect(r.exitCode).toBe(0);
    });

    it("warns and passes when the stamp file is missing (bootstrap policy)", () => {
      const dir = tempDir();
      seedTactic(dir, "review");
      const r = evaluateSelection({
        nodeId: "tactic-c",
        selectedPhase: "review",
        dir,
        stamp: join(dir, "does-not-exist.scope-fingerprint"),
        snapshot: fresh(),
      });
      expect(r.exitCode).toBe(0);
      expect(r.stderr[0]).toMatch(/warning: no scope stamp.*bootstrap policy/);
    });
  });

  describe("check 0 — snapshot freshness (refuse by default, --allow-stale to proceed)", () => {
    it("a fresh snapshot with a matching directive passes with NO warning noise", () => {
      const dir = tempDir();
      seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
      const r = evaluateSelection({
        nodeId: "tactic-a",
        selectedPhase: "implement",
        dir,
        stamp: null,
        snapshot: fresh(),
      });
      expect(r.exitCode).toBe(0);
      expect(r.stderr).toEqual([]);
    });

    it("a null snapshot REFUSES with exit 15 and exactly one unknown-freshness line", () => {
      const dir = tempDir();
      seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
      const r = evaluateSelection({
        nodeId: "tactic-a",
        selectedPhase: "implement",
        dir,
        stamp: null,
        snapshot: null,
      });
      expect(r.exitCode).toBe(EXIT_UNKNOWN_FRESHNESS);
      expect(r.stdout).toBeNull();
      expect(r.stderr).toHaveLength(1);
      expect(r.stderr[0]).toMatch(/^unknown-freshness:/);
    });

    it("a snapshot older than the age limit REFUSES with exit 15", () => {
      const dir = tempDir();
      seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
      const now = new Date("2026-08-09T12:00:00.000Z");
      const r = evaluateSelection({
        nodeId: "tactic-a",
        selectedPhase: "implement",
        dir,
        stamp: null,
        snapshot: {
          ref: "origin/main",
          sha: "a".repeat(40),
          fetchedAt: new Date(now.getTime() - (MAX_SNAPSHOT_AGE_MS + 1)).toISOString(),
        },
        now,
      });
      expect(r.exitCode).toBe(EXIT_UNKNOWN_FRESHNESS);
      expect(r.stdout).toBeNull();
      expect(r.stderr).toHaveLength(1);
      expect(r.stderr[0]).toMatch(/^unknown-freshness:.*over the 600s limit/);
    });

    it("a snapshot exactly AT the age limit is still proven — exit 0, no warning", () => {
      const dir = tempDir();
      seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
      const now = new Date("2026-08-09T12:00:00.000Z");
      const r = evaluateSelection({
        nodeId: "tactic-a",
        selectedPhase: "implement",
        dir,
        stamp: null,
        snapshot: {
          ref: "origin/main",
          sha: "a".repeat(40),
          fetchedAt: new Date(now.getTime() - MAX_SNAPSHOT_AGE_MS).toISOString(),
        },
        now,
      });
      expect(r.exitCode).toBe(0);
      expect(r.stderr).toEqual([]);
    });

    it("--allow-stale records an ATTESTED unverified read, distinguishable from the un-attested one", () => {
      const dir = tempDir();
      seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
      const r = evaluateSelection({
        nodeId: "tactic-a",
        selectedPhase: "implement",
        dir,
        stamp: null,
        snapshot: null,
        allowStale: true,
      });
      expect(r.exitCode).toBe(0);
      expect(r.stderr).toHaveLength(1);
      expect(r.stderr[0]).toMatch(/^unknown-freshness:/);
      expect(r.stderr[0]).toContain("--allow-stale");
      expect(r.stderr[0]).not.toContain("not yet enforced");
    });

    it("freshness refuses BEFORE the parked check even runs — a PARKED node under a null snapshot exits 15, not 12", () => {
      // The ordering is the point: check 0 returns immediately, so check 3
      // (not-parked) never executes and its exit-12 verdict is never computed.
      // Both refuse the launch; 15 is the honest reason, because the gate
      // cannot see whether the node is parked through an unproven snapshot.
      const dir = tempDir();
      seed(
        dir,
        anode({
          id: "tactic-p",
          kind: "tactic",
          phase: "implement",
          office_hours: { reason: "author park", since: "2026-08-09", recommendation: null, session_type: "other" },
        }),
      );
      const r = evaluateSelection({
        nodeId: "tactic-p",
        selectedPhase: "implement",
        dir,
        stamp: null,
        snapshot: null,
      });
      expect(r.exitCode).toBe(EXIT_UNKNOWN_FRESHNESS);
      expect(r.stderr).toHaveLength(1);
      expect(r.stderr[0]).toMatch(/^unknown-freshness:/);
      expect(r.stderr.some((l) => /not-parked/.test(l))).toBe(false);
    });
  });
});

describe("classifySnapshot", () => {
  const now = new Date("2026-08-09T12:00:00.000Z");
  const at = (offsetMs: number): string => new Date(now.getTime() - offsetMs).toISOString();
  const prov = (partial: Partial<SnapshotProvenance> = {}): SnapshotProvenance => ({
    ref: "origin/main",
    sha: "a".repeat(40),
    fetchedAt: at(0),
    ...partial,
  });

  it("proven for a well-formed, just-fetched attestation", () => {
    expect(classifySnapshot(prov(), now)).toEqual({ kind: "proven" });
  });

  it("unknown when no provenance was supplied at all", () => {
    const v = classifySnapshot(null, now);
    expect(v.kind).toBe("unknown");
    expect(v.kind === "unknown" && v.detail).toMatch(/no snapshot provenance/);
  });

  it("unknown on an empty ref", () => {
    const v = classifySnapshot(prov({ ref: "" }), now);
    expect(v.kind).toBe("unknown");
    expect(v.kind === "unknown" && v.detail).toMatch(/empty ref/);
  });

  it("unknown on a sha that is not 40 hex characters", () => {
    for (const sha of ["", "abc123", "A".repeat(40), "a".repeat(39), "a".repeat(41), "z".repeat(40)]) {
      const v = classifySnapshot(prov({ sha }), now);
      expect(v.kind).toBe("unknown");
      expect(v.kind === "unknown" && v.detail).toMatch(/not a 40-hex commit id/);
    }
  });

  it("unknown on an unparseable fetchedAt", () => {
    const v = classifySnapshot(prov({ fetchedAt: "yesterday-ish" }), now);
    expect(v.kind).toBe("unknown");
    expect(v.kind === "unknown" && v.detail).toMatch(/not a parseable date/);
  });

  it("proven exactly AT the age limit, unknown one millisecond past it", () => {
    expect(classifySnapshot(prov({ fetchedAt: at(MAX_SNAPSHOT_AGE_MS) }), now)).toEqual({ kind: "proven" });
    const v = classifySnapshot(prov({ fetchedAt: at(MAX_SNAPSHOT_AGE_MS + 1) }), now);
    expect(v.kind).toBe("unknown");
    // The detail names both the observed age and the limit, in seconds.
    expect(v.kind === "unknown" && v.detail).toMatch(/fetched 600s ago, over the 600s limit/);
  });

  it("proven exactly AT the clock-skew allowance, unknown one millisecond past it", () => {
    expect(classifySnapshot(prov({ fetchedAt: at(-MAX_SNAPSHOT_CLOCK_SKEW_MS) }), now)).toEqual({ kind: "proven" });
    const v = classifySnapshot(prov({ fetchedAt: at(-(MAX_SNAPSHOT_CLOCK_SKEW_MS + 1)) }), now);
    expect(v.kind).toBe("unknown");
    expect(v.kind === "unknown" && v.detail).toMatch(/future-dated by 60s/);
  });

  it("is pure with respect to the clock — the SAME attestation flips verdict on `now` alone", () => {
    const s = prov({ fetchedAt: at(0) });
    expect(classifySnapshot(s, now)).toEqual({ kind: "proven" });
    expect(classifySnapshot(s, new Date(now.getTime() + MAX_SNAPSHOT_AGE_MS + 1000)).kind).toBe("unknown");
  });
});
