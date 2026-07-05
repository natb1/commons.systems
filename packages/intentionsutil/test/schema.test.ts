import { describe, expect, it } from "vitest";
import type { IntentionNode } from "../src/schema.js";
import { validateGraph, validateNode } from "../src/schema.js";

describe("validateNode", () => {
  it("accepts a valid full node", () => {
    const input = {
      id: "n1",
      kind: "strategy",
      statement: "A full node.",
      owner: "human",
      status: "codified",
      parent: "p",
      serves: ["v1", "v2"],
      recovers: ["d1"],
      rationale: "r",
      reading: "rd",
      gap: "g",
      clarifications: [{ question: "q", answer: "a" }],
      tooling_goals: [{ kind: "actuator", statement: "t" }],
      success_signal: {
        observable: "o",
        sensor: "s",
        threshold: "th",
        is_proxy: true,
      },
      attention: {
        boost: 2,
        override: null,
        rationale: "Draws attention now.",
      },
      attributes: { source: "github:natb1/commons.systems#1" },
    };
    expect(validateNode(input)).toEqual({
      ...input,
      // Graph-native dispatch fields default when absent.
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      office_hours: null,
      pace_exempt: false,
      rounds: null,
    });
  });

  it("parses all graph-native dispatch fields when present", () => {
    const input = {
      id: "n1-dispatch",
      kind: "tactic",
      statement: "A tactic carrying full dispatch state.",
      owner: "ai",
      status: "codified",
      phase: "qa",
      execution: {
        branch: "123-do-the-thing",
        pr: 456,
        attempts: { implement: 1, qa: 2 },
        markers: ["dispatch:qa"],
        strategy_fingerprint: "abc123",
      },
      validates: ["strategy-1"],
      blocked_by: ["tactic-2"],
      office_hours: { reason: "needs human input", since: "2026-07-03" },
      pace_exempt: true,
      rounds: { count: 3, last_completed: "2026-07-02" },
    };
    const result = validateNode(input);
    expect(result.phase).toBe("qa");
    expect(result.execution).toEqual({
      branch: "123-do-the-thing",
      pr: 456,
      attempts: { implement: 1, qa: 2 },
      markers: ["dispatch:qa"],
      strategy_fingerprint: "abc123",
    });
    expect(result.validates).toEqual(["strategy-1"]);
    expect(result.blocked_by).toEqual(["tactic-2"]);
    expect(result.office_hours).toEqual({ reason: "needs human input", since: "2026-07-03" });
    expect(result.pace_exempt).toBe(true);
    expect(result.rounds).toEqual({ count: 3, last_completed: "2026-07-02" });
  });

  it("defaults execution nested nullables and tolerates a bare execution", () => {
    const result = validateNode({
      id: "n1-exec",
      kind: "tactic",
      statement: "Execution with null pr and fingerprint.",
      owner: "ai",
      status: "raw",
      execution: { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    expect(result.execution).toEqual({
      branch: "b",
      pr: null,
      attempts: {},
      markers: [],
      strategy_fingerprint: null,
    });
  });

  it("rejects a phase that is not one of the enum", () => {
    expect(() =>
      validateNode({
        id: "n1-badphase",
        kind: "tactic",
        statement: "Bad phase.",
        owner: "ai",
        status: "raw",
        phase: "shipping",
      }),
    ).toThrow();
  });

  it("rejects an execution with a non-object attempts", () => {
    expect(() =>
      validateNode({
        id: "n1-badattempts",
        kind: "tactic",
        statement: "Bad attempts.",
        owner: "ai",
        status: "raw",
        execution: { branch: "b", pr: null, attempts: ["nope"], markers: [], strategy_fingerprint: null },
      }),
    ).toThrow();
  });

  it("rejects an execution with a non-numeric attempt count", () => {
    expect(() =>
      validateNode({
        id: "n1-badcount",
        kind: "tactic",
        statement: "Bad attempt count.",
        owner: "ai",
        status: "raw",
        execution: { branch: "b", pr: null, attempts: { qa: "two" }, markers: [], strategy_fingerprint: null },
      }),
    ).toThrow();
  });

  it("rejects an execution missing branch", () => {
    expect(() =>
      validateNode({
        id: "n1-nobranch",
        kind: "tactic",
        statement: "No branch.",
        owner: "ai",
        status: "raw",
        execution: { pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
      }),
    ).toThrow();
  });

  it("rejects an office_hours missing since", () => {
    expect(() =>
      validateNode({
        id: "n1-noh",
        kind: "tactic",
        statement: "Office hours missing since.",
        owner: "ai",
        status: "raw",
        office_hours: { reason: "parked" },
      }),
    ).toThrow();
  });

  it("rejects a rounds with a non-numeric count", () => {
    expect(() =>
      validateNode({
        id: "n1-badrounds",
        kind: "strategy",
        statement: "Bad rounds count.",
        owner: "ai",
        status: "raw",
        rounds: { count: "3", last_completed: null },
      }),
    ).toThrow();
  });

  it("rejects a non-boolean pace_exempt", () => {
    expect(() =>
      validateNode({
        id: "n1-badpace",
        kind: "tactic",
        statement: "Bad pace_exempt.",
        owner: "ai",
        status: "raw",
        pace_exempt: "yes",
      }),
    ).toThrow();
  });

  it("rejects a validates that is not a string array", () => {
    expect(() =>
      validateNode({
        id: "n1-badval",
        kind: "tactic",
        statement: "Bad validates.",
        owner: "ai",
        status: "raw",
        validates: [1, 2],
      }),
    ).toThrow();
  });

  it("accepts a valid minimal node and applies defaults", () => {
    const result = validateNode({
      id: "n2",
      kind: "tactic",
      statement: "Minimal.",
      owner: "ai",
      status: "raw",
    });
    expect(result).toEqual({
      id: "n2",
      kind: "tactic",
      statement: "Minimal.",
      owner: "ai",
      status: "raw",
      parent: null,
      serves: [],
      recovers: [],
      rationale: null,
      reading: null,
      gap: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
      attention: null,
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
    });
  });

  it("rejects a node missing a required field", () => {
    expect(() =>
      validateNode({ id: "n3", kind: "tactic", owner: "human", status: "raw" }),
    ).toThrow();
  });

  it("rejects a node missing kind", () => {
    expect(() =>
      validateNode({ id: "n3b", statement: "No kind.", owner: "human", status: "raw" }),
    ).toThrow();
  });

  it("rejects an empty-string kind", () => {
    expect(() =>
      validateNode({ id: "n3c", kind: "", statement: "Empty kind.", owner: "human", status: "raw" }),
    ).toThrow();
  });

  it("rejects a bad enum value", () => {
    expect(() =>
      validateNode({
        id: "n4",
        kind: "tactic",
        statement: "Bad owner.",
        owner: "robot",
        status: "raw",
      }),
    ).toThrow();
  });

  it("rejects a tooling_goal with a bad kind", () => {
    expect(() =>
      validateNode({
        id: "n5",
        kind: "tactic",
        statement: "Bad tooling kind.",
        owner: "human",
        status: "raw",
        tooling_goals: [{ kind: "lever", statement: "x" }],
      }),
    ).toThrow();
  });

  it("rejects a tooling_goal that is a bare string", () => {
    expect(() =>
      validateNode({
        id: "n6",
        kind: "tactic",
        statement: "Old format.",
        owner: "human",
        status: "raw",
        tooling_goals: ["bare-string"],
      }),
    ).toThrow();
  });

  it("rejects a tooling_goal with missing statement", () => {
    expect(() =>
      validateNode({
        id: "n7",
        kind: "tactic",
        statement: "Missing statement.",
        owner: "human",
        status: "raw",
        tooling_goals: [{ kind: "actuator" }],
      }),
    ).toThrow();
  });

  it("accepts an attention with only a boost", () => {
    const result = validateNode({
      id: "n8a",
      kind: "strategy",
      statement: "Boosted.",
      owner: "human",
      status: "raw",
      attention: { boost: 3, rationale: "urgent" },
    });
    expect(result.attention).toEqual({ boost: 3, override: null, rationale: "urgent" });
  });

  it("accepts an attention with only an override (including override 0)", () => {
    const result = validateNode({
      id: "n8b",
      kind: "strategy",
      statement: "Zeroed branch.",
      owner: "human",
      status: "raw",
      attention: { override: 0, rationale: "parked" },
    });
    expect(result.attention).toEqual({ boost: null, override: 0, rationale: "parked" });
  });

  it("rejects an attention that sets both boost and override", () => {
    expect(() =>
      validateNode({
        id: "n8c",
        kind: "strategy",
        statement: "Both set.",
        owner: "human",
        status: "raw",
        attention: { boost: 1, override: 2, rationale: "r" },
      }),
    ).toThrow(/exactly one of boost\/override/);
  });

  it("rejects an attention that sets neither boost nor override", () => {
    expect(() =>
      validateNode({
        id: "n8d",
        kind: "strategy",
        statement: "Neither set.",
        owner: "human",
        status: "raw",
        attention: { rationale: "r" },
      }),
    ).toThrow(/exactly one of boost\/override/);
  });

  it("rejects a boost of 0 (points at override: 0 for explicit zeroing)", () => {
    expect(() =>
      validateNode({
        id: "n8e",
        kind: "strategy",
        statement: "Zero boost.",
        owner: "human",
        status: "raw",
        attention: { boost: 0, rationale: "r" },
      }),
    ).toThrow(/boost must be > 0.*override: 0/);
  });

  it("rejects a negative boost", () => {
    expect(() =>
      validateNode({
        id: "n8f",
        kind: "strategy",
        statement: "Negative boost.",
        owner: "human",
        status: "raw",
        attention: { boost: -1, rationale: "r" },
      }),
    ).toThrow();
  });

  it("rejects a negative override", () => {
    expect(() =>
      validateNode({
        id: "n9a",
        kind: "strategy",
        statement: "Negative override.",
        owner: "human",
        status: "raw",
        attention: { override: -1, rationale: "r" },
      }),
    ).toThrow(/override must be >= 0/);
  });

  it("rejects an attention missing a rationale", () => {
    expect(() =>
      validateNode({
        id: "n9b",
        kind: "strategy",
        statement: "No rationale.",
        owner: "human",
        status: "raw",
        attention: { boost: 1 },
      }),
    ).toThrow();
  });

  it("rejects an attention with an empty-string rationale", () => {
    expect(() =>
      validateNode({
        id: "n9c",
        kind: "strategy",
        statement: "Empty rationale.",
        owner: "human",
        status: "raw",
        attention: { boost: 1, rationale: "" },
      }),
    ).toThrow(/rationale must be a non-empty string/);
  });
});

describe("validateGraph", () => {
  /** Build a full IntentionNode fixture for graph-level tests. */
  function gnode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
    return {
      id: partial.id,
      kind: partial.kind,
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

  it("passes on a self-consistent node set (kind-kind satisfies its own kind check)", () => {
    const nodes = [
      // kind-kind is itself of kind "kind", so it satisfies its own kind check.
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: { goal_layer: true },
      }),
      gnode({ id: "kind-delegation", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue", status: "codified", parent: null }),
      gnode({ id: "delegation-1", kind: "delegation" }),
      gnode({
        id: "strategy-1",
        kind: "strategy",
        serves: ["virtue-root"],
        recovers: ["delegation-1"],
        attention: {
          boost: 3,
          override: null,
          rationale: "A live strategy that draws attention.",
        },
      }),
      gnode({
        id: "tactic-1",
        kind: "tactic",
        parent: null,
        serves: ["strategy-1"],
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a node's kind has no kind-<kind> node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "ghost-1", kind: "ghost" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(/ghost-1.*kind "ghost" has no kind-ghost node/);
  });

  it("throws when a parent does not resolve to a node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-1", kind: "tactic", parent: "virtue-missing" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1.*parent "virtue-missing" does not resolve to a node/,
    );
  });

  it("throws when a serves entry does not resolve to a node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-1", kind: "tactic", serves: ["virtue-missing"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1.*serves "virtue-missing" does not resolve to a node/,
    );
  });

  it("throws when a recovers entry does not resolve to a node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "strategy-1", kind: "strategy", recovers: ["delegation-missing"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1.*recovers "delegation-missing" does not resolve to a node/,
    );
  });

  it("throws when attention is on a node whose kind lacks goal_layer", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      // kind-virtue is present but carries no goal_layer flag, so virtues are
      // not a goal-layer kind and may not carry attention.
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({
        id: "virtue-1",
        kind: "virtue",
        attention: { boost: 1, override: null, rationale: "r" },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(/attention is only valid on goal-layer kinds/);
  });

  it("throws when a parent resolves to a node of a different kind", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "tactic-1", kind: "tactic", parent: "virtue-root" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: parent "virtue-root" has kind "virtue", expected same kind "tactic"/,
    );
  });

  it("passes when a parent resolves to a node of the same kind", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-parent", kind: "tactic" }),
      gnode({ id: "tactic-child", kind: "tactic", parent: "tactic-parent" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a tactic's serves entry resolves to a non-strategy node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "tactic-1", kind: "tactic", serves: ["virtue-root"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: serves "virtue-root" must resolve to a kind "strategy" node, got kind "virtue"/,
    );
  });

  it("passes when a tactic's serves entry resolves to a strategy", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "tactic-1", kind: "tactic", serves: ["strategy-1"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a strategy's serves entry resolves to a non-virtue node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-1", kind: "tactic" }),
      gnode({ id: "strategy-1", kind: "strategy", serves: ["tactic-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: serves "tactic-1" must resolve to a kind "virtue" node, got kind "tactic"/,
    );
  });

  it("passes when a strategy's serves entry resolves to a virtue", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "strategy-1", kind: "strategy", serves: ["virtue-root"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a non-strategy node carries a non-empty recovers", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-delegation", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "delegation-1", kind: "delegation" }),
      gnode({ id: "tactic-1", kind: "tactic", recovers: ["delegation-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: recovers is only valid on kind "strategy" nodes, got kind "tactic"/,
    );
  });

  it("throws when a strategy's recovers entry resolves to a non-delegation node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "strategy-1", kind: "strategy", recovers: ["virtue-root"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: recovers "virtue-root" must resolve to a kind "delegation" node, got kind "virtue"/,
    );
  });

  it("passes when a strategy's recovers entry resolves to a delegation", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-delegation", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "delegation-1", kind: "delegation" }),
      gnode({ id: "strategy-1", kind: "strategy", recovers: ["delegation-1"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("lists ALL violations in one throw (kind + parent + serves + recovers + attention)", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      // kind-virtue present without goal_layer, so attention on a virtue is a
      // goal-layer violation.
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "tactic-mismatch", kind: "tactic" }),
      gnode({
        id: "broken-1",
        kind: "ghost",
        parent: "no-such-parent",
        serves: ["no-such-target"],
        recovers: ["no-such-delegation"],
      }),
      gnode({
        id: "broken-2",
        kind: "virtue",
        attention: { boost: 1, override: null, rationale: "r" },
      }),
      // Same-kind-parent violation: a tactic parented to a virtue.
      gnode({ id: "broken-3", kind: "tactic", parent: "virtue-root" }),
      // Tactic-serves-strategy violation: serves a virtue instead.
      gnode({ id: "broken-4", kind: "tactic", serves: ["virtue-root"] }),
      // Strategy-serves-virtue violation: serves a tactic instead.
      gnode({ id: "broken-5", kind: "strategy", serves: ["tactic-mismatch"] }),
      // recovers-on-non-strategy violation.
      gnode({ id: "broken-6", kind: "tactic", recovers: ["broken-2"] }),
      // recovers-target-not-delegation violation.
      gnode({ id: "broken-7", kind: "strategy", recovers: ["virtue-root"] }),
    ];
    let caught: unknown;
    try {
      validateGraph(nodes);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    if (!(caught instanceof Error)) throw new Error("unreachable");
    expect(caught.message).toContain('kind "ghost" has no kind-ghost node');
    expect(caught.message).toContain('parent "no-such-parent" does not resolve to a node');
    expect(caught.message).toContain('serves "no-such-target" does not resolve to a node');
    expect(caught.message).toContain('recovers "no-such-delegation" does not resolve to a node');
    expect(caught.message).toContain("attention is only valid on goal-layer kinds");
    expect(caught.message).toContain(
      'broken-3: parent "virtue-root" has kind "virtue", expected same kind "tactic"',
    );
    expect(caught.message).toContain(
      'broken-4: serves "virtue-root" must resolve to a kind "strategy" node, got kind "virtue"',
    );
    expect(caught.message).toContain(
      'broken-5: serves "tactic-mismatch" must resolve to a kind "virtue" node, got kind "tactic"',
    );
    expect(caught.message).toContain(
      'broken-6: recovers is only valid on kind "strategy" nodes, got kind "tactic"',
    );
    expect(caught.message).toContain(
      'broken-7: recovers "virtue-root" must resolve to a kind "delegation" node, got kind "virtue"',
    );
  });

  // --- Graph-native dispatch layer rules -----------------------------------

  /** Base kind nodes shared by the dispatch-rule fixtures below. */
  function kindNodes(): IntentionNode[] {
    return [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: { goal_layer: true },
      }),
      gnode({
        id: "kind-tactic",
        kind: "kind",
        status: "codified",
        attributes: { goal_layer: true },
      }),
    ];
  }

  it("throws when phase is set on a non-tactic", () => {
    const nodes = [...kindNodes(), gnode({ id: "strategy-1", kind: "strategy", phase: "qa" })];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: phase is only valid on kind "tactic" nodes, got kind "strategy"/,
    );
  });

  it("throws when execution is set on a non-tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({
        id: "strategy-1",
        kind: "strategy",
        execution: { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: execution is only valid on kind "tactic" nodes/,
    );
  });

  it("throws when blocked_by is set on a non-tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic" }),
      gnode({ id: "strategy-1", kind: "strategy", blocked_by: ["tactic-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: blocked_by is only valid on kind "tactic" nodes/,
    );
  });

  it("throws when validates is set on a non-tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "virtue-1", kind: "virtue", validates: ["strategy-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /virtue-1: validates is only valid on kind "tactic" nodes/,
    );
  });

  it("passes when phase/execution/blocked_by/validates sit on tactics", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "tactic-blocker", kind: "tactic" }),
      gnode({
        id: "tactic-1",
        kind: "tactic",
        phase: "implement",
        execution: { branch: "b", pr: 1, attempts: { implement: 1 }, markers: [], strategy_fingerprint: null },
        blocked_by: ["tactic-blocker"],
        validates: ["strategy-1"],
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when office_hours is on a node whose kind lacks goal_layer", () => {
    const nodes = [
      ...kindNodes(),
      gnode({
        id: "virtue-1",
        kind: "virtue",
        office_hours: { reason: "parked", since: "2026-07-03" },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /virtue-1: office_hours is only valid on goal-layer kinds/,
    );
  });

  it("throws when pace_exempt is true on a node whose kind lacks goal_layer", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "virtue-1", kind: "virtue", pace_exempt: true }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /virtue-1: pace_exempt is only valid on goal-layer kinds/,
    );
  });

  it("passes when office_hours/pace_exempt sit on a goal-layer kind (strategy)", () => {
    const nodes = [
      ...kindNodes(),
      gnode({
        id: "strategy-1",
        kind: "strategy",
        office_hours: { reason: "awaiting input", since: "2026-07-03" },
        pace_exempt: true,
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when rounds is set on a non-strategy", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic", rounds: { count: 1, last_completed: null } }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: rounds is only valid on kind "strategy" nodes, got kind "tactic"/,
    );
  });

  it("passes when rounds sits on a strategy", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "strategy-1", kind: "strategy", rounds: { count: 2, last_completed: "2026-07-01" } }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a blocked_by entry does not resolve to a node", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic", blocked_by: ["tactic-missing"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: blocked_by "tactic-missing" does not resolve to a node/,
    );
  });

  it("throws when a blocked_by entry resolves to a non-tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "tactic-1", kind: "tactic", blocked_by: ["strategy-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: blocked_by "strategy-1" must resolve to a kind "tactic" node, got kind "strategy"/,
    );
  });

  it("passes when a blocked_by entry resolves to a tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic" }),
      gnode({ id: "tactic-2", kind: "tactic", blocked_by: ["tactic-1"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a validates entry does not resolve to a node", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic", validates: ["strategy-missing"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: validates "strategy-missing" does not resolve to a node/,
    );
  });

  it("throws when a validates entry resolves to a non-strategy", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "virtue-1", kind: "virtue" }),
      gnode({ id: "tactic-1", kind: "tactic", validates: ["virtue-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: validates "virtue-1" must resolve to a kind "strategy" node, got kind "virtue"/,
    );
  });

  it("passes when a validates entry resolves to a strategy", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "tactic-1", kind: "tactic", validates: ["strategy-1"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws on a blocked_by cycle (including a self-loop)", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-a", kind: "tactic", blocked_by: ["tactic-b"] }),
      gnode({ id: "tactic-b", kind: "tactic", blocked_by: ["tactic-a"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(/blocked_by forms a cycle/);
  });

  it("throws on a direct blocked_by self-loop", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-a", kind: "tactic", blocked_by: ["tactic-a"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-a: blocked_by forms a cycle/,
    );
  });

  it("passes on a blocked_by chain with no cycle", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-a", kind: "tactic", blocked_by: ["tactic-b"] }),
      gnode({ id: "tactic-b", kind: "tactic", blocked_by: ["tactic-c"] }),
      gnode({ id: "tactic-c", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });
});
