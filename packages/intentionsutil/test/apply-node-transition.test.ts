import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import type { CiVerdict } from "../src/transitions.js";
import { applyNodeTransition, parseArgs } from "../scripts/apply-node-transition.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "transitions-"));
}

/** Write a synthetic tactic file with the given phase and body. */
function seedTactic(dir: string, phase: string, body: string): void {
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
    "execution: null",
    "validates: []",
    "blocked_by: []",
    "office_hours: null",
    "pace_exempt: false",
    "rounds: null",
    "attributes: {}",
    "---",
    body,
  ].join("\n");
  writeFileSync(join(dir, "tactic-syn.md"), frontmatter);
}

const baseArgs: {
  id: string;
  ci: CiVerdict;
  scopeStale: boolean;
  strategyStale: boolean;
  setPr: number | null;
  strategyFingerprint: Record<string, { hash: string; sha: string }> | null;
} = {
  id: "tactic-syn",
  ci: "unknown",
  scopeStale: false,
  strategyStale: false,
  setPr: null,
  strategyFingerprint: null,
};

describe("applyNodeTransition store round-trip", () => {
  it("advances implement→qa, writes the planned marker and the PR number", () => {
    const dir = tempDir();
    seedTactic(dir, "implement", "# body\n");
    const r = applyNodeTransition({ ...baseArgs, dir, setPr: 4242 });
    expect(r.phase).toBe("qa");
    const node = readNode(dir, "tactic-syn");
    expect(node.phase).toBe("qa");
    expect(node.execution?.pr).toBe(4242);
    expect(node.execution?.markers).toEqual(["planned"]);
  });

  it("interrupts review→fix on failing CI without writing a marker", () => {
    const dir = tempDir();
    seedTactic(dir, "review", "# body\n");
    const r = applyNodeTransition({ ...baseArgs, dir, ci: "failing" });
    expect(r.phase).toBe("fix");
    expect(readNode(dir, "tactic-syn").execution?.markers).toEqual([]);
  });

  it("arms merge at clean review completion and stamps the reviewed marker", () => {
    const dir = tempDir();
    seedTactic(dir, "review", "# body\n");
    const r = applyNodeTransition({ ...baseArgs, dir, ci: "passing" });
    expect(r.armMerge).toBe(true);
    expect(r.phase).toBe("review");
    expect(readNode(dir, "tactic-syn").execution?.markers).toEqual(["reviewed"]);
  });

  it("demotes to implement on scope-stale and clears completion markers", () => {
    const dir = tempDir();
    // Seed a review-phase tactic that already carries markers, via two hops.
    seedTactic(dir, "implement", "# body\n");
    applyNodeTransition({ ...baseArgs, dir }); // implement→qa (planned)
    applyNodeTransition({ ...baseArgs, dir, ci: "passing" }); // qa→review (qa-done)
    expect(readNode(dir, "tactic-syn").execution?.markers).toEqual(["planned", "qa-done"]);

    const r = applyNodeTransition({ ...baseArgs, dir, scopeStale: true });
    expect(r.demote).toBe(true);
    expect(r.phase).toBe("implement");
    const node = readNode(dir, "tactic-syn");
    expect(node.phase).toBe("implement");
    expect(node.execution?.markers).toEqual([]);
  });

  it("routes a residue-bearing clean review to arm-merge and reports hasResidue", () => {
    const dir = tempDir();
    seedTactic(dir, "review", "# body\n\n## needs-main\n\nverify in prod\n");
    const r = applyNodeTransition({ ...baseArgs, dir, ci: "passing" });
    expect(r.hasResidue).toBe(true);
    expect(r.armMerge).toBe(true);
  });

  it("merges a keyed strategy_fingerprint into the map, preserving other keys", () => {
    const dir = tempDir();
    seedTactic(dir, "implement", "# body\n");
    // First stamp: strategy-a. Then stamp strategy-b — a must survive.
    applyNodeTransition({
      ...baseArgs,
      dir,
      strategyFingerprint: { "strategy-a": { hash: "hash-a", sha: "sha-1" } },
    });
    expect(readNode(dir, "tactic-syn").execution?.strategy_fingerprint).toEqual({
      "strategy-a": { hash: "hash-a", sha: "sha-1" },
    });
    applyNodeTransition({
      ...baseArgs,
      dir,
      strategyFingerprint: { "strategy-b": { hash: "hash-b", sha: "sha-2" } },
    });
    expect(readNode(dir, "tactic-syn").execution?.strategy_fingerprint).toEqual({
      "strategy-a": { hash: "hash-a", sha: "sha-1" },
      "strategy-b": { hash: "hash-b", sha: "sha-2" },
    });
  });

  it("converts a legacy bare-string stamp to map form on the next keyed re-stamp", () => {
    const dir = tempDir();
    seedTactic(dir, "implement", "# body\n");
    // Seed a legacy bare-string stamp, then re-stamp with a keyed entry: the
    // string carries no strategy id, so it is dropped and the field becomes map.
    const seeded = readNode(dir, "tactic-syn");
    seeded.execution = { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: "legacy" };
    writeNode(dir, seeded);
    applyNodeTransition({
      ...baseArgs,
      dir,
      strategyFingerprint: { "strategy-a": { hash: "hash-a", sha: "sha-1" } },
    });
    expect(readNode(dir, "tactic-syn").execution?.strategy_fingerprint).toEqual({
      "strategy-a": { hash: "hash-a", sha: "sha-1" },
    });
  });

  it("a re-stamp via applyNodeTransition preserves an untouched pre-existing bare-string sibling key unchanged", () => {
    const dir = tempDir();
    seedTactic(dir, "implement", "# body\n");
    const seeded = readNode(dir, "tactic-syn");
    seeded.execution = {
      branch: "b",
      pr: null,
      attempts: {},
      markers: [],
      strategy_fingerprint: { "other-sid": "oldhash" },
    };
    writeNode(dir, seeded);
    applyNodeTransition({
      ...baseArgs,
      dir,
      strategyFingerprint: { "new-sid": { hash: "newhash", sha: "sha-new" } },
    });
    expect(readNode(dir, "tactic-syn").execution?.strategy_fingerprint).toEqual({
      "other-sid": "oldhash",
      "new-sid": { hash: "newhash", sha: "sha-new" },
    });
  });
});

describe("apply-node-transition parseArgs --strategy-fingerprint", () => {
  it("parses a keyed entry into the map and merges repeats, folded with --strategy-sha into {hash, sha}", () => {
    const args = parseArgs([
      "tactic-syn",
      "--strategy-fingerprint",
      "strategy-a=hash-a",
      "--strategy-fingerprint",
      "strategy-b=hash-b",
      "--strategy-sha",
      "sha-123",
    ]);
    expect(args.strategyFingerprint).toEqual({
      "strategy-a": { hash: "hash-a", sha: "sha-123" },
      "strategy-b": { hash: "hash-b", sha: "sha-123" },
    });
  });

  it("rejects the bare-hash form (no strategy id)", () => {
    expect(() =>
      parseArgs(["tactic-syn", "--strategy-fingerprint", "barehash", "--strategy-sha", "sha-123"]),
    ).toThrow(/requires a '<strategy-id>=<hash>' value/);
  });

  it("rejects --strategy-fingerprint without --strategy-sha", () => {
    expect(() => parseArgs(["tactic-syn", "--strategy-fingerprint", "strategy-a=hash-a"])).toThrow(
      /--strategy-fingerprint requires --strategy-sha/,
    );
  });

  it("applyNodeTransition applied from a single --strategy-sha shared across entries writes {hash, sha} for each key", () => {
    const dir = tempDir();
    seedTactic(dir, "implement", "# body\n");
    const args = parseArgs([
      "tactic-syn",
      "--strategy-fingerprint",
      "strategy-a=hash-a",
      "--strategy-sha",
      "sha-shared",
      "--dir",
      dir,
    ]);
    applyNodeTransition(args);
    expect(readNode(dir, "tactic-syn").execution?.strategy_fingerprint).toEqual({
      "strategy-a": { hash: "hash-a", sha: "sha-shared" },
    });
  });
});
