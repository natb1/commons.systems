import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import { validateNode } from "../src/schema.js";
import { parseArgs, writeNodeFromJson } from "../scripts/write-node.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-"));
}

/**
 * A minimal valid tactic payload, minted the way `/align-tactics` mints one:
 * `execution: null`, i.e. inside the mint-to-first-transition window.
 */
function tacticJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id: "tactic-mint-x",
    kind: "tactic",
    statement: "A freshly minted tactic.",
    owner: "ai",
    status: "codified",
    parent: null,
    phase: "implement",
    execution: null,
    ...overrides,
  });
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

describe("writeNodeFromJson mint-time strategy stamp", () => {
  it("stamps a tactic minted with execution: null, seeding the execution record", () => {
    const dir = tempDir();
    const written = writeNodeFromJson(dir, tacticJson(), {
      "strategy-a": { hash: "hash-a", sha: "sha-1" },
    });

    // The stamp exists the moment the node lands — this is the whole point:
    // the mint-to-first-transition window no longer leaves the soft-freeze
    // with nothing to compare a later strategy edit against.
    expect(written.execution?.strategy_fingerprint).toEqual({
      "strategy-a": { hash: "hash-a", sha: "sha-1" },
    });
    // The seeded record is otherwise the inert default: branch = node id, no
    // PR, no attempts, no markers.
    expect(written.execution?.branch).toBe("tactic-mint-x");
    expect(written.execution?.pr).toBeNull();
    expect(written.execution?.attempts).toEqual({});
    expect(written.execution?.markers).toEqual([]);
    // And it survives the disk round-trip, not just the in-memory return.
    expect(readNode(dir, "tactic-mint-x").execution?.strategy_fingerprint).toEqual({
      "strategy-a": { hash: "hash-a", sha: "sha-1" },
    });
  });

  it("merges into an existing map at mint, preserving untouched sibling keys", () => {
    const dir = tempDir();
    const json = tacticJson({
      execution: {
        branch: "tactic-mint-x",
        pr: 42,
        attempts: { implement: 1 },
        markers: ["planned"],
        strategy_fingerprint: { "strategy-other": { hash: "hash-other", sha: "sha-other" } },
      },
    });

    const written = writeNodeFromJson(dir, json, {
      "strategy-a": { hash: "hash-a", sha: "sha-1" },
    });

    expect(written.execution?.strategy_fingerprint).toEqual({
      "strategy-other": { hash: "hash-other", sha: "sha-other" },
      "strategy-a": { hash: "hash-a", sha: "sha-1" },
    });
    // The rest of the execution record is carried through untouched.
    expect(written.execution?.pr).toBe(42);
    expect(written.execution?.markers).toEqual(["planned"]);
  });

  it("leaves the written bytes identical to the unstamped write when no stamp is given", () => {
    // The pre-change implementation was exactly `validateNode` → `writeNode`.
    // Reproducing it here and comparing raw bytes proves the added flag is
    // inert when absent — no fabricated `execution`, no reordered frontmatter.
    const json = tacticJson();

    const baselineDir = tempDir();
    writeNode(baselineDir, validateNode(JSON.parse(json)));
    const baseline = readFileSync(join(baselineDir, "tactic-mint-x.md"), "utf8");

    const defaultedDir = tempDir();
    writeNodeFromJson(defaultedDir, json);
    expect(readFileSync(join(defaultedDir, "tactic-mint-x.md"), "utf8")).toBe(baseline);

    const explicitNullDir = tempDir();
    const written = writeNodeFromJson(explicitNullDir, json, null);
    expect(readFileSync(join(explicitNullDir, "tactic-mint-x.md"), "utf8")).toBe(baseline);
    // Unstamped mint keeps `execution: null` — no record is invented.
    expect(written.execution).toBeNull();
  });

  it("rejects a stamp aimed at a non-tactic (execution is tactics-only)", () => {
    const dir = tempDir();
    const json = JSON.stringify({
      id: "strategy-mint-x",
      kind: "strategy",
      statement: "A strategy cannot carry an execution record.",
      owner: "human",
      status: "codified",
      parent: null,
    });

    expect(() =>
      writeNodeFromJson(dir, json, { "strategy-a": { hash: "hash-a", sha: "sha-1" } }),
    ).toThrow(/valid on tactics only/);
    // Rejected before disk.
    expect(() => readNode(dir, "strategy-mint-x")).toThrow();
  });
});

describe("write-node parseArgs", () => {
  it("defaults to stdin with no stamp when no flags are given", () => {
    expect(parseArgs([])).toEqual({ file: null, strategyFingerprint: null });
  });

  it("parses --file and folds repeated keyed fingerprints with the shared --strategy-sha", () => {
    expect(
      parseArgs([
        "--file",
        "/tmp/node.json",
        "--strategy-fingerprint",
        "strategy-a=hash-a",
        "--strategy-fingerprint",
        "strategy-b=hash-b",
        "--strategy-sha",
        "sha-123",
      ]),
    ).toEqual({
      file: "/tmp/node.json",
      strategyFingerprint: {
        "strategy-a": { hash: "hash-a", sha: "sha-123" },
        "strategy-b": { hash: "hash-b", sha: "sha-123" },
      },
    });
  });

  it("rejects the bare-hash form (no strategy id) — the malformed case the shared parser guards", () => {
    expect(() =>
      parseArgs(["--strategy-fingerprint", "barehash", "--strategy-sha", "sha-123"]),
    ).toThrow(/requires a '<strategy-id>=<hash>' value/);
  });

  it("rejects --strategy-fingerprint without --strategy-sha", () => {
    expect(() => parseArgs(["--strategy-fingerprint", "strategy-a=hash-a"])).toThrow(
      /--strategy-fingerprint requires --strategy-sha/,
    );
  });

  it("rejects --file with no path argument", () => {
    expect(() => parseArgs(["--file"])).toThrow(/--file requires a path argument/);
  });

  it("rejects an unknown argument rather than silently ignoring it", () => {
    expect(() => parseArgs(["--strategy-fingerprnit", "strategy-a=hash-a"])).toThrow(
      /unknown argument/,
    );
  });
});
