import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode } from "../src/store.js";
import { applyNodeTransition } from "../scripts/apply-node-transition.js";

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

const baseArgs = {
  id: "tactic-syn",
  ci: "unknown" as const,
  scopeStale: false,
  strategyStale: false,
  setPr: null as number | null,
  strategyFingerprint: null as string | null,
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
});
