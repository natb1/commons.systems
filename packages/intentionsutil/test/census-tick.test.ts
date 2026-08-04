import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";
import { censusTick } from "../scripts/census-tick.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "census-tick-"));
}

function node(dir: string, partial: Partial<IntentionNode> & { id: string; kind: string }): void {
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
}

/** A verified-complete execution record (mergedAt + mergeCommitSha both set). */
function verifiedExecution(pr: number): IntentionNode["execution"] {
  return {
    branch: "b",
    pr,
    attempts: {},
    markers: [],
    strategy_fingerprint: null,
    completion: { mergedAt: "2026-07-11T12:00:00Z", mergeCommitSha: "sha1", graphCommitSha: null },
  };
}

describe("censusTick", () => {
  it("prunes a verified done-present tactic and repairs the survivor's inbound blocked_by", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "tactic-verified",
      kind: "tactic",
      phase: "done",
      execution: verifiedExecution(1),
    });
    node(dir, {
      id: "tactic-survivor",
      kind: "tactic",
      phase: "implement",
      blocked_by: ["tactic-verified"],
    });

    const plan = censusTick({ dir, date: "2026-08-04" });

    expect(plan.prune).toEqual(["tactic-verified"]);
    expect(existsSync(join(dir, "tactic-verified.md"))).toBe(false);
    expect(readNode(dir, "tactic-survivor").blocked_by).toEqual([]);
    expect(plan.edit).toEqual(["tactic-survivor"]);
  });

  it("mints one defect for an unverified done-present tactic and leaves the file in place", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "tactic-unverified",
      kind: "tactic",
      phase: "done",
      execution: { branch: "b", pr: 7, attempts: {}, markers: [], strategy_fingerprint: null },
    });

    const plan = censusTick({ dir, date: "2026-08-04" });

    expect(plan.prune).toEqual([]);
    expect(existsSync(join(dir, "tactic-unverified.md"))).toBe(true);
    expect(plan.defectCount).toBe(1);
    expect(plan.defectsMinted).toEqual(["tactic-census-defect-unverified"]);

    const defect = readNode(dir, "tactic-census-defect-unverified");
    expect(defect.phase).toBe("implement");
    expect(defect.office_hours).toBeNull();
    expect(defect.attributes.census_defect).toEqual({
      target: "tactic-unverified",
      reason: "unverified-merge",
      detected: "2026-08-04",
    });
    expect(defect.statement).toContain("execution.pr:7");

    // Minted body starts with a single H1 derived from the same statement text
    // (not the zero-heading regression the census QA finding flagged).
    const raw = readFileSync(join(dir, "tactic-census-defect-unverified.md"), "utf8");
    const fenceEnd = raw.indexOf("\n---\n", 3);
    const body = raw.slice(fenceEnd + "\n---\n".length);
    const bodyLines = body.split("\n");
    const headingLines = bodyLines.filter((line) => /^# /.test(line));
    expect(headingLines).toHaveLength(1);
    const firstNonEmptyLine = bodyLines.find((line) => line.trim() !== "");
    expect(firstNonEmptyLine).toMatch(/^# /);
    expect(firstNonEmptyLine).toContain(defect.statement);
    expect(body).toContain("Investigate why `tactic-unverified`'s completion is not mechanically verifiable");
  });

  it("does not re-mint an already-surfaced defect on a second run", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "tactic-unverified",
      kind: "tactic",
      phase: "done",
      execution: { branch: "b", pr: 7, attempts: {}, markers: [], strategy_fingerprint: null },
    });

    const first = censusTick({ dir, date: "2026-08-04" });
    expect(first.defectsMinted).toEqual(["tactic-census-defect-unverified"]);

    const second = censusTick({ dir, date: "2026-08-05" });
    expect(second.defectsMinted).toEqual([]);
    expect(second.defectsExisting).toEqual(["tactic-census-defect-unverified"]);
    expect(second.defectCount).toBe(1);
  });

  // The closed-defect self-regress the census QA finding reproduced: a defect
  // node closed the way its OWN generated body instructs ("If <target> already
  // verifies and was pruned, close this node (phase → done)") is itself a
  // done-present node with execution: null, so it used to be classified as a
  // fresh defect and minted tactic-census-defect-census-defect-<target> —
  // unbounded, one generation per tick.
  describe("closed census-defect nodes", () => {
    /** A census-minted defect node, closed (phase done, execution still null). */
    function closedDefect(dir: string, targetId: string, reason = "no-execution"): string {
      const id = `tactic-census-defect-${targetId.replace(/^(tactic|strategy)-/, "")}`;
      node(dir, {
        id,
        kind: "tactic",
        phase: "done",
        execution: null,
        attributes: { census_defect: { target: targetId, reason, detected: "2026-08-01" } },
      });
      return id;
    }

    it("prunes a closed defect node and mints nothing for it", () => {
      const dir = tempDir();
      node(dir, { id: "kind-tactic", kind: "kind" });
      // The target was fixed and pruned by an earlier tick; only the closed
      // defect node remains.
      const defectId = closedDefect(dir, "tactic-broken");

      const plan = censusTick({ dir, date: "2026-08-04" });

      expect(plan.prune).toEqual([defectId]);
      expect(plan.defectsMinted).toEqual([]);
      expect(plan.defectsExisting).toEqual([]);
      expect(plan.defectCount).toBe(0);
      expect(existsSync(join(dir, `${defectId}.md`))).toBe(false);
      expect(existsSync(join(dir, "tactic-census-defect-census-defect-broken.md"))).toBe(false);
    });

    it("is a clean no-op on a second run — no second-order defect id anywhere", () => {
      const dir = tempDir();
      node(dir, { id: "kind-tactic", kind: "kind" });
      closedDefect(dir, "tactic-broken");

      censusTick({ dir, date: "2026-08-04" });
      const second = censusTick({ dir, date: "2026-08-05" });

      expect(second).toEqual({
        prune: [],
        edit: [],
        defectsMinted: [],
        defectsExisting: [],
        defectCount: 0,
        retained: [],
      });
      // Nothing named census-defect-census-defect survived either generation.
      expect(readdirSync(dir).filter((f) => f.includes("defect-census-defect"))).toEqual([]);
      expect(readdirSync(dir).sort()).toEqual(["kind-tactic.md"]);
    });

    it("prunes without re-minting in the same batch when the target is still unverified", () => {
      const dir = tempDir();
      node(dir, { id: "kind-tactic", kind: "kind" });
      // Closed prematurely: the target is STILL done-but-unverifiable, so this
      // tick both prunes the defect node and would otherwise re-mint its id.
      node(dir, {
        id: "tactic-broken",
        kind: "tactic",
        phase: "done",
        execution: { branch: "b", pr: 7, attempts: {}, markers: [], strategy_fingerprint: null },
      });
      const defectId = closedDefect(dir, "tactic-broken", "unverified-merge");

      const plan = censusTick({ dir, date: "2026-08-04" });

      // The id appears as a prune and NOWHERE else — handing graph-commit the
      // same id as both `--prune <id>` and a create arg is the bug being fixed.
      expect(plan.prune).toEqual([defectId]);
      expect(plan.defectsMinted).toEqual([]);
      expect(plan.defectsExisting).toEqual([]);
      expect(plan.defectCount).toBe(1);
      expect(existsSync(join(dir, `${defectId}.md`))).toBe(false);

      // The defect is not lost: the next tick re-mints it cleanly, because the
      // target is still broken and dedup is by file existence.
      const next = censusTick({ dir, date: "2026-08-05" });
      expect(next.prune).toEqual([]);
      expect(next.defectsMinted).toEqual([defectId]);
      expect(readNode(dir, defectId).attributes.census_defect).toEqual({
        target: "tactic-broken",
        reason: "unverified-merge",
        detected: "2026-08-05",
      });
    });
  });

  it("prunes both co-pruned nodes without editing the blocker that is itself deleted", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "tactic-b",
      kind: "tactic",
      phase: "done",
      execution: verifiedExecution(2),
    });
    node(dir, {
      id: "tactic-a",
      kind: "tactic",
      phase: "done",
      blocked_by: ["tactic-b"],
      execution: verifiedExecution(3),
    });

    const plan = censusTick({ dir, date: "2026-08-04" });

    expect(plan.prune).toEqual(["tactic-a", "tactic-b"]);
    expect(plan.edit).toEqual([]);
    expect(existsSync(join(dir, "tactic-a.md"))).toBe(false);
    expect(existsSync(join(dir, "tactic-b.md"))).toBe(false);
  });

  describe("refusal on non-blocked_by inbound edges", () => {
    it("refuses to prune a candidate still named by a surviving node's parent, and reports it in retained", () => {
      const dir = tempDir();
      node(dir, { id: "kind-tactic", kind: "kind" });
      node(dir, {
        id: "tactic-parent-target",
        kind: "tactic",
        phase: "done",
        execution: verifiedExecution(10),
      });
      node(dir, {
        id: "tactic-child",
        kind: "tactic",
        phase: "implement",
        parent: "tactic-parent-target",
      });

      const plan = censusTick({ dir, date: "2026-08-04" });

      expect(plan.prune).toEqual([]);
      expect(plan.retained).toEqual(["tactic-parent-target"]);
      expect(plan.edit).toEqual([]);
      expect(plan.defectsMinted).toEqual([]);
      expect(plan.defectsExisting).toEqual([]);
      expect(plan.defectCount).toBe(0);
      expect(existsSync(join(dir, "tactic-parent-target.md"))).toBe(true);
      // Untouched: refusal leaves the file exactly as it was, no repair attempt.
      expect(readNode(dir, "tactic-parent-target").phase).toBe("done");
    });

    it("refuses to prune a candidate still named by a surviving node's validates edge", () => {
      const dir = tempDir();
      node(dir, { id: "kind-tactic", kind: "kind" });
      node(dir, {
        id: "strategy-validated-target",
        kind: "strategy",
        phase: "done",
        execution: verifiedExecution(11),
      });
      node(dir, {
        id: "tactic-validator",
        kind: "tactic",
        phase: "implement",
        validates: ["strategy-validated-target"],
      });

      const plan = censusTick({ dir, date: "2026-08-04" });

      expect(plan.prune).toEqual([]);
      expect(plan.retained).toEqual(["strategy-validated-target"]);
      expect(plan.defectsMinted).toEqual([]);
      expect(existsSync(join(dir, "strategy-validated-target.md"))).toBe(true);
    });

    it("refuses to prune a candidate still named by a surviving node's serves edge", () => {
      const dir = tempDir();
      node(dir, { id: "kind-tactic", kind: "kind" });
      node(dir, {
        id: "strategy-served-target",
        kind: "strategy",
        phase: "done",
        execution: verifiedExecution(12),
      });
      node(dir, {
        id: "tactic-server",
        kind: "tactic",
        phase: "implement",
        serves: ["strategy-served-target"],
      });

      const plan = censusTick({ dir, date: "2026-08-04" });

      expect(plan.prune).toEqual([]);
      expect(plan.retained).toEqual(["strategy-served-target"]);
      expect(plan.defectsMinted).toEqual([]);
      expect(existsSync(join(dir, "strategy-served-target.md"))).toBe(true);
    });

    it("still prunes a candidate whose only non-blocked_by referrer is co-pruned in the same batch", () => {
      const dir = tempDir();
      node(dir, { id: "kind-tactic", kind: "kind" });
      node(dir, {
        id: "tactic-copruned-target",
        kind: "tactic",
        phase: "done",
        execution: verifiedExecution(20),
      });
      node(dir, {
        id: "tactic-copruned-referrer",
        kind: "tactic",
        phase: "done",
        parent: "tactic-copruned-target",
        execution: verifiedExecution(21),
      });

      const plan = censusTick({ dir, date: "2026-08-04" });

      expect(plan.prune).toEqual(["tactic-copruned-referrer", "tactic-copruned-target"]);
      expect(plan.retained).toEqual([]);
      expect(existsSync(join(dir, "tactic-copruned-target.md"))).toBe(false);
      expect(existsSync(join(dir, "tactic-copruned-referrer.md"))).toBe(false);
    });
  });
});
