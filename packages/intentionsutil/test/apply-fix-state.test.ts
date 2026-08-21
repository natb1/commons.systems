import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import { FIX_CYCLE_ATTEMPT_KEY, FIX_CYCLE_CAP } from "../src/transitions.js";
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

  it("--spend-attempt increments attempt by 1 and preserves since/pushed_sha", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    const set = applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    applyFixState({ id: "tactic-syn", mode: "record", pushedSha: "cafef00d", dir });
    const r = applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir });
    expect(r.mode).toBe("spend");
    expect(r.attempt).toBe(2);
    const fix = readNode(dir, "tactic-syn").execution?.fix;
    expect(fix?.attempt).toBe(2);
    expect(fix?.since).toBe(set.since);
    expect(fix?.pushed_sha).toBe("cafef00d");
  });

  it("--spend-attempt with no active interrupt is an error", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    expect(() => applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir })).toThrow(
      /execution\.fix is null/,
    );
  });

  it("--check-cap at or below the cap makes no write and reports capped: false", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir }); // attempt 1
    applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // attempt 2
    applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // attempt 3 (== FIX_ATTEMPT_CAP)
    const before = readNode(dir, "tactic-syn");
    const path = join(dir, "tactic-syn.md");
    const mtimeBefore = statSync(path).mtimeMs;
    const r = applyFixState({ id: "tactic-syn", mode: "check-cap", pushedSha: null, dir });
    expect(r.mode).toBe("check-cap");
    expect(r.capped).toBe(false);
    expect(r.consumed).toBe(2);
    expect(r.attempt).toBe(3);
    const after = readNode(dir, "tactic-syn");
    expect(after).toEqual(before);
    expect(after.execution?.fix?.attempt).toBe(3);
    expect(after.office_hours).toBeNull();
    // Pure read: the node file must not be rewritten at all.
    expect(statSync(path).mtimeMs).toBe(mtimeBefore);
  });

  it("--check-cap above the cap reports capped: true with the consumed count, and makes no write", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir }); // attempt 1
    applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // attempt 2
    applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // attempt 3
    applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // attempt 4 (over the cap of 3)
    const path = join(dir, "tactic-syn.md");
    const mtimeBefore = statSync(path).mtimeMs;
    const r = applyFixState({ id: "tactic-syn", mode: "check-cap", pushedSha: null, dir });
    expect(r.mode).toBe("check-cap");
    expect(r.capped).toBe(true);
    expect(r.consumed).toBe(3); // consumed attempts before the cap check
    expect(r.attempt).toBe(4);
    const node = readNode(dir, "tactic-syn");
    expect(node.office_hours).toBeNull();
    expect(node.execution?.fix?.attempt).toBe(4); // untouched by a pure check
    expect(node.phase).toBe("qa");
    // Pure read: the node file must not be rewritten at all.
    expect(statSync(path).mtimeMs).toBe(mtimeBefore);
  });

  it("--check-cap with no active interrupt is an error", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    expect(() =>
      applyFixState({ id: "tactic-syn", mode: "check-cap", pushedSha: null, dir }),
    ).toThrow(/execution\.fix is null/);
  });

  it("--reset-attempt sets attempt to 1, preserving since/pushed_sha and phase", () => {
    const dir = tempDir();
    seedTactic(dir, "review", []);
    const set = applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    applyFixState({ id: "tactic-syn", mode: "record", pushedSha: "cafef00d", dir });
    applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // 2
    applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // 3
    const r = applyFixState({ id: "tactic-syn", mode: "reset-attempt", pushedSha: null, dir });
    expect(r.mode).toBe("reset-attempt");
    expect(r.wrote).toBe(true);
    expect(r.attempt).toBe(1);
    const node = readNode(dir, "tactic-syn");
    expect(node.execution?.fix?.attempt).toBe(1);
    expect(node.execution?.fix?.since).toBe(set.since);
    expect(node.execution?.fix?.pushed_sha).toBe("cafef00d");
    expect(node.phase).toBe("review");
    expect(node.office_hours).toBeNull();
  });

  it("--reset-attempt with no active interrupt is an error", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    expect(() =>
      applyFixState({ id: "tactic-syn", mode: "reset-attempt", pushedSha: null, dir }),
    ).toThrow(/execution\.fix is null/);
  });

  it("end-to-end: set-fix, three spends, then check-cap reports capped with no write, then reset-attempt resets, office_hours stays null throughout", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    const set = applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    expect(set.attempt).toBe(1);
    applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // 2
    applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // 3
    const third = applyFixState({ id: "tactic-syn", mode: "spend", pushedSha: null, dir }); // 4
    expect(third.attempt).toBe(4);
    const path = join(dir, "tactic-syn.md");
    const mtimeBefore = statSync(path).mtimeMs;
    const check = applyFixState({ id: "tactic-syn", mode: "check-cap", pushedSha: null, dir });
    expect(check.capped).toBe(true);
    expect(check.consumed).toBe(3);
    expect(statSync(path).mtimeMs).toBe(mtimeBefore); // no write from a pure check
    const checked = readNode(dir, "tactic-syn");
    expect(checked.office_hours).toBeNull();
    expect(checked.execution?.fix?.attempt).toBe(4); // untouched
    const reset = applyFixState({ id: "tactic-syn", mode: "reset-attempt", pushedSha: null, dir });
    expect(reset.attempt).toBe(1);
    const final = readNode(dir, "tactic-syn");
    expect(final.execution?.fix?.attempt).toBe(1);
    expect(final.office_hours).toBeNull(); // this file never writes office_hours
  });
});

describe("cross-cycle cap (--check-cycle-cap / --reset-cycle)", () => {
  it("--set-fix on a fresh entry bumps the lifetime cycle counter; --clear-fix does not reset it", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    expect(readNode(dir, "tactic-syn").execution?.attempts[FIX_CYCLE_ATTEMPT_KEY]).toBe(1);
    applyFixState({ id: "tactic-syn", mode: "clear", pushedSha: null, dir });
    expect(readNode(dir, "tactic-syn").execution?.attempts[FIX_CYCLE_ATTEMPT_KEY]).toBe(1);
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    expect(readNode(dir, "tactic-syn").execution?.attempts[FIX_CYCLE_ATTEMPT_KEY]).toBe(2);
  });

  it("a defensive double --set-fix (no intervening --clear-fix) does not bump the cycle counter", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir }); // defensive re-set, same episode
    expect(readNode(dir, "tactic-syn").execution?.attempts[FIX_CYCLE_ATTEMPT_KEY]).toBe(1);
  });

  it("--check-cycle-cap with no interrupt in flight reports the lifetime count and makes no write", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
    applyFixState({ id: "tactic-syn", mode: "clear", pushedSha: null, dir });
    const path = join(dir, "tactic-syn.md");
    const mtimeBefore = statSync(path).mtimeMs;
    const r = applyFixState({ id: "tactic-syn", mode: "check-cycle-cap", pushedSha: null, dir });
    expect(r.mode).toBe("check-cycle-cap");
    expect(r.wrote).toBe(false);
    expect(r.cycles).toBe(1);
    expect(r.cycleCapped).toBe(false);
    expect(statSync(path).mtimeMs).toBe(mtimeBefore);
    expect(readNode(dir, "tactic-syn").execution?.fix).toBeNull();
  });

  it("a node that enters and clears the fix-interrupt FIX_CYCLE_CAP times in a row is routed to a hold (cycleCapped: true) on the next re-entry check, instead of getting a fresh attempt:1 budget", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    for (let i = 0; i < FIX_CYCLE_CAP; i++) {
      const before = applyFixState({ id: "tactic-syn", mode: "check-cycle-cap", pushedSha: null, dir });
      expect(before.cycleCapped).toBe(false);
      const set = applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
      expect(set.attempt).toBe(1); // fresh attempt:1 budget every cycle, as designed
      applyFixState({ id: "tactic-syn", mode: "clear", pushedSha: null, dir });
    }
    const capped = applyFixState({ id: "tactic-syn", mode: "check-cycle-cap", pushedSha: null, dir });
    expect(capped.cycles).toBe(FIX_CYCLE_CAP);
    expect(capped.cycleCapped).toBe(true);
  });

  it("--reset-cycle resets the lifetime counter to 0 with no active interrupt required, and makes a write", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    for (let i = 0; i < FIX_CYCLE_CAP; i++) {
      applyFixState({ id: "tactic-syn", mode: "set", pushedSha: null, dir });
      applyFixState({ id: "tactic-syn", mode: "clear", pushedSha: null, dir });
    }
    expect(applyFixState({ id: "tactic-syn", mode: "check-cycle-cap", pushedSha: null, dir }).cycleCapped).toBe(
      true,
    );
    const r = applyFixState({ id: "tactic-syn", mode: "reset-cycle", pushedSha: null, dir });
    expect(r.mode).toBe("reset-cycle");
    expect(r.wrote).toBe(true);
    expect(r.cycles).toBe(0);
    expect(readNode(dir, "tactic-syn").execution?.attempts[FIX_CYCLE_ATTEMPT_KEY]).toBe(0);
    expect(applyFixState({ id: "tactic-syn", mode: "check-cycle-cap", pushedSha: null, dir }).cycleCapped).toBe(
      false,
    );
  });

  it("--check-cycle-cap on a node with no fix-cycle history yet reports cycles: 0, capped: false", () => {
    const dir = tempDir();
    seedTactic(dir, "qa", []);
    const r = applyFixState({ id: "tactic-syn", mode: "check-cycle-cap", pushedSha: null, dir });
    expect(r.cycles).toBe(0);
    expect(r.cycleCapped).toBe(false);
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

  it("parses --spend-attempt", () => {
    const a = parseArgs(["tactic-syn", "--spend-attempt"]);
    expect(a).toMatchObject({ id: "tactic-syn", mode: "spend", pushedSha: null });
  });

  it("parses --check-cap", () => {
    const a = parseArgs(["tactic-syn", "--check-cap"]);
    expect(a).toMatchObject({ id: "tactic-syn", mode: "check-cap", pushedSha: null });
  });

  it("parses --reset-attempt", () => {
    const a = parseArgs(["tactic-syn", "--reset-attempt"]);
    expect(a).toMatchObject({ id: "tactic-syn", mode: "reset-attempt", pushedSha: null });
  });

  it("parses --check-cycle-cap", () => {
    const a = parseArgs(["tactic-syn", "--check-cycle-cap"]);
    expect(a).toMatchObject({ id: "tactic-syn", mode: "check-cycle-cap", pushedSha: null });
  });

  it("parses --reset-cycle", () => {
    const a = parseArgs(["tactic-syn", "--reset-cycle"]);
    expect(a).toMatchObject({ id: "tactic-syn", mode: "reset-cycle", pushedSha: null });
  });

  it("rejects combining two modes", () => {
    expect(() => parseArgs(["tactic-syn", "--set-fix", "--clear-fix"])).toThrow(/mutually exclusive/);
  });

  it("rejects combining --spend-attempt with --clear-fix", () => {
    expect(() => parseArgs(["tactic-syn", "--spend-attempt", "--clear-fix"])).toThrow(
      /mutually exclusive/,
    );
  });

  it("rejects combining --check-cap with --set-fix", () => {
    expect(() => parseArgs(["tactic-syn", "--check-cap", "--set-fix"])).toThrow(
      /mutually exclusive/,
    );
  });

  it("rejects combining --reset-attempt with --check-cap", () => {
    expect(() => parseArgs(["tactic-syn", "--reset-attempt", "--check-cap"])).toThrow(
      /mutually exclusive/,
    );
  });

  it("rejects combining --check-cycle-cap with --reset-cycle", () => {
    expect(() => parseArgs(["tactic-syn", "--check-cycle-cap", "--reset-cycle"])).toThrow(
      /mutually exclusive/,
    );
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
