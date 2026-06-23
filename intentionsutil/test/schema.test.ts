import { describe, expect, it } from "vitest";
import { validateNode } from "../src/schema.js";

describe("validateNode", () => {
  it("accepts a valid full node", () => {
    const input = {
      id: "n1",
      statement: "A full node.",
      owner: "human",
      status: "codified",
      parent: "p",
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
    };
    expect(validateNode(input)).toEqual(input);
  });

  it("accepts a valid minimal node and applies defaults", () => {
    const result = validateNode({
      id: "n2",
      statement: "Minimal.",
      owner: "ai",
      status: "raw",
    });
    expect(result).toEqual({
      id: "n2",
      statement: "Minimal.",
      owner: "ai",
      status: "raw",
      parent: null,
      rationale: null,
      reading: null,
      gap: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
    });
  });

  it("rejects a node missing a required field", () => {
    expect(() =>
      validateNode({ id: "n3", owner: "human", status: "raw" }),
    ).toThrow();
  });

  it("rejects a bad enum value", () => {
    expect(() =>
      validateNode({
        id: "n4",
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
        statement: "Bad tooling kind.",
        owner: "human",
        status: "raw",
        tooling_goals: [{ kind: "lever", statement: "x" }],
      }),
    ).toThrow();
  });
});
