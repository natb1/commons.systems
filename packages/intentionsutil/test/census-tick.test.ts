import { existsSync, mkdtempSync, readFileSync } from "node:fs";
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
});
