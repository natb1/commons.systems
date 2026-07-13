import { describe, expect, it } from "vitest";
import type { IntentionNode, SuccessSignal } from "../src/schema.js";
import {
  INTENTION_STORE_SENSOR_NAME,
  makeIntentionStoreSensor,
  openTacticServesCoverage,
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

/** A well-formed success signal naming `sensor`. */
function signal(sensor: string): SuccessSignal {
  return {
    observable: `observable for ${sensor}`,
    sensor,
    threshold: "some threshold",
    is_proxy: false,
  };
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
