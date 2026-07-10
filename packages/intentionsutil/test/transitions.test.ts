import { describe, expect, it } from "vitest";
import type { Execution } from "../src/schema.js";
import {
  PLANNED_MARKER,
  QA_DONE_MARKER,
  REVIEWED_MARKER,
  forwardPhase,
  fixInterrupt,
  resumeAfterFix,
  decideTransition,
  addMarker,
  incrementAttempt,
  reconcileMergedPhase,
  reconcileClosedPhase,
  hasNeedsMainResidue,
  stampRound,
  parseScopeStamp,
  isScopeStale,
  isStrategyStale,
} from "../src/transitions.js";

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

describe("resumeAfterFix", () => {
  it("resumes at the phase after the furthest completion marker", () => {
    expect(resumeAfterFix([], false)).toBe("implement");
    expect(resumeAfterFix([PLANNED_MARKER], false)).toBe("qa");
    expect(resumeAfterFix([PLANNED_MARKER, QA_DONE_MARKER], false)).toBe("review");
    expect(resumeAfterFix([PLANNED_MARKER, QA_DONE_MARKER, REVIEWED_MARKER], false)).toBe("done");
  });

  it("resumes a fully-reviewed tactic at main-qa when residue is present", () => {
    expect(resumeAfterFix([QA_DONE_MARKER, REVIEWED_MARKER], true)).toBe("main-qa");
  });
});

describe("decideTransition", () => {
  const base = { markers: [] as string[], ci: "passing" as const, hasResidue: false, scopeStale: false, strategyStale: false };

  it("advances implement → qa on a clean pass", () => {
    const d = decideTransition({ ...base, phase: "implement" });
    expect(d).toEqual({ phase: "qa", armMerge: false, hold: false, demote: false });
  });

  it("advances qa → review on a clean pass", () => {
    expect(decideTransition({ ...base, phase: "qa" }).phase).toBe("review");
  });

  it("arms auto-merge and writes no phase at clean review completion", () => {
    const d = decideTransition({ ...base, phase: "review" });
    expect(d).toEqual({ phase: "review", armMerge: true, hold: false, demote: false });
  });

  it("interrupts to fix on failing CI from any ladder phase", () => {
    for (const phase of ["implement", "qa", "review"]) {
      expect(decideTransition({ ...base, phase, ci: "failing" }).phase).toBe("fix");
    }
  });

  it("resumes out of fix at the marker-implied phase on green CI", () => {
    const d = decideTransition({ ...base, phase: "fix", markers: [PLANNED_MARKER, QA_DONE_MARKER] });
    expect(d.phase).toBe("review");
    expect(d.hold).toBe(false);
  });

  it("stays in fix while CI is still red", () => {
    const d = decideTransition({ ...base, phase: "fix", ci: "failing" });
    expect(d).toEqual({ phase: "fix", armMerge: false, hold: true, demote: false });
  });

  it("demotes to implement on a scope-fingerprint mismatch, before any other rule", () => {
    // Even with a clean forward path and a failing CI, scope-stale wins.
    const d = decideTransition({ ...base, phase: "review", ci: "failing", scopeStale: true });
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
    expect(stampRound(null, "2026-07-10")).toEqual({ count: 1, last_completed: "2026-07-10" });
  });

  it("increments an existing count", () => {
    expect(stampRound({ count: 1, last_completed: "2026-01-01" }, "2026-07-10")).toEqual({
      count: 2,
      last_completed: "2026-07-10",
    });
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

  it("isStrategyStale: null execution or null stamp is never stale; mismatch is stale", () => {
    expect(isStrategyStale(null, "fp")).toBe(false);
    expect(isStrategyStale(exec({ strategy_fingerprint: null }), "fp")).toBe(false);
    expect(isStrategyStale(exec({ strategy_fingerprint: "fp" }), "fp")).toBe(false);
    expect(isStrategyStale(exec({ strategy_fingerprint: "old" }), "fp")).toBe(true);
  });
});
