import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";
import { reconcileGraph } from "../scripts/reconcile-graph.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "reconcile-"));
}

function node(dir: string, partial: Partial<IntentionNode> & { id: string; kind: string }, body?: string): void {
  const full: IntentionNode = {
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
  writeNode(dir, full);
  if (body !== undefined && partial.kind === "tactic") {
    // Overwrite with an explicit body (writeNode preserves an existing tactic
    // body but generates a placeholder for a brand-new file).
    const raw = readFileSync(join(dir, `${partial.id}.md`), "utf8");
    const frontmatter = raw.slice(0, raw.indexOf("\n---\n") + "\n---\n".length);
    writeFileSync(join(dir, `${partial.id}.md`), `${frontmatter}${body}`);
  }
}

function prStates(dir: string, states: Record<string, string>): string {
  const f = join(dir, "_states.json");
  writeFileSync(f, JSON.stringify(states));
  return f;
}

describe("reconcileGraph", () => {
  it("prunes a merged no-residue tactic, repairs inbound blocked_by, stamps the round", () => {
    const dir = tempDir();
    node(dir, { id: "kind-strategy", kind: "kind" });
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "strategy-s",
      kind: "strategy",
      rounds: { count: 0, last_completed: null, last_aligned: null },
    });
    node(dir, { id: "tactic-done", kind: "tactic", phase: "review", serves: ["strategy-s"] });
    node(dir, { id: "tactic-next", kind: "tactic", phase: "draft", serves: ["strategy-s"], blocked_by: ["tactic-done"] });

    const plan = reconcileGraph({ dir, prStatesFile: prStates(dir, { "tactic-done": "merged" }), date: "2026-07-10" });

    expect(plan.prune).toEqual(["tactic-done"]);
    expect(plan.reconciled).toContainEqual({ id: "tactic-done", target: "done" });
    expect(existsSync(join(dir, "tactic-done.md"))).toBe(false);
    // Inbound blocked_by repaired.
    expect(readNode(dir, "tactic-next").blocked_by).toEqual([]);
    // Round stamped (only a draft child remains).
    const s = readNode(dir, "strategy-s");
    expect(s.rounds).toEqual({ count: 1, last_completed: "2026-07-10", last_aligned: null });
    expect(plan.edit).toContain("strategy-s");
    expect(plan.edit).toContain("tactic-next");
  });

  it("routes a closed-not-merged tactic to done", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, { id: "tactic-abandoned", kind: "tactic", phase: "qa" });
    const plan = reconcileGraph({ dir, prStatesFile: prStates(dir, { "tactic-abandoned": "closed" }), date: "2026-07-10" });
    expect(plan.prune).toEqual(["tactic-abandoned"]);
  });

  it("routes a merged residue-bearing tactic to main-qa (schema now carries the phase)", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, { id: "tactic-residue", kind: "tactic", phase: "review" }, "# body\n\n## needs-main\n\nverify prod\n");
    const plan = reconcileGraph({ dir, prStatesFile: prStates(dir, { "tactic-residue": "merged" }), date: "2026-07-10" });
    expect(plan.prune).toEqual([]);
    expect(plan.deferred).toEqual([]);
    expect(plan.reconciled).toContainEqual({ id: "tactic-residue", target: "main-qa" });
    expect(plan.edit).toContain("tactic-residue");
    // Not pruned — the node persists into its main-qa phase for post-merge verification.
    expect(existsSync(join(dir, "tactic-residue.md"))).toBe(true);
    expect(readNode(dir, "tactic-residue").phase).toBe("main-qa");
  });

  it("stamps a strategy once when two sibling children are pruned in the same sweep", () => {
    const dir = tempDir();
    node(dir, { id: "kind-strategy", kind: "kind" });
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "strategy-s",
      kind: "strategy",
      rounds: { count: 0, last_completed: null, last_aligned: null },
    });
    node(dir, { id: "tactic-a", kind: "tactic", phase: "review", serves: ["strategy-s"] });
    node(dir, { id: "tactic-b", kind: "tactic", phase: "review", serves: ["strategy-s"] });

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, { "tactic-a": "merged", "tactic-b": "merged" }),
      date: "2026-07-10",
    });

    expect(plan.prune.sort()).toEqual(["tactic-a", "tactic-b"]);
    expect(readNode(dir, "strategy-s").rounds).toEqual({
      count: 1,
      last_completed: "2026-07-10",
      last_aligned: null,
    });
  });

  it("does not stamp while a non-draft sibling survives the sweep", () => {
    const dir = tempDir();
    node(dir, { id: "kind-strategy", kind: "kind" });
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "strategy-s",
      kind: "strategy",
      rounds: { count: 0, last_completed: null, last_aligned: null },
    });
    node(dir, { id: "tactic-a", kind: "tactic", phase: "review", serves: ["strategy-s"] });
    node(dir, { id: "tactic-b", kind: "tactic", phase: "qa", serves: ["strategy-s"] });

    const plan = reconcileGraph({ dir, prStatesFile: prStates(dir, { "tactic-a": "merged" }), date: "2026-07-10" });
    expect(plan.prune).toEqual(["tactic-a"]);
    expect(readNode(dir, "strategy-s").rounds).toEqual({
      count: 0,
      last_completed: null,
      last_aligned: null,
    });
  });

  it("ignores tactics whose PR is not terminal or that are draft/done", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, { id: "tactic-draft", kind: "tactic", phase: "draft" });
    const plan = reconcileGraph({ dir, prStatesFile: prStates(dir, { "tactic-draft": "merged" }), date: "2026-07-10" });
    expect(plan.prune).toEqual([]);
    expect(plan.reconciled).toEqual([]);
  });
});
