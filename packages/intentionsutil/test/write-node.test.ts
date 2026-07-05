import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode } from "../src/store.js";
import { writeNodeFromJson } from "../scripts/write-node.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-"));
}

describe("writeNodeFromJson", () => {
  it("round-trips a valid root-shape JSON payload", () => {
    const dir = tempDir();
    const json = JSON.stringify({
      id: "virtue-test-x",
      kind: "virtue",
      statement: "Maintain trust with users through transparency.",
      owner: "human",
      status: "codified",
      parent: null,
    });

    const written = writeNodeFromJson(dir, json);
    const read = readNode(dir, "virtue-test-x");

    expect(written).toEqual(read);
    expect(read.id).toBe("virtue-test-x");
    expect(read.kind).toBe("virtue");
    expect(read.statement).toBe("Maintain trust with users through transparency.");
    expect(read.owner).toBe("human");
    expect(read.status).toBe("codified");
    expect(read.parent).toBeNull();
    // Optional fields should be defaulted by validateNode.
    expect(read.serves).toEqual([]);
    expect(read.recovers).toEqual([]);
    expect(read.clarifications).toEqual([]);
    expect(read.tooling_goals).toEqual([]);
    expect(read.success_signal).toBeNull();
    expect(read.attributes).toEqual({});
  });

  it("throws on a missing statement and does not write a file", () => {
    const dir = tempDir();
    const json = JSON.stringify({
      id: "virtue-no-statement",
      kind: "virtue",
      owner: "human",
      status: "codified",
      parent: null,
    });

    expect(() => writeNodeFromJson(dir, json)).toThrow();
    // File must NOT exist — the write should have been rejected before disk.
    expect(() => readNode(dir, "virtue-no-statement")).toThrow();
  });

  it("throws on a bad enum value for owner", () => {
    const dir = tempDir();
    const json = JSON.stringify({
      id: "virtue-bad-owner",
      kind: "virtue",
      statement: "This should fail.",
      owner: "robot",
      status: "codified",
      parent: null,
    });

    expect(() => writeNodeFromJson(dir, json)).toThrow();
  });

  it("throws on an unsafe id containing path traversal", () => {
    const dir = tempDir();
    const json = JSON.stringify({
      id: "../evil",
      kind: "virtue",
      statement: "This should fail on path safety.",
      owner: "human",
      status: "codified",
      parent: null,
    });

    expect(() => writeNodeFromJson(dir, json)).toThrow();
  });
});
