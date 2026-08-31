import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listNodes, readNodeBody, writeNode } from "../src/store.js";
import { tacticScopeFingerprint } from "../src/router.js";
import { listScopeStaleTactics } from "../src/scope-sweep.js";
import type { IntentionNode } from "../src/schema.js";

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
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
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attention: partial.attention ?? null,
    phase: partial.phase ?? null,
    execution: partial.execution ?? null,
    validates: partial.validates ?? [],
    blocked_by: partial.blocked_by ?? [],
    superseded_by: partial.superseded_by ?? [],
    supersession_expiry: partial.supersession_expiry ?? null,
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/** Seed a node and return its current scope fingerprint (for stamping). */
function seed(dir: string, node: IntentionNode): string {
  writeNode(dir, node);
  return tacticScopeFingerprint(node.statement, readNodeBody(dir, node.id));
}

/** Write a phase-start stamp `<fingerprint> <sha>` for `id` into the stamp dir. */
function stamp(stampDir: string, id: string, fingerprint: string, sha = "abc1234"): void {
  writeFileSync(join(stampDir, `${id}.scope-fingerprint`), `${fingerprint} ${sha}\n`);
}

describe("listScopeStaleTactics", () => {
  it("returns a stale qa/review node whose stamp no longer matches", () => {
    const dir = tempDir("scope-sweep-store-");
    const stampDir = tempDir("scope-sweep-stamps-");
    for (const phase of ["qa", "review"] as const) {
      const id = `tactic-${phase}`;
      seed(dir, anode({ id, kind: "tactic", phase }));
      // A deliberately-wrong stamp: the current scope has drifted from it.
      stamp(stampDir, id, "f".repeat(64));
    }
    const result = listScopeStaleTactics(listNodes(dir), dir, stampDir, new Set());
    expect(result.sort()).toEqual(["tactic-qa", "tactic-review"]);
  });

  it("excludes a node whose stamp matches the current scope fingerprint", () => {
    const dir = tempDir("scope-sweep-store-");
    const stampDir = tempDir("scope-sweep-stamps-");
    const fp = seed(dir, anode({ id: "tactic-match", kind: "tactic", phase: "qa" }));
    stamp(stampDir, "tactic-match", fp);
    expect(listScopeStaleTactics(listNodes(dir), dir, stampDir, new Set())).toEqual([]);
  });

  it("excludes a node with no stamp file (bootstrap fail-open, no throw)", () => {
    const dir = tempDir("scope-sweep-store-");
    const stampDir = tempDir("scope-sweep-stamps-");
    seed(dir, anode({ id: "tactic-nostamp", kind: "tactic", phase: "review" }));
    // No stamp written for tactic-nostamp.
    expect(listScopeStaleTactics(listNodes(dir), dir, stampDir, new Set())).toEqual([]);
  });

  it("excludes implement / main-qa / done phases (phase filter)", () => {
    const dir = tempDir("scope-sweep-store-");
    const stampDir = tempDir("scope-sweep-stamps-");
    for (const phase of ["implement", "main-qa", "done"] as const) {
      const id = `tactic-${phase}`;
      seed(dir, anode({ id, kind: "tactic", phase }));
      // Even with a mismatched stamp present, a non-chained phase is not swept.
      stamp(stampDir, id, "f".repeat(64));
    }
    expect(listScopeStaleTactics(listNodes(dir), dir, stampDir, new Set())).toEqual([]);
  });

  it("excludes a stale node whose id is in the live set", () => {
    const dir = tempDir("scope-sweep-store-");
    const stampDir = tempDir("scope-sweep-stamps-");
    seed(dir, anode({ id: "tactic-live", kind: "tactic", phase: "qa" }));
    stamp(stampDir, "tactic-live", "f".repeat(64));
    expect(listScopeStaleTactics(listNodes(dir), dir, stampDir, new Set(["tactic-live"]))).toEqual([]);
  });

  it("excludes a parked node (office_hours set non-null) even when stale", () => {
    const dir = tempDir("scope-sweep-store-");
    const stampDir = tempDir("scope-sweep-stamps-");
    seed(
      dir,
      anode({
        id: "tactic-parked",
        kind: "tactic",
        phase: "qa",
        office_hours: { reason: "author park", since: "2026-07-16", recommendation: null, session_type: "other" },
      }),
    );
    stamp(stampDir, "tactic-parked", "f".repeat(64));
    expect(listScopeStaleTactics(listNodes(dir), dir, stampDir, new Set())).toEqual([]);
  });
});
