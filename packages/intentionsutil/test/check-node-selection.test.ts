import { appendFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import { strategyFingerprint } from "../src/router.js";
import type { IntentionNode, Phase } from "../src/schema.js";
import { evaluateSelection } from "../scripts/check-node-selection.js";

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
    gap: partial.gap ?? null,
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

describe("evaluateSelection", () => {
  it("passes a matching directive and returns the scope fingerprint on stdout", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
    const r = evaluateSelection({ nodeId: "tactic-a", selectedPhase: "implement", dir, stamp: null });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/^[0-9a-f]{64}$/);
    expect(r.stderr).toEqual([]);
  });

  it("exit 12 when the node was pruned (missing file)", () => {
    const dir = tempDir();
    const r = evaluateSelection({ nodeId: "tactic-gone", selectedPhase: "implement", dir, stamp: null });
    expect(r.exitCode).toBe(12);
    expect(r.stdout).toBeNull();
    expect(r.stderr[0]).toMatch(/exists:.*no longer in the store/);
  });

  it("exit 12 on a first-class phase mismatch", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
    const r = evaluateSelection({ nodeId: "tactic-a", selectedPhase: "qa", dir, stamp: null });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/phase: selected qa but node is now implement/);
  });

  it("exit 12 on a squatter (attributes.phase) mismatch — and reads the squatter phase", () => {
    const dir = tempDir();
    // phase:null first-class, real phase squatted under attributes (pre-migration subtree).
    seed(dir, anode({ id: "tactic-sq", kind: "tactic", phase: null, attributes: { phase: "qa" } }));
    const r = evaluateSelection({ nodeId: "tactic-sq", selectedPhase: "implement", dir, stamp: null });
    expect(r.exitCode).toBe(12);
    // Proves the squatter value was read, not the null first-class field.
    expect(r.stderr[0]).toMatch(/node is now qa/);
  });

  it("passes when the selected phase matches the squatter phase", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-sq", kind: "tactic", phase: null, attributes: { phase: "qa" } }));
    const r = evaluateSelection({ nodeId: "tactic-sq", selectedPhase: "qa", dir, stamp: null });
    expect(r.exitCode).toBe(0);
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
    const r = evaluateSelection({ nodeId: "tactic-r", selectedPhase: "review", dir, stamp: null });
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
    const r = evaluateSelection({ nodeId: "tactic-r2", selectedPhase: "review", dir, stamp: null });
    expect(r.exitCode).toBe(0);
  });

  it("exit 12 when parked first-class (office_hours set after selection)", () => {
    const dir = tempDir();
    seed(
      dir,
      anode({
        id: "tactic-p",
        kind: "tactic",
        phase: "implement",
        office_hours: { reason: "author park", since: "2026-07-07", recommendation: null },
      }),
    );
    const r = evaluateSelection({ nodeId: "tactic-p", selectedPhase: "implement", dir, stamp: null });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/not-parked:.*parked to office_hours/);
  });

  it("exit 12 when parked via the squatter convention (attributes.office_hours)", () => {
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
    const r = evaluateSelection({ nodeId: "tactic-ps", selectedPhase: "implement", dir, stamp: null });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/not-parked/);
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
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null });
    expect(r.exitCode).toBe(12);
    expect(r.stderr[0]).toMatch(/fingerprint:.*strategy-x substance changed/);
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
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null });
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
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "implement", dir, stamp: null });
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
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null });
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
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null });
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
    const r = evaluateSelection({ nodeId: "tactic-x", selectedPhase: "qa", dir, stamp: null });
    expect(r.exitCode).toBe(0);
  });

  it("scope fingerprint is stable across state-field edits and changes on a body edit", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-s", kind: "tactic", phase: "implement" }));
    const fp1 = evaluateSelection({ nodeId: "tactic-s", selectedPhase: "implement", dir, stamp: null }).stdout;

    // A state-field edit (phase) preserves the tactic body -> same scope fingerprint.
    writeNode(dir, { ...readNode(dir, "tactic-s"), phase: "qa" });
    const fp2 = evaluateSelection({ nodeId: "tactic-s", selectedPhase: "qa", dir, stamp: null }).stdout;
    expect(fp2).toBe(fp1);

    // A body edit (a residue append) changes the scope fingerprint.
    appendFileSync(join(dir, "tactic-s.md"), "\n## residue\n\nnew plan content\n");
    const fp3 = evaluateSelection({ nodeId: "tactic-s", selectedPhase: "qa", dir, stamp: null }).stdout;
    expect(fp3).not.toBe(fp1);
  });

  describe("align-tactics (strategy phase:null) selection", () => {
    it("passes a codified, phase:null strategy the selector would emit (exit 0)", () => {
      const dir = tempDir();
      // reading:null, gap:null => unvalidated signal => an align candidate.
      seed(dir, anode({ id: "strategy-a", kind: "strategy", status: "codified" }));
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null });
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
          office_hours: { reason: "author park", since: "2026-07-11", recommendation: null },
        }),
      );
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/not-parked/);
    });

    it("exit 12 when the signal became validated (no longer align-eligible)", () => {
      const dir = tempDir();
      // reading set, gap null => validated signal => selector drops the strategy.
      seed(dir, anode({ id: "strategy-a", kind: "strategy", reading: "holding at threshold" }));
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null });
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
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null });
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
          gap: "still gapped",
          reading: "fresh 2026-07-10",
          rounds: { count: 2, last_completed: "2026-07-01T00:00:00Z", last_aligned: "2026-07-01" },
        }),
      );
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/no longer align-eligible/);
    });

    it("exit 12 when the stored phase advanced to a non-null value", () => {
      const dir = tempDir();
      // A squatter phase advance stands in for any non-null stored phase.
      seed(dir, anode({ id: "strategy-a", kind: "strategy", attributes: { phase: "implement" } }));
      const r = evaluateSelection({ nodeId: "strategy-a", selectedPhase: "align-tactics", dir, stamp: null });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/phase advanced to implement/);
    });

    it("exit 12 when a non-frozen tactic is passed at align-tactics (advanced past draft, not soft-frozen)", () => {
      const dir = tempDir();
      // An ordinary open tactic (phase set, not draft, not soft-frozen) is not a
      // frozenTacticSelectable candidate, so it fails the 3b re-eligibility check.
      seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
      const r = evaluateSelection({ nodeId: "tactic-a", selectedPhase: "align-tactics", dir, stamp: null });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/no longer frozen-eligible/);
    });

    it("passes a frozen (draft, phase:null) tactic the selector would emit (exit 0)", () => {
      const dir = tempDir();
      // A draft tactic with office_hours null and no blockers is a frozen
      // align-tactics candidate — routes to /align-tactics.
      seed(dir, anode({ id: "tactic-draft", kind: "tactic", phase: null }));
      const r = evaluateSelection({ nodeId: "tactic-draft", selectedPhase: "align-tactics", dir, stamp: null });
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
      expect(evaluateSelection({ nodeId: "tactic-frozen", selectedPhase: "qa", dir, stamp: null }).exitCode).toBe(12);
      const r = evaluateSelection({ nodeId: "tactic-frozen", selectedPhase: "align-tactics", dir, stamp: null });
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
          office_hours: { reason: "author park", since: "2026-07-16", recommendation: null },
        }),
      );
      const r = evaluateSelection({ nodeId: "tactic-draft-p", selectedPhase: "align-tactics", dir, stamp: null });
      expect(r.exitCode).toBe(12);
      expect(r.stderr[0]).toMatch(/not-parked/);
    });

    it("a normal tactic phase still round-trips unchanged at align-tactics-adjacent phases", () => {
      const dir = tempDir();
      seed(dir, anode({ id: "tactic-q", kind: "tactic", phase: "qa" }));
      expect(evaluateSelection({ nodeId: "tactic-q", selectedPhase: "qa", dir, stamp: null }).exitCode).toBe(0);
      expect(evaluateSelection({ nodeId: "tactic-q", selectedPhase: "implement", dir, stamp: null }).exitCode).toBe(12);
    });
  });

  describe("scope chain (--stamp)", () => {
    function seedTactic(dir: string, phase: Phase): string {
      seed(dir, anode({ id: "tactic-c", kind: "tactic", phase }));
      const { stdout } = evaluateSelection({ nodeId: "tactic-c", selectedPhase: phase, dir, stamp: null });
      if (stdout === null) throw new Error("seedTactic: expected a passing seed to produce a scope fingerprint");
      return stdout;
    }

    it("passes at qa when the stamp matches the current scope fingerprint", () => {
      const dir = tempDir();
      const fp = seedTactic(dir, "qa");
      const stampPath = join(dir, "tactic-c.scope-fingerprint");
      writeFileSync(stampPath, `${fp} abc1234\n`);
      const r = evaluateSelection({ nodeId: "tactic-c", selectedPhase: "qa", dir, stamp: stampPath });
      expect(r.exitCode).toBe(0);
    });

    it("exit 13 at qa when the stamp fingerprint no longer matches (scope changed)", () => {
      const dir = tempDir();
      seedTactic(dir, "qa");
      const stampPath = join(dir, "tactic-c.scope-fingerprint");
      writeFileSync(stampPath, `${"f".repeat(64)} abc1234\n`);
      const r = evaluateSelection({ nodeId: "tactic-c", selectedPhase: "qa", dir, stamp: stampPath });
      expect(r.exitCode).toBe(13);
      expect(r.stderr[0]).toMatch(/scope-stale: scope-chain: abc1234\.\.HEAD/);
    });

    it("skips the scope-chain comparison for the implement phase (custody re-established)", () => {
      const dir = tempDir();
      seedTactic(dir, "implement");
      const stampPath = join(dir, "tactic-c.scope-fingerprint");
      // A deliberately-wrong stamp: implement must ignore it and pass.
      writeFileSync(stampPath, `${"f".repeat(64)} abc1234\n`);
      const r = evaluateSelection({ nodeId: "tactic-c", selectedPhase: "implement", dir, stamp: stampPath });
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
      });
      expect(r.exitCode).toBe(0);
      expect(r.stderr[0]).toMatch(/warning: no scope stamp.*bootstrap policy/);
    });
  });
});
