import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import { applyFixState, parseArgs } from "../scripts/apply-fix-state.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "fix-state-"));
}

/** Write a synthetic tactic file with the given phase and markers. */
function seedTactic(dir: string, phase: string, markers: string[]): void {
  const frontmatter = [
    "---",
    "id: tactic-syn",
    "kind: tactic",
    'statement: "synthetic tactic"',
    "owner: ai",
    "status: codified",
    "parent: null",
    "serves: []",
    "recovers: []",
    "rationale: null",
    "reading: null",
    "gap: null",
    "clarifications: []",
    "tooling_goals: []",
    "success_signal: null",
    "attention: null",
    `phase: ${phase}`,
    "execution:",
    "  branch: tactic-syn",
    "  pr: 4242",
    "  attempts: {}",
    `  markers: [${markers.join(", ")}]`,
    "  strategy_fingerprint: null",
    "  fix: null",
    "validates: []",
    "blocked_by: []",
    "office_hours: null",
    "pace_exempt: false",
    "rounds: null",
    "attributes: {}",
    "---",
    "# body\n",
  ].join("\n");
  writeFileSync(join(dir, "tactic-syn.md"), frontmatter);
}

describe("applyFixState store round-trip", () => {
  it("--set-fix enters the interrupt with attempt 1 and a null pushed_sha, leaving phase untouched", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    const r = applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    expect(r.mode).toBe("set");
    expect(r.attempt).toBe(1);
    expect(r.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const node = readNode(dir, "tactic-syn");
    expect(node.phase).toBe("qa"); // ladder phase preserved
    expect(node.execution?.fix).toEqual({ since: r.since, attempt: 1, pushed_sha: null });
  });

  it("--set-fix on an already-set interrupt bumps attempt and preserves since/pushed_sha", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    // Record a push, then a defensive re-set: since/pushed_sha survive, attempt bumps.
    applyFixState({ id: "tactic-syn", mode: "record", pushedSha: "deadbeef", dir });
    const first = readNode(dir, "tactic-syn").execution?.fix;
    const r = applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    expect(r.attempt).toBe(2);
    const fix = readNode(dir, "tactic-syn").execution?.fix;
    expect(fix?.attempt).toBe(2);
    expect(fix?.since).toBe(first?.since);
    expect(fix?.pushed_sha).toBe("deadbeef");
  });

  it("--clear-fix clears the interrupt and preserves the ladder phase when not past review", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    const r = applyFixState({ id: "tactic-syn", mode: "clear", pushedSha: null, dir });
    expect(r.mode).toBe("clear");
    expect(r.reset).toBe(false);
    expect(r.phase).toBe("qa");
    const node = readNode(dir, "tactic-syn");
    expect(node.execution?.fix).toBeNull();
    expect(node.phase).toBe("qa");
  });

  it("--clear-fix past review applies the re-review reset (phase → review)", () => {
    const dir = tempDir();
    // A node that had finished review carries the reviewed marker; its real phase
    // may have been carried at review while the interrupt was active.
    seedTactic(dir, "review", ["planned", "qa-done", "reviewed"]);
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    const r = applyFixState({ id: "tactic-syn", mode: "clear", pushedSha: null, dir });
    expect(r.reset).toBe(true);
    expect(r.phase).toBe("review");
    const node = readNode(dir, "tactic-syn");
    expect(node.phase).toBe("review");
    expect(node.execution?.fix).toBeNull();
    // The reviewed marker is stripped so review actually re-runs; qa-done/planned
    // survive (only review re-runs, not qa).
    expect(node.execution?.markers).toEqual(["planned", "qa-done"]);
  });

  it("--record-push stamps pushed_sha, preserving since/attempt and phase", () => {
    const dir = tempDir();
    seedTactic(dir, "review", []);
    const set = applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    const r = applyFixState({ id: "tactic-syn", mode: "record", pushedSha: "abc123", dir });
    expect(r.mode).toBe("record");
    expect(r.pushed_sha).toBe("abc123");
    const fix = readNode(dir, "tactic-syn").execution?.fix;
    expect(fix).toEqual({ since: set.since, attempt: 1, pushed_sha: "abc123" });
    expect(readNode(dir, "tactic-syn").phase).toBe("review");
  });

  it("--record-push with no active interrupt is an error", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    expect(() => applyFixState({ id: "tactic-syn", mode: "record", pushedSha: "abc123", dir })).toThrow(
      /execution\.fix is null/,
    );
  });

  it("rejects a non-tactic node", () => {
    const dir = tempDir();
    writeNode(dir, {
      id: "strategy-x",
      kind: "strategy",
      statement: "s",
      owner: "ai",
      status: "codified",
    });
    expect(() => applyFixState({ id: "strategy-x", mode: "set", pushedSha: null, dir })).toThrow(
      /not a tactic/,
    );
  });
});

describe("apply-fix-state parseArgs", () => {
  it("parses --set-fix", () => {
    const a = parseArgs(["tactic-syn", "--set-fix"]);
    expect(a).toMatchObject({ id: "tactic-syn", mode: "set", pushedSha: null });
  });

  it("parses --clear-fix with --dir", () => {
    const a = parseArgs(["tactic-syn", "--clear-fix", "--dir", "/tmp/x"]);
    expect(a).toMatchObject({ id: "tactic-syn", mode: "clear", dir: "/tmp/x" });
  });

  it("parses --record-push <sha>", () => {
    const a = parseArgs(["tactic-syn", "--record-push", "abc123"]);
    expect(a).toMatchObject({ id: "tactic-syn", mode: "record", pushedSha: "abc123" });
  });

  it("rejects combining two modes", () => {
    expect(() => parseArgs(["tactic-syn", "--set-fix", "--clear-fix"])).toThrow(/mutually exclusive/);
  });

  it("rejects --record-push with no sha", () => {
    expect(() => parseArgs(["tactic-syn", "--record-push"])).toThrow(/requires a <sha>/);
  });

  it("requires a mode", () => {
    expect(() => parseArgs(["tactic-syn"])).toThrow(/one of --set-fix/);
  });

  it("requires a node id", () => {
    expect(() => parseArgs(["--set-fix"])).toThrow(/<node-id> is required/);
  });
});
