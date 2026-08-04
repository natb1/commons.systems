import { describe, expect, it } from "vitest";
import { HOLD_KINDS, KIND_RECHECK, holdIdFor } from "../src/holds.js";

// tactic-stale-hold-auto-resolve Unit 1 — the hold-kind re-check vocabulary.
// KIND_RECHECK is typed `Record<HoldKind, HoldRecheck>`, so an unclassified new
// kind already fails typecheck; these assertions cover the runtime shape a
// consumer relies on (every kind classified, every manual entry justified).

describe("KIND_RECHECK", () => {
  it("classifies every hold kind", () => {
    for (const kind of HOLD_KINDS) {
      expect(KIND_RECHECK[kind]).toBeDefined();
    }
    expect(Object.keys(KIND_RECHECK).sort()).toEqual([...HOLD_KINDS].sort());
  });

  it("gives every manual entry a non-empty why", () => {
    for (const kind of HOLD_KINDS) {
      const recheck = KIND_RECHECK[kind];
      if (recheck.policy === "manual") {
        expect(typeof recheck.why).toBe("string");
        expect(recheck.why.trim()).not.toBe("");
      }
    }
  });

  it("has exactly one auto-re-checkable kind", () => {
    const auto = HOLD_KINDS.filter((k) => KIND_RECHECK[k].policy === "auto");
    expect(auto).toEqual(["worktree-residue"]);
  });
});

describe("holdIdFor", () => {
  it("derives the residue hold id", () => {
    expect(holdIdFor("worktree-residue", "tactic-x")).toBe("tactic-hold-residue-x");
  });
});
