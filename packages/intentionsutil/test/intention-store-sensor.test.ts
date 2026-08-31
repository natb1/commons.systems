import { describe, expect, it } from "vitest";
import type { IntentionNode, OfficeHours, SuccessSignal } from "../src/schema.js";
import {
  INTENTION_STORE_SENSOR_NAME,
  makeIntentionStoreSensor,
  openTacticServesCoverage,
  parkedCensus,
  sensorReadingCoverage,
} from "../scripts/read-sensors.js";

/** Build an IntentionNode fixture, filling required/default fields. */
function node(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind ?? "tactic",
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

/** A well-formed success signal naming `sensor`. */
function signal(sensor: string): SuccessSignal {
  return {
    observable: `observable for ${sensor}`,
    sensor,
    threshold: "some threshold",
    is_proxy: false,
  };
}

/** An `office_hours` park record, e.g. `office_hours: parked("needs a ruling")`. */
function parked(recommendation: string | null = null): OfficeHours {
  return { reason: "parked", since: "2026-07-06", recommendation, session_type: "other" };
}

describe("openTacticServesCoverage", () => {
  it("counts only open tactics (phase non-null, not done)", () => {
    const nodes = [
      node({ id: "open-with", phase: "implement", serves: ["s1"] }),
      node({ id: "open-without", phase: "qa", serves: [] }),
      node({ id: "done-tactic", phase: "done", serves: ["s1"] }),
      node({ id: "phase-null-tactic", phase: null, serves: ["s1"] }),
    ];
    expect(openTacticServesCoverage(nodes)).toEqual({ withServes: 1, open: 2 });
  });

  it("ignores non-tactic kinds even when they carry serves", () => {
    const nodes = [
      node({ id: "strat", kind: "strategy", phase: "implement", serves: ["v1"] }),
      node({ id: "tac", kind: "tactic", phase: "implement", serves: ["s1"] }),
    ];
    // A strategy never carries a real dispatch phase, but even a stray one is
    // excluded because the count is tactic-only.
    expect(openTacticServesCoverage(nodes)).toEqual({ withServes: 1, open: 1 });
  });

  it("returns zeroes for an empty store", () => {
    expect(openTacticServesCoverage([])).toEqual({ withServes: 0, open: 0 });
  });
});

describe("sensorReadingCoverage", () => {
  const registered = new Set<string>(["vitest", INTENTION_STORE_SENSOR_NAME]);

  it("counts strategies with a signal, split by reading and registration", () => {
    const nodes = [
      node({ id: "s-read", kind: "strategy", success_signal: signal("vitest"), reading: "x" }),
      node({ id: "s-unread", kind: "strategy", success_signal: signal("vitest"), reading: null }),
      node({
        id: "s-unreg",
        kind: "strategy",
        success_signal: signal("nowhere"),
        reading: "y",
      }),
      node({ id: "s-nosignal", kind: "strategy", success_signal: null }),
    ];
    expect(sensorReadingCoverage(nodes, registered)).toEqual({
      read: 2,
      total: 3,
      unregistered: 1,
    });
  });

  it("ignores non-strategy nodes that name a signal", () => {
    const nodes = [
      node({ id: "tac", kind: "tactic", success_signal: signal("vitest"), reading: "x" }),
      node({ id: "strat", kind: "strategy", success_signal: signal("vitest"), reading: "x" }),
    ];
    expect(sensorReadingCoverage(nodes, registered)).toEqual({
      read: 1,
      total: 1,
      unregistered: 0,
    });
  });

  it("returns zeroes for an empty store", () => {
    expect(sensorReadingCoverage([], registered)).toEqual({
      read: 0,
      total: 0,
      unregistered: 0,
    });
  });
});

describe("parkedCensus", () => {
  // Re-expressed from the retired `rsi-plan.md` renderer's test suite
  // (packages/intentionsutil/test/rsi.test.ts, salvaged in
  // /home/n8/.claude/jobs/54283386/tmp/unit6-salvage.ts): "counts open nodes
  // held by a blocked_by edge onto a parked node". The carrier moved from
  // `renderRsiPlan`'s markdown output to `parkedCensus`'s `blocked` field
  // directly — the salvaged fixtures (`node`, `parked`) are reproduced above
  // in this file's local helpers, so the expectation is asserted on the
  // return value rather than on rendered markdown. The expected count (1) is
  // unchanged: this is the HELD-NODE denominator (see `parkedCensus`'s doc
  // comment in read-sensors.ts), which is exactly what the retired
  // `countBlockedByParked` this test originally exercised computed.
  it("counts open nodes held by a blocked_by edge onto a parked node", () => {
    const nodes = [
      node({ id: "tactic-parked", office_hours: parked("needs a ruling") }),
      node({ id: "tactic-held", phase: "qa", blocked_by: ["tactic-parked"] }),
      node({ id: "tactic-done-held", phase: "done", blocked_by: ["tactic-parked"] }),
    ];
    expect(parkedCensus(nodes).blocked).toBe(1);
  });

  it("counts the parked total independently of how many are held", () => {
    const nodes = [
      node({ id: "tactic-parked-a", office_hours: parked() }),
      node({ id: "tactic-parked-b", office_hours: parked() }),
      node({ id: "tactic-open", phase: "implement" }),
    ];
    expect(parkedCensus(nodes)).toEqual({ parked: 2, blocked: 0 });
  });

  it("counts a held node only once even when blocked by two parked nodes (held-node, not distinct-blocker)", () => {
    const nodes = [
      node({ id: "tactic-parked-a", office_hours: parked() }),
      node({ id: "tactic-parked-b", office_hours: parked() }),
      node({
        id: "tactic-held",
        phase: "qa",
        blocked_by: ["tactic-parked-a", "tactic-parked-b"],
      }),
    ];
    // Two DISTINCT blocking parks, but exactly one HELD node — this is the
    // divergence between the two denominators the doc comment on
    // `parkedCensus` describes: a distinct-blocker count would read 2 here.
    expect(parkedCensus(nodes).blocked).toBe(1);
  });

  it("does not count a node blocked by a non-parked node", () => {
    const nodes = [
      node({ id: "tactic-open-blocker" }),
      node({ id: "tactic-held", phase: "qa", blocked_by: ["tactic-open-blocker"] }),
    ];
    expect(parkedCensus(nodes).blocked).toBe(0);
  });

  it("returns zeroes for an empty store", () => {
    expect(parkedCensus([])).toEqual({ parked: 0, blocked: 0 });
  });
});

describe("makeIntentionStoreSensor", () => {
  const registered = new Set<string>(["vitest", INTENTION_STORE_SENSOR_NAME]);

  it("names itself the verbatim declared sensor string", () => {
    const sensor = makeIntentionStoreSensor(() => registered, () => []);
    expect(sensor.name).toBe("the intention store itself");
    expect(INTENTION_STORE_SENSOR_NAME).toBe("the intention store itself");
  });

  it("renders the stable dual-coverage format", () => {
    const nodes = [
      node({ id: "t-open-with", phase: "implement", serves: ["s1"] }),
      node({ id: "t-open-without", phase: "qa", serves: [] }),
      node({ id: "t-done", phase: "done", serves: ["s1"] }),
      node({ id: "s-read", kind: "strategy", success_signal: signal("vitest"), reading: "x" }),
      node({ id: "s-unread", kind: "strategy", success_signal: signal("vitest"), reading: null }),
      node({ id: "s-unreg", kind: "strategy", success_signal: signal("nowhere"), reading: "y" }),
    ];
    const sensor = makeIntentionStoreSensor(() => registered, () => nodes);
    expect(sensor.read(nodes[0])).toBe(
      "serves: 1/2 open tactics; readings: 2/3 sensor-naming strategies (1 unregistered sensor)",
    );
  });

  it("is total — degrades to 'unknown' when loadNodes throws", () => {
    const sensor = makeIntentionStoreSensor(() => registered, () => {
      throw new Error("store unreadable");
    });
    expect(sensor.read(node({ id: "any" }))).toBe("unknown");
  });
});
