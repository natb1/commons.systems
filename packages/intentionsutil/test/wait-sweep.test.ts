import { describe, expect, it } from "vitest";
import { listWaitCandidates } from "../src/wait-sweep.js";
import { WAIT_ATTEMPT_CAP, WAIT_MAX_HORIZON_MS } from "../src/waits.js";
import type { IntentionNode, OfficeHours } from "../src/schema.js";

/** Minimal full IntentionNode fixture (mirrors hold-sweep.test.ts's `anode`). */
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

const PARKED: OfficeHours = {
  reason: "wait attempt cap reached",
  since: "2026-07-30",
  recommendation: null,
  session_type: "other",
};

const NOW = Date.parse("2026-08-05T00:00:00Z");
const PAST = "2026-08-01T00:00:00Z"; // before NOW
const FUTURE = "2026-08-10T00:00:00Z"; // after NOW

/** A WAIT node for `sourceId`, at the canonical derived id. */
function wait(sourceId: string, partial: Partial<IntentionNode> = {}): IntentionNode {
  return anode({
    id: `tactic-wait-${sourceId.replace(/^tactic-/, "")}`,
    kind: "tactic",
    attributes: { wait_for: sourceId, wait_until: PAST, wait_attempts: 1 },
    ...partial,
  });
}

/** The source node a WAIT blocks. */
function source(id: string, blockedBy: string[]): IntentionNode {
  return anode({ id, kind: "tactic", phase: "implement", blocked_by: blockedBy });
}

describe("listWaitCandidates", () => {
  it("skips a node that is not a canonical WAIT node", () => {
    const decoy = anode({
      id: "tactic-not-a-real-wait",
      kind: "tactic",
      attributes: { wait_for: "tactic-a", wait_until: PAST, wait_attempts: 1 },
    });
    expect(listWaitCandidates([decoy, source("tactic-a", [decoy.id])], NOW)).toEqual([]);
  });

  it("emits nothing for an orphan WAIT whose source is absent", () => {
    const w = wait("tactic-gone");
    expect(listWaitCandidates([w], NOW)).toEqual([]);
  });

  it("emits nothing when the source's blocked_by no longer names the WAIT", () => {
    const w = wait("tactic-a");
    expect(listWaitCandidates([w, source("tactic-a", [])], NOW)).toEqual([]);
  });

  it("emits nothing for a phase:done WAIT even though the blocked_by edge survives", () => {
    // The subtlest divergence from hold-sweep: a done hold with a surviving
    // edge is edge-residue debt, but a done WAIT with a surviving edge is the
    // normal, quiescent post-release state that makes re-arm-in-place work.
    const w = wait("tactic-a", { phase: "done" });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result).toEqual([]);
  });

  it("classifies a non-done, non-null phase as malformed", () => {
    const w = wait("tactic-a", { phase: "implement" });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result).toEqual([
      { waitId: w.id, sourceId: "tactic-a", attempts: 0, waitUntil: 0, cls: "malformed" },
    ]);
  });

  it("classifies an unparseable wait_until as malformed", () => {
    const w = wait("tactic-a", { attributes: { wait_for: "tactic-a", wait_until: "not-a-date", wait_attempts: 1 } });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result).toEqual([
      { waitId: w.id, sourceId: "tactic-a", attempts: 0, waitUntil: 0, cls: "malformed" },
    ]);
  });

  it("classifies a missing wait_attempts as malformed", () => {
    const w = wait("tactic-a", { attributes: { wait_for: "tactic-a", wait_until: PAST } });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result).toEqual([
      { waitId: w.id, sourceId: "tactic-a", attempts: 0, waitUntil: Date.parse(PAST), cls: "malformed" },
    ]);
  });

  it("classifies a non-integer wait_attempts as malformed", () => {
    const w = wait("tactic-a", {
      attributes: { wait_for: "tactic-a", wait_until: PAST, wait_attempts: 1.5 },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result.map((c) => c.cls)).toEqual(["malformed"]);
  });

  it("classifies a zero wait_attempts as malformed", () => {
    const w = wait("tactic-a", {
      attributes: { wait_for: "tactic-a", wait_until: PAST, wait_attempts: 0 },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result.map((c) => c.cls)).toEqual(["malformed"]);
  });

  it("emits nothing for a WAIT already parked to office_hours", () => {
    const w = wait("tactic-a", { office_hours: PARKED, attributes: { wait_for: "tactic-a", wait_until: PAST, wait_attempts: WAIT_ATTEMPT_CAP } });
    expect(listWaitCandidates([w, source("tactic-a", [w.id])], NOW)).toEqual([]);
  });

  it("classifies a due WAIT at or above the attempt cap as capped", () => {
    const w = wait("tactic-a", {
      attributes: { wait_for: "tactic-a", wait_until: PAST, wait_attempts: WAIT_ATTEMPT_CAP },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result).toEqual([
      {
        waitId: w.id,
        sourceId: "tactic-a",
        attempts: WAIT_ATTEMPT_CAP,
        waitUntil: Date.parse(PAST),
        cls: "capped",
      },
    ]);
  });

  it("classifies a due WAIT below the attempt cap as due", () => {
    const w = wait("tactic-a", {
      attributes: { wait_for: "tactic-a", wait_until: PAST, wait_attempts: WAIT_ATTEMPT_CAP - 1 },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result).toEqual([
      {
        waitId: w.id,
        sourceId: "tactic-a",
        attempts: WAIT_ATTEMPT_CAP - 1,
        waitUntil: Date.parse(PAST),
        cls: "due",
      },
    ]);
  });

  it("classifies a not-yet-due WAIT as waiting", () => {
    const w = wait("tactic-a", {
      attributes: { wait_for: "tactic-a", wait_until: FUTURE, wait_attempts: 1 },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result).toEqual([
      { waitId: w.id, sourceId: "tactic-a", attempts: 1, waitUntil: Date.parse(FUTURE), cls: "waiting" },
    ]);
  });

  // --- the horizon rungs ---------------------------------------------------
  // A wait armed for a distant instant is NEVER due, so `wait_attempts` never
  // increments and `capped` is unreachable through the attempt cap. Without
  // the horizon it would be classified `waiting` on every sweep forever while
  // its blocked_by edge held the source — an invisible, indefinite block.
  const BEYOND_HORIZON = new Date(NOW + WAIT_MAX_HORIZON_MS + 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const AT_HORIZON = new Date(NOW + WAIT_MAX_HORIZON_MS).toISOString().replace(/\.\d{3}Z$/, "Z");

  it("classifies a wait armed beyond the horizon as capped, not waiting", () => {
    const w = wait("tactic-a", {
      attributes: { wait_for: "tactic-a", wait_until: BEYOND_HORIZON, wait_attempts: 1 },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result.map((c) => c.cls)).toEqual(["capped"]);
  });

  it("classifies a wait armed exactly at the horizon as waiting", () => {
    const w = wait("tactic-a", {
      attributes: { wait_for: "tactic-a", wait_until: AT_HORIZON, wait_attempts: 1 },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result.map((c) => c.cls)).toEqual(["waiting"]);
  });

  it("classifies a wait continuously armed past the horizon as capped, whatever its attempts", () => {
    // The EXTEND blind spot: an extension is not a new attempt, so a wait
    // re-extended before every deadline sits at wait_attempts: 1 forever.
    // Cumulative armed AGE is what escalates it.
    const armedSince = new Date(NOW - WAIT_MAX_HORIZON_MS - 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
    const w = wait("tactic-a", {
      attributes: {
        wait_for: "tactic-a",
        wait_until: FUTURE,
        wait_armed_since: armedSince,
        wait_attempts: 1,
      },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result.map((c) => c.cls)).toEqual(["capped"]);
  });

  it("leaves a recently-armed wait alone", () => {
    const armedSince = new Date(NOW - 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
    const w = wait("tactic-a", {
      attributes: {
        wait_for: "tactic-a",
        wait_until: FUTURE,
        wait_armed_since: armedSince,
        wait_attempts: 1,
      },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result.map((c) => c.cls)).toEqual(["waiting"]);
  });

  it("treats an absent wait_armed_since as unremarkable, not malformed", () => {
    // Waits minted before the field existed still classify on wait_until alone.
    const w = wait("tactic-a", {
      attributes: { wait_for: "tactic-a", wait_until: FUTURE, wait_attempts: 1 },
    });
    const result = listWaitCandidates([w, source("tactic-a", [w.id])], NOW);
    expect(result.map((c) => c.cls)).toEqual(["waiting"]);
  });

  it("sorts multiple candidates by wait id ascending", () => {
    const c = wait("tactic-c");
    const a = wait("tactic-a");
    const b = wait("tactic-b");
    const result = listWaitCandidates(
      [
        c,
        source("tactic-c", [c.id]),
        a,
        source("tactic-a", [a.id]),
        b,
        source("tactic-b", [b.id]),
      ],
      NOW,
    );
    expect(result.map((r) => r.waitId)).toEqual(["tactic-wait-a", "tactic-wait-b", "tactic-wait-c"]);
  });
});
