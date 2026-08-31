import { describe, expect, it } from "vitest";
import type { Execution, IntentionNode } from "../src/schema.js";
import {
  PLANNED_MARKER,
  QA_DONE_MARKER,
  forwardPhase,
  fixInterrupt,
  conflictInterrupt,
  CONFLICT_ATTEMPT_CAP,
  decideTransition,
  addMarker,
  incrementAttempt,
  reconcileMergedPhase,
  reconcileClosedPhase,
  reviewStallRoute,
  interruptRoute,
  hasNeedsMainResidue,
  stampRound,
  inboundBlockers,
  strategiesToStamp,
  parseScopeStamp,
  isScopeStale,
  isStrategyStale,
  isFingerprintStale,
  stampHash,
} from "../src/transitions.js";

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
    superseded_by: partial.superseded_by ?? [],
    supersession_expiry: partial.supersession_expiry ?? null,
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

function exec(partial: Partial<Execution> = {}): Execution {
  return {
    branch: partial.branch ?? "tactic-x",
    pr: partial.pr ?? null,
    attempts: partial.attempts ?? {},
    markers: partial.markers ?? [],
    strategy_fingerprint: partial.strategy_fingerprint ?? null,
  };
}

describe("forwardPhase", () => {
  it("walks the linear ladder implement → qa → review", () => {
    expect(forwardPhase("implement", false)).toBe("qa");
    expect(forwardPhase("qa", false)).toBe("review");
  });

  it("never routes qa directly to main-qa, residue or not", () => {
    // main-qa is post-merge by definition, and merging requires review. The
    // required progression is qa → review → (merge) → main-qa, so needs-main
    // residue recorded during qa must NOT divert the phase — it is drained via
    // the review → main-qa edge below. Pinned because qa-fix's prose once
    // claimed a `qa → main-qa` edge that this module has never implemented.
    expect(forwardPhase("qa", true)).toBe("review");
  });

  it("routes review to done without residue and main-qa with residue", () => {
    expect(forwardPhase("review", false)).toBe("done");
    expect(forwardPhase("review", true)).toBe("main-qa");
  });

  it("routes main-qa to done", () => {
    expect(forwardPhase("main-qa", false)).toBe("done");
    expect(forwardPhase("main-qa", true)).toBe("done");
  });

  it("has no forward edge past done, from fix, or from an unknown phase", () => {
    expect(forwardPhase("done", false)).toBeNull();
    expect(forwardPhase("fix", false)).toBeNull();
    expect(forwardPhase("draft", false)).toBeNull();
  });
});

describe("fixInterrupt", () => {
  it("fires only on a failing verdict at an interruptible ladder phase", () => {
    for (const phase of ["implement", "qa", "review"]) {
      expect(fixInterrupt(phase, "failing")).toBe(true);
      expect(fixInterrupt(phase, "passing")).toBe(false);
      expect(fixInterrupt(phase, "unknown")).toBe(false);
    }
  });

  it("never re-interrupts fix, done, or main-qa", () => {
    for (const phase of ["fix", "done", "main-qa"]) {
      expect(fixInterrupt(phase, "failing")).toBe(false);
    }
  });
});

describe("conflictInterrupt", () => {
  it("fires only on a CONFLICTING mergeable value", () => {
    expect(conflictInterrupt("CONFLICTING")).toBe(true);
  });

  it("never fires on MERGEABLE or UNKNOWN", () => {
    expect(conflictInterrupt("MERGEABLE")).toBe(false);
    expect(conflictInterrupt("UNKNOWN")).toBe(false);
  });
});

describe("CONFLICT_ATTEMPT_CAP", () => {
  it("matches legacy /fix-conflicts' attempt cap of 3", () => {
    expect(CONFLICT_ATTEMPT_CAP).toBe(3);
  });
});

describe("decideTransition", () => {
  const base: { hasResidue: boolean; scopeStale: boolean; strategyStale: boolean } = {
    hasResidue: false,
    scopeStale: false,
    strategyStale: false,
  };

  it("advances implement → qa unconditionally (CI-blind)", () => {
    const d = decideTransition({ ...base, phase: "implement" });
    expect(d).toEqual({ phase: "qa", armMerge: false, hold: false, demote: false });
  });

  it("advances qa → review unconditionally (CI-blind)", () => {
    expect(decideTransition({ ...base, phase: "qa" }).phase).toBe("review");
  });

  it("advances qa → review even when needs-main residue is present", () => {
    expect(decideTransition({ ...base, phase: "qa", hasResidue: true }).phase).toBe("review");
  });

  it("arms auto-merge and writes no phase at clean review completion", () => {
    const d = decideTransition({ ...base, phase: "review" });
    expect(d).toEqual({ phase: "review", armMerge: true, hold: false, demote: false });
  });

  it("never routes any phase into fix (fix is the selector's orthogonal interrupt)", () => {
    for (const phase of ["implement", "qa", "review", "main-qa"]) {
      expect(decideTransition({ ...base, phase }).phase).not.toBe("fix");
    }
  });

  it("demotes to implement on a scope-fingerprint mismatch, before any other rule", () => {
    const d = decideTransition({ ...base, phase: "review", scopeStale: true });
    expect(d).toEqual({ phase: "implement", armMerge: false, hold: true, demote: true });
  });

  it("holds at the completed phase on a strategy-fingerprint mismatch", () => {
    const d = decideTransition({ ...base, phase: "review", strategyStale: true });
    expect(d).toEqual({ phase: "review", armMerge: false, hold: true, demote: false });
  });

  it("scope-stale takes precedence over strategy-stale", () => {
    const d = decideTransition({ ...base, phase: "qa", scopeStale: true, strategyStale: true });
    expect(d.demote).toBe(true);
    expect(d.phase).toBe("implement");
  });

  it("routes a residue-bearing clean review to arm-merge (main-qa lands post-merge)", () => {
    // review completion always arms merge; the reconciler applies the residue
    // branch after the out-of-band merge.
    const d = decideTransition({ ...base, phase: "review", hasResidue: true });
    expect(d.armMerge).toBe(true);
  });
});

describe("addMarker / incrementAttempt", () => {
  it("adds a marker idempotently, preserving order", () => {
    const e0 = exec({ markers: [PLANNED_MARKER] });
    const e1 = addMarker(e0, QA_DONE_MARKER);
    expect(e1.markers).toEqual([PLANNED_MARKER, QA_DONE_MARKER]);
    expect(addMarker(e1, QA_DONE_MARKER).markers).toEqual([PLANNED_MARKER, QA_DONE_MARKER]);
  });

  it("does not mutate the input execution", () => {
    const e0 = exec({ markers: [] });
    addMarker(e0, PLANNED_MARKER);
    expect(e0.markers).toEqual([]);
  });

  it("increments a per-phase attempt counter from zero", () => {
    const e0 = exec({ attempts: {} });
    const e1 = incrementAttempt(e0, "fix");
    expect(e1.attempts).toEqual({ fix: 1 });
    expect(incrementAttempt(e1, "fix").attempts).toEqual({ fix: 2 });
    expect(e0.attempts).toEqual({});
  });
});

describe("reconciler routing", () => {
  it("routes a merged tactic to main-qa with residue, done without", () => {
    expect(reconcileMergedPhase(true)).toBe("main-qa");
    expect(reconcileMergedPhase(false)).toBe("done");
  });

  it("routes a closed-not-merged tactic straight to done", () => {
    expect(reconcileClosedPhase()).toBe("done");
  });
});

describe("reviewStallRoute", () => {
  it("routes a failing CI verdict to the fix interrupt", () => {
    expect(reviewStallRoute("failing", "MERGEABLE")).toBe("fix");
    expect(reviewStallRoute("failing", "UNKNOWN")).toBe("fix");
  });

  it("routes a CONFLICTING mergeability to the conflict lane, never to fix", () => {
    // A conflict must NOT enter execution.fix: _gate_fix_active reads CI, not
    // mergeability, so a green-but-CONFLICTING PR would be cleared as resolved
    // on the next selection — stripping the `reviewed` marker, drafting the PR,
    // and re-running the whole review pass with the conflict untouched.
    expect(reviewStallRoute("passing", "CONFLICTING")).toBe("conflict");
    expect(reviewStallRoute("unknown", "CONFLICTING")).toBe("conflict");
  });

  it("prefers the conflict lane when CI is failing AND the PR conflicts", () => {
    // The fix lane would have to merge origin/main to run at all, so the
    // conflict clears first; a later sweep re-routes the still-red CI to fix.
    expect(reviewStallRoute("failing", "CONFLICTING")).toBe("conflict");
  });

  it("is not a regression when CI passes and the PR is mergeable", () => {
    expect(reviewStallRoute("passing", "MERGEABLE")).toBe(null);
  });

  it("is not a regression when both CI and mergeability are unknown", () => {
    expect(reviewStallRoute("unknown", "UNKNOWN")).toBe(null);
  });

  it("self-heals: an UNKNOWN mergeability with passing CI is not a regression", () => {
    expect(reviewStallRoute("passing", "UNKNOWN")).toBe(null);
  });
});

describe("interruptRoute", () => {
  const INTERRUPTIBLE = ["implement", "qa", "review"] as const;

  it("routes to conflict over fix when both a failing verdict and CONFLICTING hold (the defect case)", () => {
    for (const phase of INTERRUPTIBLE) {
      expect(interruptRoute(phase, "failing", "CONFLICTING")).toBe("conflict");
    }
  });

  it("routes to fix on a failing verdict at an interruptible phase when mergeable or unknown", () => {
    for (const phase of INTERRUPTIBLE) {
      expect(interruptRoute(phase, "failing", "MERGEABLE")).toBe("fix");
      expect(interruptRoute(phase, "failing", "UNKNOWN")).toBe("fix");
    }
  });

  it("routes to conflict regardless of CI verdict when CONFLICTING", () => {
    for (const phase of INTERRUPTIBLE) {
      expect(interruptRoute(phase, "passing", "CONFLICTING")).toBe("conflict");
      expect(interruptRoute(phase, "unknown", "CONFLICTING")).toBe("conflict");
    }
  });

  it("returns null when CI is not failing and mergeability is not CONFLICTING", () => {
    for (const phase of INTERRUPTIBLE) {
      expect(interruptRoute(phase, "passing", "MERGEABLE")).toBe(null);
      expect(interruptRoute(phase, "passing", "UNKNOWN")).toBe(null);
      expect(interruptRoute(phase, "unknown", "MERGEABLE")).toBe(null);
      expect(interruptRoute(phase, "unknown", "UNKNOWN")).toBe(null);
    }
  });

  it("on a non-interruptible phase, a failing+MERGEABLE verdict is null but CONFLICTING still routes to conflict", () => {
    // The conflict arm is phase-independent by construction: mergeable ===
    // "CONFLICTING" short-circuits before fixInterrupt (and its phase check)
    // is ever consulted.
    for (const phase of ["done", "main-qa"]) {
      expect(interruptRoute(phase, "failing", "MERGEABLE")).toBe(null);
      expect(interruptRoute(phase, "failing", "CONFLICTING")).toBe("conflict");
    }
  });

  it("returns null whenever neither a failing verdict nor CONFLICTING holds (the shell pre-filter's superset invariant)", () => {
    for (const phase of ["implement", "qa", "review", "done"]) {
      for (const ci of ["passing", "unknown"] as const) {
        for (const mergeable of ["MERGEABLE", "UNKNOWN"] as const) {
          expect(interruptRoute(phase, ci, mergeable)).toBe(null);
        }
      }
    }
  });
});

describe("hasNeedsMainResidue", () => {
  it("detects a canonical needs-main H2 heading, case-insensitively", () => {
    expect(hasNeedsMainResidue("# Title\n\n## needs-main\n\nverify prod\n")).toBe(true);
    expect(hasNeedsMainResidue("## Needs-main residue\n")).toBe(true);
    expect(hasNeedsMainResidue("## Needs-main QA\n")).toBe(true);
  });

  it("ignores non-matching headings and prose mentions", () => {
    expect(hasNeedsMainResidue("## Verification\n\nneeds-main something in prose\n")).toBe(false);
    expect(hasNeedsMainResidue("### needs-main\n")).toBe(false); // H3, not H2
    expect(hasNeedsMainResidue("## needs-main-adjacent\n")).toBe(false); // word boundary
    expect(hasNeedsMainResidue("")).toBe(false);
  });
});

describe("stampRound", () => {
  it("increments count and stamps last_completed from a null rounds", () => {
    expect(stampRound(null, "2026-07-10")).toEqual({
      count: 1,
      last_completed: "2026-07-10",
      last_aligned: null,
    });
  });

  it("increments an existing count and preserves last_aligned unchanged", () => {
    expect(
      stampRound(
        { count: 1, last_completed: "2026-01-01", last_aligned: "2026-06-15" },
        "2026-07-10",
      ),
    ).toEqual({
      count: 2,
      last_completed: "2026-07-10",
      last_aligned: "2026-06-15",
    });
  });
});

describe("inboundBlockers", () => {
  it("finds every node listing the pruned id in blocked_by", () => {
    const nodes = [
      anode({ id: "tactic-p", kind: "tactic", phase: "done" }),
      anode({ id: "tactic-a", kind: "tactic", phase: "implement", blocked_by: ["tactic-p"] }),
      anode({ id: "tactic-b", kind: "tactic", phase: "implement", blocked_by: ["tactic-p", "tactic-x"] }),
      anode({ id: "tactic-c", kind: "tactic", phase: "implement", blocked_by: ["tactic-x"] }),
    ];
    expect(inboundBlockers("tactic-p", nodes)).toEqual(["tactic-a", "tactic-b"]);
    expect(inboundBlockers("tactic-none", nodes)).toEqual([]);
  });
});

describe("strategiesToStamp", () => {
  it("stamps a strategy when the pruned tactic is its last non-draft child", () => {
    const strat = anode({ id: "strategy-s", kind: "strategy" });
    const last = anode({ id: "tactic-last", kind: "tactic", phase: "done", serves: ["strategy-s"] });
    const draftSibling = anode({ id: "tactic-draft", kind: "tactic", phase: "draft", serves: ["strategy-s"] });
    const nodes = [strat, last, draftSibling];
    // Only a draft sibling remains — drafts do not keep a round open.
    expect(strategiesToStamp(last, nodes)).toEqual(["strategy-s"]);
  });

  it("does not stamp while a non-draft sibling remains", () => {
    const strat = anode({ id: "strategy-s", kind: "strategy" });
    const pruned = anode({ id: "tactic-1", kind: "tactic", phase: "done", serves: ["strategy-s"] });
    const sibling = anode({ id: "tactic-2", kind: "tactic", phase: "qa", serves: ["strategy-s"] });
    expect(strategiesToStamp(pruned, [strat, pruned, sibling])).toEqual([]);
  });

  it("resolves serving strategies through the parent chain", () => {
    const strat = anode({ id: "strategy-s", kind: "strategy" });
    const root = anode({ id: "tactic-root", kind: "tactic", phase: "done", serves: ["strategy-s"] });
    const child = anode({ id: "tactic-child", kind: "tactic", phase: "done", parent: "tactic-root" });
    // Pruning the child: the root still serves the strategy and is non-draft,
    // so the round is not yet complete.
    expect(strategiesToStamp(child, [strat, root, child])).toEqual([]);
  });
});

describe("scope stamp parsing + gates", () => {
  it("parses a well-formed stamp", () => {
    expect(parseScopeStamp("abc123 deadbeef")).toEqual({ fingerprint: "abc123", sha: "deadbeef" });
    expect(parseScopeStamp("  abc123   deadbeef  \n")).toEqual({ fingerprint: "abc123", sha: "deadbeef" });
  });

  it("returns null for empty or malformed content", () => {
    expect(parseScopeStamp("")).toBeNull();
    expect(parseScopeStamp("onlyone")).toBeNull();
    expect(parseScopeStamp("a b c")).toBeNull();
  });

  it("isScopeStale: null stamp is never stale; mismatch is stale", () => {
    expect(isScopeStale(null, "anything")).toBe(false);
    expect(isScopeStale({ fingerprint: "a", sha: "s" }, "a")).toBe(false);
    expect(isScopeStale({ fingerprint: "a", sha: "s" }, "b")).toBe(true);
  });

  it("isStrategyStale (legacy string): null execution or null stamp is never stale; mismatch is stale", () => {
    // The legacy bare string ignores the strategy id — it compares against every
    // serving strategy (a single string cannot equal two substance hashes).
    expect(isStrategyStale(null, "strategy-a", "fp")).toBe(false);
    expect(isStrategyStale(exec({ strategy_fingerprint: null }), "strategy-a", "fp")).toBe(false);
    expect(isStrategyStale(exec({ strategy_fingerprint: "fp" }), "strategy-a", "fp")).toBe(false);
    expect(isStrategyStale(exec({ strategy_fingerprint: "old" }), "strategy-a", "fp")).toBe(true);
  });

  it("isStrategyStale (map): stale only when THIS strategy's entry differs; absent key is never stale", () => {
    const stamp = { "strategy-a": "fp-a", "strategy-b": "fp-b" };
    // Fresh against both mapped strategies.
    expect(isStrategyStale(exec({ strategy_fingerprint: stamp }), "strategy-a", "fp-a")).toBe(false);
    expect(isStrategyStale(exec({ strategy_fingerprint: stamp }), "strategy-b", "fp-b")).toBe(false);
    // strategy-b drifted: stale against b, but a stays fresh (no false-freeze).
    expect(isStrategyStale(exec({ strategy_fingerprint: stamp }), "strategy-b", "fp-b-new")).toBe(true);
    expect(isStrategyStale(exec({ strategy_fingerprint: stamp }), "strategy-a", "fp-a")).toBe(false);
    // A serving strategy absent from the map is never stale (per-strategy null).
    expect(isStrategyStale(exec({ strategy_fingerprint: stamp }), "strategy-c", "anything")).toBe(false);
  });

  it("isFingerprintStale: raw-stamp predicate — null, string, and map forms", () => {
    expect(isFingerprintStale(null, "strategy-a", "fp")).toBe(false);
    expect(isFingerprintStale("fp", "strategy-a", "fp")).toBe(false);
    expect(isFingerprintStale("old", "strategy-a", "fp")).toBe(true);
    expect(isFingerprintStale({ "strategy-a": "fp" }, "strategy-a", "fp")).toBe(false);
    expect(isFingerprintStale({ "strategy-a": "old" }, "strategy-a", "fp")).toBe(true);
    expect(isFingerprintStale({ "strategy-b": "old" }, "strategy-a", "fp")).toBe(false);
  });

  it("isFingerprintStale: object-form {hash, sha} map value compares against .hash; sha plays no role", () => {
    expect(
      isFingerprintStale({ "strategy-a": { hash: "X", sha: "sha-1" } }, "strategy-a", "X"),
    ).toBe(false);
    expect(
      isFingerprintStale({ "strategy-a": { hash: "X", sha: "sha-1" } }, "strategy-a", "Y"),
    ).toBe(true);
    // A different sha with the same hash is still fresh — sha is provenance, not
    // part of the freshness comparison.
    expect(
      isFingerprintStale({ "strategy-a": { hash: "X", sha: "sha-2" } }, "strategy-a", "X"),
    ).toBe(false);
  });

  it("isFingerprintStale: mixed map evaluates object-form and bare-string entries independently per key", () => {
    const stamp = {
      "strategy-a": { hash: "fp-a", sha: "sha-a" },
      "strategy-b": "fp-b",
    };
    expect(isFingerprintStale(stamp, "strategy-a", "fp-a")).toBe(false);
    expect(isFingerprintStale(stamp, "strategy-b", "fp-b")).toBe(false);
    expect(isFingerprintStale(stamp, "strategy-a", "stale")).toBe(true);
    expect(isFingerprintStale(stamp, "strategy-b", "stale")).toBe(true);
  });

  it("stampHash: string passthrough and {hash, sha} extraction", () => {
    expect(stampHash("abc")).toBe("abc");
    expect(stampHash({ hash: "abc", sha: "def" })).toBe("abc");
  });
});
