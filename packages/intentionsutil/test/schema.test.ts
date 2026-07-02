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
      attributes: { source: "github:natb1/commons.systems#1" },
    };
    expect(validateNode(input)).toEqual(input);
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
      attributes: partial.attributes ?? {},
    };
  }

  it("passes on a self-consistent node set (kind-kind satisfies its own kind check)", () => {
    const nodes = [
      // kind-kind is itself of kind "kind", so it satisfies its own kind check.
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "kind-delegation", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue", status: "codified", parent: null }),
      gnode({ id: "delegation-1", kind: "delegation" }),
      gnode({
        id: "strategy-1",
        kind: "strategy",
        serves: ["virtue-root"],
        recovers: ["delegation-1"],
      }),
      gnode({
        id: "tactic-1",
        kind: "tactic",
        parent: "virtue-root",
        serves: ["virtue-root"],
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

  it("lists ALL violations in one throw (kind + parent + serves + recovers)", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({
        id: "broken-1",
        kind: "ghost",
        parent: "no-such-parent",
        serves: ["no-such-target"],
        recovers: ["no-such-delegation"],
      }),
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
  });
});
