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
