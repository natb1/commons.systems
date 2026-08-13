import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode } from "../src/store.js";
import { applyLanePass, parseArgs, stampTime } from "../scripts/apply-lane-pass.js";
import type { IntentionNode } from "../src/schema.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "lane-pass-"));
}

/**
 * Write a synthetic tactic file. `executionLines` is spliced in verbatim, so a
 * caller can seed a node with a full `execution` block or with none at all —
 * the latter is the state a node sits in before any lane has touched it.
 */
function seedTactic(dir: string, kind: string, executionLines: string[]): void {
  const frontmatter = [
    "---",
    "id: tactic-syn",
    `kind: ${kind}`,
    'statement: "synthetic tactic"',
    "owner: ai",
    "status: codified",
    "parent: null",
    "serves: []",
    "recovers: []",
    "rationale: null",
    "reading: null",
    "clarifications: []",
    "tooling_goals: []",
    "success_signal: null",
    "attention: null",
    ...executionLines,
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

/** A tactic with a populated `execution` block and no lane-pass stamp yet. */
const WITH_EXECUTION = [
  "phase: review",
  "execution:",
  "  branch: tactic-syn",
  "  pr: 4242",
  "  attempts: {}",
  "  markers: [reviewed]",
  "  strategy_fingerprint: null",
  "  fix: null",
  "  conflict: null",
];

/** A tactic that no lane has stamped anything on yet. */
const NO_EXECUTION = ["phase: null", "execution: null"];

describe("applyLanePass store round-trip", () => {
  it("stamps onto a node with no execution block, synthesizing a default one", () => {
    const dir = tempDir();
    seedTactic(dir, "tactic", NO_EXECUTION);
    const r = applyLanePass(
      { id: "tactic-syn", lane: "conflict", phase: "conflict", dir },
      new Date("2026-08-13T09:41:06.000Z"),
    );
    expect(r).toEqual({
      mode: "stamp",
      id: "tactic-syn",
      at: "2026-08-13T09:41:06Z",
      lane: "conflict",
      phase: "conflict",
      sha: null,
      wrote: true,
    });
    const node = readNode(dir, "tactic-syn");
    expect(node.execution?.branch).toBe("tactic-syn");
    expect(node.execution?.lane_pass).toEqual({
      at: "2026-08-13T09:41:06Z",
      lane: "conflict",
      phase: "conflict",
      sha: null,
    });
  });

  it("leaves the rest of an existing execution block, the phase, and the markers untouched", () => {
    const dir = tempDir();
    seedTactic(dir, "tactic", WITH_EXECUTION);
    applyLanePass(
      { id: "tactic-syn", lane: "qa-fix", phase: "qa", sha: "deadbeef", dir },
      new Date("2026-08-13T09:41:06.000Z"),
    );
    const node = readNode(dir, "tactic-syn");
    // The stamp records that a pass finished; it changes no routing state.
    expect(node.phase).toBe("review");
    expect(node.execution?.markers).toEqual(["reviewed"]);
    expect(node.execution?.pr).toBe(4242);
    expect(node.execution?.conflict).toBeNull();
    expect(node.execution?.lane_pass?.sha).toBe("deadbeef");
  });

  it("overwrites the previous stamp rather than appending to it", () => {
    const dir = tempDir();
    seedTactic(dir, "tactic", WITH_EXECUTION);
    applyLanePass(
      { id: "tactic-syn", lane: "conflict", phase: "conflict", sha: "aaaa111", dir },
      new Date("2026-08-13T09:41:06.000Z"),
    );
    applyLanePass(
      { id: "tactic-syn", lane: "qa-fix", phase: "qa", sha: "bbbb222", dir },
      new Date("2026-08-13T11:02:33.000Z"),
    );
    // One object, not a list: the field is bounded and never needs clearing.
    expect(readNode(dir, "tactic-syn").execution?.lane_pass).toEqual({
      at: "2026-08-13T11:02:33Z",
      lane: "qa-fix",
      phase: "qa",
      sha: "bbbb222",
    });
  });

  it("truncates the injected clock to exact second precision", () => {
    const dir = tempDir();
    seedTactic(dir, "tactic", WITH_EXECUTION);
    const r = applyLanePass(
      { id: "tactic-syn", lane: "conflict", phase: "conflict", dir },
      new Date("2026-08-13T09:41:06.789Z"),
    );
    // Milliseconds would break the ladder's string comparison within a single
    // second: "…:06.789Z" >= "…:06Z" is false ('.' is 0x2E, 'Z' is 0x5A).
    expect(r.at).toBe("2026-08-13T09:41:06Z");
    expect(readNode(dir, "tactic-syn").execution?.lane_pass?.at).toBe("2026-08-13T09:41:06Z");
  });

  it("refuses a node that is not a tactic", () => {
    const dir = tempDir();
    seedTactic(dir, "strategy", NO_EXECUTION);
    expect(() =>
      applyLanePass({ id: "tactic-syn", lane: "conflict", phase: "conflict", dir }),
    ).toThrow(/not a tactic/);
  });

  it("refuses a lane outside the closed set", () => {
    const dir = tempDir();
    seedTactic(dir, "tactic", WITH_EXECUTION);
    expect(() =>
      applyLanePass({ id: "tactic-syn", lane: "review-fix", phase: "review", dir }),
    ).toThrow(/unknown --lane/);
  });

  it("refuses a phase outside the dispatch vocabulary", () => {
    const dir = tempDir();
    seedTactic(dir, "tactic", WITH_EXECUTION);
    expect(() =>
      applyLanePass({ id: "tactic-syn", lane: "conflict", phase: "shipping", dir }),
    ).toThrow(/unknown --phase/);
  });
});

describe("apply-lane-pass parseArgs", () => {
  it("parses the full stamp invocation", () => {
    expect(
      parseArgs([
        "tactic-syn",
        "--stamp",
        "--lane",
        "conflict",
        "--phase",
        "conflict",
        "--sha",
        "deadbeef",
        "--dir",
        "/tmp/x",
      ]),
    ).toEqual({
      id: "tactic-syn",
      lane: "conflict",
      phase: "conflict",
      sha: "deadbeef",
      dir: "/tmp/x",
    });
  });

  it("treats a missing --lane as a usage error", () => {
    expect(() => parseArgs(["tactic-syn", "--stamp", "--phase", "conflict"])).toThrow(
      /--lane is required/,
    );
  });

  it("treats a missing --phase as a usage error", () => {
    expect(() => parseArgs(["tactic-syn", "--stamp", "--lane", "conflict"])).toThrow(
      /--phase is required/,
    );
  });

  it("rejects an unknown --lane at the CLI edge, naming the accepted set", () => {
    expect(() =>
      parseArgs(["tactic-syn", "--stamp", "--lane", "nope", "--phase", "conflict"]),
    ).toThrow(/unknown --lane 'nope'.*conflict \| qa-fix \| fix-checks/);
  });

  it("rejects an unknown --phase at the CLI edge", () => {
    expect(() =>
      parseArgs(["tactic-syn", "--stamp", "--lane", "conflict", "--phase", "nope"]),
    ).toThrow(/unknown --phase 'nope'/);
  });

  it("requires --stamp", () => {
    expect(() =>
      parseArgs(["tactic-syn", "--lane", "conflict", "--phase", "conflict"]),
    ).toThrow(/--stamp is required/);
  });

  it("has no --at flag: backdating a completion stamp has no caller", () => {
    expect(() =>
      parseArgs([
        "tactic-syn",
        "--stamp",
        "--lane",
        "conflict",
        "--phase",
        "conflict",
        "--at",
        "2026-08-13T09:41:06Z",
      ]),
    ).toThrow(/unknown flag '--at'/);
  });
});

/**
 * The one test that spans writer and reader. The writer's format and the
 * ladder's comparison are agreed on nowhere else: the ladder (Unit 3) reads the
 * stamp with a jq predicate that is a plain string `>=`, which is only
 * chronological because both sides are fixed-width UTC second-precision
 * timestamps ending in a literal `Z`. A drift on either side — milliseconds
 * left in, a dropped `Z`, a local-time offset — silently makes every pass read
 * as a stall, and nothing else in either suite catches it.
 */
describe("lane_pass stamp vs. the ladder's launch-window predicate", () => {
  /**
   * The `since` bound as the ladder computes it: `date -u -d "@$epoch"
   * +%FT%TZ` over an integer epoch second.
   */
  function sinceIso(epochSeconds: number): string {
    return new Date(epochSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  }

  /**
   * The reader's predicate, in TS. The jq form, verbatim:
   *   ((.execution.lane_pass.phase // "") == "<FROM_PHASE>")
   *     and ((.execution.lane_pass.at // "") >= "<SINCE_ISO>")
   */
  function ladderSeesPass(node: IntentionNode, fromPhase: string, since: string): boolean {
    const lanePass = node.execution?.lane_pass;
    return (lanePass?.phase ?? "") === fromPhase && (lanePass?.at ?? "") >= since;
  }

  // Instants chosen for the boundaries a naive format breaks at: a plain
  // second, a sub-second tail, and second/minute/hour/day/month/year rollovers.
  const INSTANTS = [
    "2026-08-13T09:41:06.000Z",
    "2026-08-13T09:41:06.789Z",
    "2026-08-13T09:41:59.999Z",
    "2026-08-13T09:59:59.500Z",
    "2026-08-13T23:59:59.000Z",
    "2026-08-31T23:59:59.000Z",
    "2026-12-31T23:59:59.000Z",
    "2027-01-01T00:00:00.000Z",
  ];

  // Offsets in seconds from the stamp's own second, both sides of the boundary.
  const OFFSETS = [-86400, -3600, -60, -2, -1, 0, 1, 2, 60, 3600, 86400];

  it("evaluates true for every launch at or before the stamp, false for every launch after", () => {
    const dir = tempDir();
    for (const instant of INSTANTS) {
      seedTactic(dir, "tactic", WITH_EXECUTION);
      const now = new Date(instant);
      applyLanePass(
        { id: "tactic-syn", lane: "conflict", phase: "conflict", dir },
        now,
      );
      const node = readNode(dir, "tactic-syn");
      // The stamp's own second — `since` is always an integer epoch second, so
      // this is the exact boundary the comparison must fall on.
      const stampSecond = Math.floor(now.getTime() / 1000);
      expect(node.execution?.lane_pass?.at).toBe(stampTime(now));
      for (const offset of OFFSETS) {
        const launch = stampSecond + offset;
        expect(ladderSeesPass(node, "conflict", sinceIso(launch))).toBe(offset <= 0);
      }
    }
  });

  it("does not match a launch whose from-phase differs from the stamped one", () => {
    const dir = tempDir();
    seedTactic(dir, "tactic", WITH_EXECUTION);
    const now = new Date("2026-08-13T09:41:06.000Z");
    applyLanePass({ id: "tactic-syn", lane: "qa-fix", phase: "qa", dir }, now);
    const node = readNode(dir, "tactic-syn");
    const since = sinceIso(Math.floor(now.getTime() / 1000) - 60);
    expect(ladderSeesPass(node, "qa", since)).toBe(true);
    expect(ladderSeesPass(node, "conflict", since)).toBe(false);
  });

  it("reads an unstamped node as a stall — the pre-fix behavior, for every launch", () => {
    const dir = tempDir();
    seedTactic(dir, "tactic", WITH_EXECUTION);
    const node = readNode(dir, "tactic-syn");
    expect(node.execution?.lane_pass).toBeNull();
    expect(ladderSeesPass(node, "conflict", "2020-01-01T00:00:00Z")).toBe(false);
  });
});
