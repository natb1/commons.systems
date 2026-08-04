import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import { applyConflictState, parseArgs } from "../scripts/apply-conflict-state.js";
import { CONFLICT_ATTEMPT_CAP } from "../src/transitions.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "conflict-state-"));
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
    "  conflict: null",
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

/** Drive `--spend-attempt` n times, returning the final attempt count. */
function spendTimes(dir: string, n: number): number {
  let attempt = 0;
  for (let i = 0; i < n; i++) {
    attempt = applyConflictState({ id: "tactic-syn", mode: "spend", dir }).attempt ?? 0;
  }
  return attempt;
}

describe("applyConflictState store round-trip", () => {
  it("--set-conflict enters the interrupt with attempt 1, leaving phase and markers untouched", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    const r = applyConflictState({ id: "tactic-syn", mode: "set", dir });
    expect(r.mode).toBe("set");
    expect(r.wrote).toBe(true);
    expect(r.attempt).toBe(1);
    expect(r.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const node = readNode(dir, "tactic-syn");
    expect(node.phase).toBe("review"); // ladder phase preserved — the interrupt is orthogonal
    expect(node.execution?.markers).toEqual(["reviewed"]);
    expect(node.execution?.conflict).toEqual({ since: r.since, attempt: 1 });
  });

  it("--set-conflict on an already-set interrupt bumps attempt and preserves since", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    const first = applyConflictState({ id: "tactic-syn", mode: "set", dir });
    const r = applyConflictState({ id: "tactic-syn", mode: "set", dir });
    expect(r.attempt).toBe(2);
    const conflict = readNode(dir, "tactic-syn").execution?.conflict;
    expect(conflict?.attempt).toBe(2);
    expect(conflict?.since).toBe(first.since);
  });

  it("--spend-attempt increments attempt by 1 and preserves since", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    const set = applyConflictState({ id: "tactic-syn", mode: "set", dir });
    const r = applyConflictState({ id: "tactic-syn", mode: "spend", dir });
    expect(r.mode).toBe("spend");
    expect(r.attempt).toBe(2);
    const conflict = readNode(dir, "tactic-syn").execution?.conflict;
    expect(conflict?.attempt).toBe(2);
    expect(conflict?.since).toBe(set.since);
    expect(readNode(dir, "tactic-syn").phase).toBe("review");
  });

  it("--spend-attempt with no active interrupt is an error", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    expect(() => applyConflictState({ id: "tactic-syn", mode: "spend", dir })).toThrow(
      /execution\.conflict is null/,
    );
  });

  it("--park-if-capped below the cap reports capped: false and makes no write", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    applyConflictState({ id: "tactic-syn", mode: "set", dir }); // attempt 1
    const before = readNode(dir, "tactic-syn");
    const path = join(dir, "tactic-syn.md");
    const mtimeBefore = statSync(path).mtimeMs;
    const r = applyConflictState({ id: "tactic-syn", mode: "park-if-capped", dir });
    expect(r.mode).toBe("park-if-capped");
    expect(r.wrote).toBe(false);
    expect(r.capped).toBe(false);
    expect(r.attempt).toBe(1);
    const after = readNode(dir, "tactic-syn");
    expect(after).toEqual(before);
    expect(after.office_hours).toBeNull(); // this script never parks
    // Pure read: the node file must not be rewritten at all.
    expect(statSync(path).mtimeMs).toBe(mtimeBefore);
  });

  it("--park-if-capped at the cap reports capped: true (>= semantics)", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    applyConflictState({ id: "tactic-syn", mode: "set", dir }); // attempt 1
    const attempt = spendTimes(dir, CONFLICT_ATTEMPT_CAP - 1); // attempt == CONFLICT_ATTEMPT_CAP
    expect(attempt).toBe(CONFLICT_ATTEMPT_CAP);
    const path = join(dir, "tactic-syn.md");
    const mtimeBefore = statSync(path).mtimeMs;
    const r = applyConflictState({ id: "tactic-syn", mode: "park-if-capped", dir });
    expect(r.capped).toBe(true);
    expect(r.attempt).toBe(CONFLICT_ATTEMPT_CAP);
    expect(statSync(path).mtimeMs).toBe(mtimeBefore);
    const node = readNode(dir, "tactic-syn");
    expect(node.office_hours).toBeNull();
    expect(node.execution?.conflict?.attempt).toBe(CONFLICT_ATTEMPT_CAP); // untouched
  });

  it("--park-if-capped over the cap reports capped: true", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    applyConflictState({ id: "tactic-syn", mode: "set", dir }); // attempt 1
    spendTimes(dir, CONFLICT_ATTEMPT_CAP); // attempt == CONFLICT_ATTEMPT_CAP + 1
    const r = applyConflictState({ id: "tactic-syn", mode: "park-if-capped", dir });
    expect(r.capped).toBe(true);
    expect(r.attempt).toBe(CONFLICT_ATTEMPT_CAP + 1);
  });

  it("--park-if-capped with no active interrupt is an error", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    expect(() => applyConflictState({ id: "tactic-syn", mode: "park-if-capped", dir })).toThrow(
      /execution\.conflict is null/,
    );
  });

  it("--clear-conflict-mechanical clears the interrupt, preserving phase and the reviewed marker", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["planned", "qa-done", "reviewed"]);
    applyConflictState({ id: "tactic-syn", mode: "set", dir });
    const r = applyConflictState({ id: "tactic-syn", mode: "clear-mechanical", dir });
    expect(r.mode).toBe("clear");
    expect(r.wrote).toBe(true);
    expect(r.reset).toBe(false);
    expect(r.phase).toBe("review");
    const node = readNode(dir, "tactic-syn");
    expect(node.execution?.conflict).toBeNull();
    expect(node.phase).toBe("review");
    // The node returns to awaiting-merge: reviewed survives so auto-merge lands it.
    expect(node.execution?.markers).toEqual(["planned", "qa-done", "reviewed"]);
  });

  it("--clear-conflict-mechanical preserves a non-review ladder phase verbatim", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", ["planned"]);
    applyConflictState({ id: "tactic-syn", mode: "set", dir });
    const r = applyConflictState({ id: "tactic-syn", mode: "clear-mechanical", dir });
    expect(r.phase).toBe("qa");
    expect(readNode(dir, "tactic-syn").phase).toBe("qa");
  });

  it("--clear-conflict-mechanical with no active interrupt is an error", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    expect(() => applyConflictState({ id: "tactic-syn", mode: "clear-mechanical", dir })).toThrow(
      /execution\.conflict is null/,
    );
  });

  it("--clear-conflict-intention clears the interrupt and strips the reviewed marker, keeping phase at review", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["planned", "qa-done", "reviewed"]);
    applyConflictState({ id: "tactic-syn", mode: "set", dir });
    const r = applyConflictState({ id: "tactic-syn", mode: "clear-intention", dir });
    expect(r.mode).toBe("clear");
    expect(r.wrote).toBe(true);
    expect(r.reset).toBe(true);
    expect(r.phase).toBe("review");
    const node = readNode(dir, "tactic-syn");
    expect(node.execution?.conflict).toBeNull();
    expect(node.phase).toBe("review");
    // Only review re-runs: qa-done/planned survive, reviewed is stripped.
    expect(node.execution?.markers).toEqual(["planned", "qa-done"]);
  });

  it("--clear-conflict-intention with no active interrupt is an error", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    expect(() => applyConflictState({ id: "tactic-syn", mode: "clear-intention", dir })).toThrow(
      /execution\.conflict is null/,
    );
  });

  it("leaves execution.fix untouched — the two interrupts are independent", () => {
    const dir = tempDir();
    seedTactic(dir, "review", ["reviewed"]);
    applyConflictState({ id: "tactic-syn", mode: "set", dir });
    applyConflictState({ id: "tactic-syn", mode: "clear-mechanical", dir });
    expect(readNode(dir, "tactic-syn").execution?.fix).toBeNull();
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
    expect(() => applyConflictState({ id: "strategy-x", mode: "set", dir })).toThrow(/not a tactic/);
  });
});

describe("apply-conflict-state parseArgs", () => {
  it("parses --set-conflict", () => {
    expect(parseArgs(["tactic-syn", "--set-conflict"])).toMatchObject({
      id: "tactic-syn",
      mode: "set",
    });
  });

  it("parses --spend-attempt with --dir", () => {
    expect(parseArgs(["tactic-syn", "--spend-attempt", "--dir", "/tmp/x"])).toMatchObject({
      id: "tactic-syn",
      mode: "spend",
      dir: "/tmp/x",
    });
  });

  it("parses --park-if-capped", () => {
    expect(parseArgs(["tactic-syn", "--park-if-capped"])).toMatchObject({
      id: "tactic-syn",
      mode: "park-if-capped",
    });
  });

  it("parses --clear-conflict-mechanical", () => {
    expect(parseArgs(["tactic-syn", "--clear-conflict-mechanical"])).toMatchObject({
      id: "tactic-syn",
      mode: "clear-mechanical",
    });
  });

  it("parses --clear-conflict-intention", () => {
    expect(parseArgs(["tactic-syn", "--clear-conflict-intention"])).toMatchObject({
      id: "tactic-syn",
      mode: "clear-intention",
    });
  });

  it("rejects combining two modes", () => {
    expect(() =>
      parseArgs(["tactic-syn", "--set-conflict", "--clear-conflict-mechanical"]),
    ).toThrow(/mutually exclusive/);
  });

  it("rejects combining the two clear modes", () => {
    expect(() =>
      parseArgs(["tactic-syn", "--clear-conflict-mechanical", "--clear-conflict-intention"]),
    ).toThrow(/mutually exclusive/);
  });

  it("rejects an unknown flag", () => {
    expect(() => parseArgs(["tactic-syn", "--nope"])).toThrow(/unknown flag/);
  });

  it("requires a mode", () => {
    expect(() => parseArgs(["tactic-syn"])).toThrow(/one of --set-conflict/);
  });

  it("requires a node id", () => {
    expect(() => parseArgs(["--set-conflict"])).toThrow(/<node-id> is required/);
  });
});
