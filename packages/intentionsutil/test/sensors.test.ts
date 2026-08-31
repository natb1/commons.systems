import { describe, expect, it } from "vitest";
import type { IntentionNode, SuccessSignal } from "../src/schema.js";
import { IntentionSchemaError } from "../src/errors.js";
import {
  SensorRegistry,
  readNodeSignal,
  deriveGap,
  findFalsifiedProxies,
  findCodificationDrift,
  surfaceCandidates,
  confirmPushDowns,
  validateRegisteredSensorNames,
  findUnboundRegisteredSensorNames,
  formatUnboundSensorNames,
  type Sensor,
} from "../src/sensors.js";

/** Build an IntentionNode fixture, filling required/default fields. */
function node(partial: Partial<IntentionNode> & { id: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind ?? "tactic",
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
    status: partial.status ?? "raw",
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

/** Build a SuccessSignal, defaulting non-proxy. */
function signal(partial: Partial<SuccessSignal> & { threshold: string }): SuccessSignal {
  return {
    observable: partial.observable ?? "o",
    sensor: partial.sensor ?? "s",
    threshold: partial.threshold,
    is_proxy: partial.is_proxy ?? false,
  };
}

describe("SensorRegistry", () => {
  it("registers then resolves a sensor", () => {
    const registry = new SensorRegistry();
    const sensor: Sensor = { name: "ci-status", read: () => "green" };
    registry.register(sensor);
    expect(registry.resolve("ci-status")).toBe(sensor);
  });

  it("throws IntentionSchemaError naming the missing sensor on an unregistered name", () => {
    const registry = new SensorRegistry();
    registry.register({ name: "ci-status", read: () => "green" });
    expect(() => registry.resolve("nope")).toThrow(IntentionSchemaError);
    expect(() => registry.resolve("nope")).toThrow(/nope/);
    // The error names the registered sensors so the misconfiguration is debuggable.
    expect(() => registry.resolve("nope")).toThrow(/ci-status/);
  });

  it("reports (none registered) for an empty registry", () => {
    const registry = new SensorRegistry();
    expect(() => registry.resolve("anything")).toThrow(/none registered/);
  });

  it("a later registration overwrites an earlier one of the same name", () => {
    const registry = new SensorRegistry();
    registry.register({ name: "s", read: () => "old" });
    const fresh: Sensor = { name: "s", read: () => "new" };
    registry.register(fresh);
    expect(registry.resolve("s")).toBe(fresh);
  });
});

describe("readNodeSignal", () => {
  it("resolves the node's named sensor and reads it", () => {
    const registry = new SensorRegistry();
    registry.register({ name: "ci-status", read: (n) => `read-${n.id}` });
    const n = node({ id: "n1", success_signal: signal({ sensor: "ci-status", threshold: "t" }) });
    expect(readNodeSignal(n, registry)).toBe("read-n1");
  });

  it("throws IntentionSchemaError when the node has no success_signal", () => {
    const registry = new SensorRegistry();
    const n = node({ id: "n1", success_signal: null });
    expect(() => readNodeSignal(n, registry)).toThrow(IntentionSchemaError);
    expect(() => readNodeSignal(n, registry)).toThrow(/no success_signal/);
  });
});

describe("validateRegisteredSensorNames", () => {
  const RECORDED = "the intention store and the router's selection log";

  it("passes when every registered name is recorded verbatim by a node", () => {
    const nodes = [
      node({ id: "strategy-a", success_signal: signal({ sensor: RECORDED, threshold: "t" }) }),
      node({ id: "strategy-b", success_signal: signal({ sensor: "main-health", threshold: "t" }) }),
    ];
    expect(() =>
      validateRegisteredSensorNames(nodes, [RECORDED, "main-health"])
    ).not.toThrow();
  });

  it("throws when a node's sensor prose drifted from the registered name", () => {
    // The 2026-08-12 shape: an /align round appends a clause to the recorded
    // sensor, so the registered name resolves to nothing.
    const nodes = [
      node({
        id: "strategy-a",
        success_signal: signal({ sensor: `${RECORDED}; and a park-cause reading`, threshold: "t" }),
      }),
    ];
    expect(() => validateRegisteredSensorNames(nodes, [RECORDED])).toThrow(IntentionSchemaError);
    expect(() => validateRegisteredSensorNames(nodes, [RECORDED])).toThrow(/not recorded by any node/);
    expect(() => validateRegisteredSensorNames(nodes, [RECORDED])).toThrow(new RegExp(RECORDED));
  });

  it("does not assert the reverse: an unregistered node sensor is fine", () => {
    const nodes = [
      node({ id: "strategy-a", success_signal: signal({ sensor: RECORDED, threshold: "t" }) }),
      node({ id: "strategy-b", success_signal: signal({ sensor: "owner judgment", threshold: "t" }) }),
      node({ id: "strategy-c", success_signal: null }),
    ];
    expect(() => validateRegisteredSensorNames(nodes, [RECORDED])).not.toThrow();
  });

  it("exempts a declared node-agnostic name that no node records", () => {
    const nodes = [node({ id: "strategy-a", success_signal: null })];
    expect(() => validateRegisteredSensorNames(nodes, ["vitest", "git"], ["vitest", "git"])).not.toThrow();
    expect(() => validateRegisteredSensorNames(nodes, ["vitest", "git"], ["vitest"])).toThrow(/"git"/);
  });
});

describe("findUnboundRegisteredSensorNames", () => {
  const RECORDED = "the intention store and the router's selection log";

  it("returns nothing when every registered name is recorded verbatim", () => {
    const nodes = [
      node({ id: "strategy-a", success_signal: signal({ sensor: RECORDED, threshold: "t" }) }),
    ];
    expect(findUnboundRegisteredSensorNames(nodes, [RECORDED])).toEqual([]);
  });

  it("attributes a reworded sensor to the node that reworded it (2026-08-12 shape)", () => {
    // An /align round appends a clause, so the registered name resolves to
    // nothing. The orphan IS about a node, and the diagnostic names it.
    const nodes = [
      node({
        id: "strategy-a",
        success_signal: signal({ sensor: `${RECORDED}; and a park-cause reading`, threshold: "t" }),
      }),
      node({ id: "strategy-b", success_signal: signal({ sensor: "owner judgment", threshold: "t" }) }),
    ];
    expect(findUnboundRegisteredSensorNames(nodes, [RECORDED])).toEqual([
      { name: RECORDED, candidateNodeIds: ["strategy-a"] },
    ]);
  });

  it("attributes a trimmed sensor too — the reword can shorten the prose", () => {
    const nodes = [
      node({
        id: "strategy-a",
        success_signal: signal({ sensor: "the intention store", threshold: "t" }),
      }),
    ];
    expect(findUnboundRegisteredSensorNames(nodes, [RECORDED])).toEqual([
      { name: RECORDED, candidateNodeIds: ["strategy-a"] },
    ]);
  });

  it("attributes a never-bound constant to NO node (2026-08-14 shape)", () => {
    // The registry gained a name and the binding step was deferred. Nothing
    // about any node is wrong, so no node is named — and this is the case that
    // must not deny an unrelated writer the graph write path.
    const nodes = [
      node({ id: "strategy-a", success_signal: signal({ sensor: RECORDED, threshold: "t" }) }),
    ];
    expect(
      findUnboundRegisteredSensorNames(nodes, [RECORDED, "ladder-terminus census"]),
    ).toEqual([{ name: "ladder-terminus census", candidateNodeIds: [] }]);
  });

  it("does not attribute a node that verbatim records a different registered name", () => {
    const nodes = [
      node({ id: "strategy-a", success_signal: signal({ sensor: "main-health", threshold: "t" }) }),
    ];
    expect(
      findUnboundRegisteredSensorNames(nodes, ["main-health", "main-health check count"]),
    ).toEqual([{ name: "main-health check count", candidateNodeIds: [] }]);
  });

  it("exempts declared node-agnostic names and sorts the rest by name", () => {
    const nodes = [node({ id: "strategy-a", success_signal: null })];
    expect(findUnboundRegisteredSensorNames(nodes, ["vitest", "git"], ["vitest", "git"])).toEqual([]);
    expect(findUnboundRegisteredSensorNames(nodes, ["vitest", "git"], ["vitest"])).toEqual([
      { name: "git", candidateNodeIds: [] },
    ]);
  });

  it("ignores nodes with no success_signal and empty sensor prose", () => {
    const nodes = [
      node({ id: "strategy-a", success_signal: null }),
      node({ id: "strategy-b", success_signal: signal({ sensor: "   ", threshold: "t" }) }),
    ];
    expect(findUnboundRegisteredSensorNames(nodes, [RECORDED])).toEqual([
      { name: RECORDED, candidateNodeIds: [] },
    ]);
  });
});

describe("formatUnboundSensorNames", () => {
  it("names the attributed nodes when the orphan is a reword", () => {
    const message = formatUnboundSensorNames([
      { name: "store census", candidateNodeIds: ["strategy-a", "strategy-b"] },
    ]);
    expect(message).toContain(`  - "store census" — possibly reworded on: strategy-a, strategy-b`);
    expect(message).toContain("not recorded by any node");
  });

  it("says so explicitly when the orphan is attributable to no node", () => {
    const message = formatUnboundSensorNames([{ name: "store census", candidateNodeIds: [] }]);
    expect(message).toContain("attributable to no node");
  });
});

describe("deriveGap", () => {
  it("returns null when the reading meets the threshold", () => {
    const n = node({ id: "n", reading: "0 orphans", success_signal: signal({ threshold: "0 orphans" }) });
    expect(deriveGap(n)).toBeNull();
  });

  it("matches trimmed, case-insensitively", () => {
    const n = node({
      id: "n",
      reading: "  GREEN  ",
      success_signal: signal({ threshold: "green" }),
    });
    expect(deriveGap(n)).toBeNull();
  });

  it("returns a gap string when the reading does not meet the threshold", () => {
    const n = node({ id: "n", reading: "red", success_signal: signal({ threshold: "green" }) });
    expect(deriveGap(n)).toBe('reading "red" does not meet threshold "green"');
  });

  it("returns null when there is no success_signal", () => {
    expect(deriveGap(node({ id: "n", success_signal: null }))).toBeNull();
  });

  it("returns a gap string mentioning the missing reading when reading is null", () => {
    const n = node({ id: "n", reading: null, success_signal: signal({ threshold: "green" }) });
    const gap = deriveGap(n);
    expect(gap).toBe("no reading yet (threshold: green)");
  });
});

describe("findFalsifiedProxies (effect #2)", () => {
  it("returns a proxy node that was measured but still falls short", () => {
    const falsified = node({
      id: "falsified",
      reading: "red",
      success_signal: signal({ threshold: "green", is_proxy: true }),
    });
    expect(findFalsifiedProxies([falsified]).map((n) => n.id)).toEqual(["falsified"]);
  });

  it("does not return a proxy node that meets its threshold", () => {
    const ok = node({
      id: "ok",
      reading: "green",
      success_signal: signal({ threshold: "green", is_proxy: true }),
    });
    expect(findFalsifiedProxies([ok])).toEqual([]);
  });

  it("does not return an unread proxy (reading null) despite a non-null deriveGap", () => {
    const unread = node({
      id: "unread",
      reading: null,
      success_signal: signal({ threshold: "green", is_proxy: true }),
    });
    expect(findFalsifiedProxies([unread])).toEqual([]);
  });

  it("does not return a non-proxy node that falls short", () => {
    const nonProxy = node({
      id: "nonproxy",
      reading: "red",
      success_signal: signal({ threshold: "green", is_proxy: false }),
    });
    expect(findFalsifiedProxies([nonProxy])).toEqual([]);
  });
});

describe("findCodificationDrift (effect #3)", () => {
  it("returns a codified node whose signal fails its threshold", () => {
    const drifted = node({
      id: "drifted",
      status: "codified",
      reading: "red",
      success_signal: signal({ threshold: "green" }),
    });
    expect(findCodificationDrift([drifted]).map((n) => n.id)).toEqual(["drifted"]);
  });

  it("does not return a codified node that meets its threshold", () => {
    const holding = node({
      id: "holding",
      status: "codified",
      reading: "green",
      success_signal: signal({ threshold: "green" }),
    });
    expect(findCodificationDrift([holding])).toEqual([]);
  });

  it("does not return a non-codified node that fails its threshold", () => {
    const raw = node({
      id: "raw",
      status: "raw",
      reading: "red",
      success_signal: signal({ threshold: "green" }),
    });
    expect(findCodificationDrift([raw])).toEqual([]);
  });

  it("does not return a codified node with no success_signal (nothing to drift against)", () => {
    const noSignal = node({ id: "nosignal", status: "codified", success_signal: null });
    expect(findCodificationDrift([noSignal])).toEqual([]);
  });

  it("returns a codified node carrying a signal but no reading yet (unread counts as drift)", () => {
    const unread = node({
      id: "unread",
      status: "codified",
      reading: null,
      success_signal: signal({ threshold: "green" }),
    });
    expect(findCodificationDrift([unread]).map((n) => n.id)).toEqual(["unread"]);
  });
});

describe("confirmPushDowns (effect #5)", () => {
  it("confirms a delegated procedure node with an author-use reading meeting threshold", () => {
    const pushed = node({
      id: "pushed",
      owner: "procedure",
      status: "delegated",
      reading: null,
      success_signal: signal({ threshold: "green" }),
    });
    const readings = [{ node_id: "pushed", reading: "green" }];
    expect(confirmPushDowns([pushed], readings).map((n) => n.id)).toEqual(["pushed"]);
  });

  it("confirms a codified ai node from the author-use reading, ignoring a short stored reading", () => {
    // Stored reading is short; only the author-use reading meets threshold. This
    // pins that confirmation reads the readings entry, not node.reading.
    const pushed = node({
      id: "pushed",
      owner: "ai",
      status: "codified",
      reading: "red",
      success_signal: signal({ threshold: "green" }),
    });
    const readings = [{ node_id: "pushed", reading: "green" }];
    expect(confirmPushDowns([pushed], readings).map((n) => n.id)).toEqual(["pushed"]);
  });

  it("does not confirm a pushed-down node without a matching reading (stays provisional)", () => {
    const pushed = node({
      id: "pushed",
      owner: "procedure",
      status: "codified",
      reading: "green",
      success_signal: signal({ threshold: "green" }),
    });
    expect(confirmPushDowns([pushed], [])).toEqual([]);
  });

  it("does not confirm when the author-use reading is short of threshold", () => {
    const pushed = node({
      id: "pushed",
      owner: "procedure",
      status: "delegated",
      success_signal: signal({ threshold: "green" }),
    });
    const readings = [{ node_id: "pushed", reading: "red" }];
    expect(confirmPushDowns([pushed], readings)).toEqual([]);
  });

  it("does not confirm a raw/human node even with a passing author-use reading", () => {
    const notPushed = node({
      id: "human-raw",
      owner: "human",
      status: "raw",
      success_signal: signal({ threshold: "green" }),
    });
    const readings = [{ node_id: "human-raw", reading: "green" }];
    expect(confirmPushDowns([notPushed], readings)).toEqual([]);
  });
});

describe("surfaceCandidates (effect #4)", () => {
  it("surfaces a candidate for an orphan reading (node_id not among nodes)", () => {
    const nodes = [node({ id: "existing" })];
    const readings = [{ node_id: "orphan", reading: "users keep asking for X" }];
    const candidates = surfaceCandidates(nodes, readings);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].source_node_id).toBe("orphan");
    expect(candidates[0].statement).toContain("users keep asking for X");
    expect(candidates[0].provenance).toContain("orphan");
  });

  it("yields no candidate for a reading matching an existing node", () => {
    const nodes = [node({ id: "existing" })];
    const readings = [{ node_id: "existing", reading: "anything" }];
    expect(surfaceCandidates(nodes, readings)).toEqual([]);
  });

  it("QUARANTINE INVARIANT: candidates are not IntentionNodes (no id/owner/status)", () => {
    const readings = [{ node_id: "orphan", reading: "a need" }];
    const candidates = surfaceCandidates([], readings);
    const candidate = candidates[0];
    expect("id" in candidate).toBe(false);
    expect("owner" in candidate).toBe(false);
    expect("status" in candidate).toBe(false);
    // Only the quarantined record fields are present.
    expect(Object.keys(candidate).sort()).toEqual(["provenance", "source_node_id", "statement"]);
  });

  it("performs no IO and returns synchronously (signature takes no dir)", () => {
    // By design: surfaceCandidates(nodes, readings) has no dir param and is pure.
    // Calling it returns a value synchronously (not a Promise).
    const result = surfaceCandidates([], [{ node_id: "x", reading: "y" }]);
    expect(Array.isArray(result)).toBe(true);
    expect(result).not.toBeInstanceOf(Promise);
  });
});
