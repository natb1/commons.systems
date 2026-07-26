import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, readNodeBody, writeNode } from "../src/store.js";
import { tacticScopeFingerprint } from "../src/router.js";
import type { IntentionNode, MarkerEntry } from "../src/schema.js";
import { computeFreshness } from "../scripts/compute-freshness.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "compute-freshness-"));
}

/** Minimal full IntentionNode fixture (mirrors check-node-selection.test.ts's `anode`). */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "ai",
    status: partial.status ?? "codified",
    parent: partial.parent ?? null,
    serves: partial.serves ?? [],
    recovers: partial.recovers ?? [],
    rationale: partial.rationale ?? null,
    reading: partial.reading ?? null,
    gap: partial.gap ?? null,
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attention: partial.attention ?? null,
    phase: partial.phase ?? null,
    execution: partial.execution ?? null,
    validates: partial.validates ?? [],
    blocked_by: partial.blocked_by ?? [],
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/**
 * Seed a review-phase tactic carrying `markers` into a fresh snapshot dir, and
 * return both the dir and the node's real scope fingerprint. Seeded twice: the
 * first write establishes the statement+body the fingerprint is taken over, the
 * caller's `markers` (which do not participate in the fingerprint) go in on the
 * second.
 */
function seedTactic(markers: MarkerEntry[]): { dir: string; fp: string } {
  const dir = tempDir();
  const node = anode({
    id: "tactic-cf",
    kind: "tactic",
    phase: "review",
    execution: { branch: "b", pr: 1, attempts: {}, markers, strategy_fingerprint: null },
  });
  writeNode(dir, node);
  const stored = readNode(dir, "tactic-cf");
  return { dir, fp: tacticScopeFingerprint(stored.statement, readNodeBody(dir, "tactic-cf")) };
}

const STALE_FP = "0".repeat(64);

describe("computeFreshness — staleChainMarkers", () => {
  it("is empty when every bound chain marker matches the current scope", () => {
    const probe = seedTactic([]);
    const { dir } = seedTactic([
      { marker: "planned", fingerprint: probe.fp, sha: "aaa" },
      { marker: "qa-done", fingerprint: probe.fp, sha: "bbb" },
    ]);
    const r = computeFreshness({ id: "tactic-cf", snapshot: dir, stamp: null });
    expect(r.currentFingerprint).toBe(probe.fp);
    expect(r.staleChainMarkers).toEqual([]);
  });

  it("names each chain marker bound to a superseded scope, in ladder order", () => {
    const { dir, fp } = seedTactic([
      { marker: "planned", fingerprint: STALE_FP, sha: "aaa" },
      { marker: "qa-done", fingerprint: STALE_FP, sha: "bbb" },
    ]);
    expect(fp).not.toBe(STALE_FP);
    const r = computeFreshness({ id: "tactic-cf", snapshot: dir, stamp: null });
    expect(r.staleChainMarkers).toEqual(["planned", "qa-done"]);
  });

  it("names only the mismatched marker when the rest of the chain is intact", () => {
    const probe = seedTactic([]);
    const { dir } = seedTactic([
      { marker: "planned", fingerprint: probe.fp, sha: "aaa" },
      { marker: "qa-done", fingerprint: STALE_FP, sha: "bbb" },
    ]);
    const r = computeFreshness({ id: "tactic-cf", snapshot: dir, stamp: null });
    expect(r.staleChainMarkers).toEqual(["qa-done"]);
  });

  it("is empty for a LEGACY unbound (bare-string) chain — grandfathered open", () => {
    const { dir } = seedTactic(["planned", "qa-done"]);
    const r = computeFreshness({ id: "tactic-cf", snapshot: dir, stamp: null });
    expect(r.staleChainMarkers).toEqual([]);
  });

  it("ignores the reviewed marker — the chain check covers implement + qa only", () => {
    const { dir } = seedTactic([{ marker: "reviewed", fingerprint: STALE_FP, sha: "ccc" }]);
    const r = computeFreshness({ id: "tactic-cf", snapshot: dir, stamp: null });
    expect(r.staleChainMarkers).toEqual([]);
  });

  it("is empty when the node is not on the origin/main snapshot at all", () => {
    const dir = tempDir();
    const r = computeFreshness({ id: "tactic-absent", snapshot: dir, stamp: null });
    expect(r.nodeOnMain).toBe(false);
    expect(r.staleChainMarkers).toEqual([]);
  });
});
