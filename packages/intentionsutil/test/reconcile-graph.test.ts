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

function prStates(
  dir: string,
  states: Record<string, { state: string; mergedAt?: string; mergeCommitSha?: string }>,
): string {
  const f = join(dir, "_states.json");
  writeFileSync(f, JSON.stringify(states));
  return f;
}

describe("reconcileGraph", () => {
  it("transitions a merged no-residue tactic to done, records completion, leaves it present, stamps the round", () => {
    const dir = tempDir();
    node(dir, { id: "kind-strategy", kind: "kind" });
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "strategy-s",
      kind: "strategy",
      rounds: { count: 0, last_completed: null, last_aligned: null },
    });
    node(dir, {
      id: "tactic-done",
      kind: "tactic",
      phase: "review",
      serves: ["strategy-s"],
      execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    node(dir, { id: "tactic-next", kind: "tactic", phase: "draft", serves: ["strategy-s"], blocked_by: ["tactic-done"] });

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, {
        "tactic-done": { state: "merged", mergedAt: "2026-07-11T12:00:00Z", mergeCommitSha: "sha1" },
      }),
      date: "2026-07-10",
    });

    expect(plan.reconciled).toContainEqual({ id: "tactic-done", target: "done" });
    // No longer pruned — the node persists at phase done with completion evidence.
    expect(existsSync(join(dir, "tactic-done.md"))).toBe(true);
    expect(readNode(dir, "tactic-done").phase).toBe("done");
    expect(readNode(dir, "tactic-done").execution?.completion).toEqual({
      mergedAt: "2026-07-11T12:00:00Z",
      mergeCommitSha: "sha1",
      graphCommitSha: null,
    });
    // Edge repair no longer happens — the inbound blocked_by is left unchanged.
    expect(readNode(dir, "tactic-next").blocked_by).toEqual(["tactic-done"]);
    expect(plan.edit).not.toContain("tactic-next");
    // Round stamped (only a draft child remains).
    const s = readNode(dir, "strategy-s");
    expect(s.rounds).toEqual({ count: 1, last_completed: "2026-07-10", last_aligned: null });
    expect(plan.edit).toContain("strategy-s");
    expect(plan.edit).toContain("tactic-done");
  });

  it("reconciles a merged tactic that carries a live office_hours park (recording reality is not an autonomous decision) and preserves the park", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    const officeHours = {
      reason: "parked",
      since: "2026-08-01",
      recommendation: null,
      session_type: "other" as const,
    };
    node(dir, {
      id: "tactic-parked",
      kind: "tactic",
      phase: "review",
      execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
      office_hours: officeHours,
    });

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, {
        "tactic-parked": { state: "merged", mergedAt: "2026-07-11T12:00:00Z", mergeCommitSha: "sha3" },
      }),
      date: "2026-07-10",
    });

    expect(plan.reconciled).toContainEqual({ id: "tactic-parked", target: "done" });
    expect(readNode(dir, "tactic-parked").phase).toBe("done");
    expect(readNode(dir, "tactic-parked").execution?.completion).toEqual({
      mergedAt: "2026-07-11T12:00:00Z",
      mergeCommitSha: "sha3",
      graphCommitSha: null,
    });
    // The point of this test: reconciling reality does not clear the park.
    expect(readNode(dir, "tactic-parked").office_hours).toEqual(officeHours);
  });

  it("routes a closed-not-merged tactic to done with no completion evidence", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "tactic-abandoned",
      kind: "tactic",
      phase: "qa",
      execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, { "tactic-abandoned": { state: "closed" } }),
      date: "2026-07-10",
    });
    expect(plan.reconciled).toContainEqual({ id: "tactic-abandoned", target: "done" });
    expect(existsSync(join(dir, "tactic-abandoned.md"))).toBe(true);
    expect(readNode(dir, "tactic-abandoned").phase).toBe("done");
    // Closed-not-merged → no evidence recorded (census-flaggable integrity defect).
    expect(readNode(dir, "tactic-abandoned").execution?.completion ?? null).toBe(null);
  });

  it("routes a merged residue-bearing tactic to main-qa and records completion", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(
      dir,
      {
        id: "tactic-residue",
        kind: "tactic",
        phase: "review",
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
      },
      "# body\n\n## needs-main\n\nverify prod\n",
    );
    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, {
        "tactic-residue": { state: "merged", mergedAt: "2026-07-11T12:00:00Z", mergeCommitSha: "sha2" },
      }),
      date: "2026-07-10",
    });
    expect(plan.deferred).toEqual([]);
    expect(plan.reconciled).toContainEqual({ id: "tactic-residue", target: "main-qa" });
    expect(plan.edit).toContain("tactic-residue");
    expect(existsSync(join(dir, "tactic-residue.md"))).toBe(true);
    expect(readNode(dir, "tactic-residue").phase).toBe("main-qa");
    expect(readNode(dir, "tactic-residue").execution?.completion).toEqual({
      mergedAt: "2026-07-11T12:00:00Z",
      mergeCommitSha: "sha2",
      graphCommitSha: null,
    });
  });

  it("stamps a strategy once when two sibling children transition to done in the same sweep", () => {
    const dir = tempDir();
    node(dir, { id: "kind-strategy", kind: "kind" });
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "strategy-s",
      kind: "strategy",
      rounds: { count: 0, last_completed: null, last_aligned: null },
    });
    node(dir, {
      id: "tactic-a",
      kind: "tactic",
      phase: "review",
      serves: ["strategy-s"],
      execution: { branch: "a", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    node(dir, {
      id: "tactic-b",
      kind: "tactic",
      phase: "review",
      serves: ["strategy-s"],
      execution: { branch: "b", pr: 2, attempts: {}, markers: [], strategy_fingerprint: null },
    });

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, { "tactic-a": { state: "merged" }, "tactic-b": { state: "merged" } }),
      date: "2026-07-10",
    });

    expect(plan.reconciled).toContainEqual({ id: "tactic-a", target: "done" });
    expect(plan.reconciled).toContainEqual({ id: "tactic-b", target: "done" });
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
    node(dir, {
      id: "tactic-a",
      kind: "tactic",
      phase: "review",
      serves: ["strategy-s"],
      execution: { branch: "a", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    node(dir, { id: "tactic-b", kind: "tactic", phase: "qa", serves: ["strategy-s"] });

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, { "tactic-a": { state: "merged" } }),
      date: "2026-07-10",
    });
    expect(plan.reconciled).toContainEqual({ id: "tactic-a", target: "done" });
    expect(readNode(dir, "strategy-s").rounds).toEqual({
      count: 0,
      last_completed: null,
      last_aligned: null,
    });
  });

  it("stamps the round when the last non-done child reaches done, ignoring a sibling already done from a prior sweep", () => {
    const dir = tempDir();
    node(dir, { id: "kind-strategy", kind: "kind" });
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "strategy-s",
      kind: "strategy",
      rounds: { count: 0, last_completed: null, last_aligned: null },
    });
    // A sibling already at phase done from a PRIOR sweep, present on disk and NOT
    // in this sweep's pr-states. Without the `phase !== "done"` filter fix it
    // would be miscounted as a live remaining child and block the stamp forever.
    node(dir, { id: "tactic-prior", kind: "tactic", phase: "done", serves: ["strategy-s"] });
    node(dir, {
      id: "tactic-now",
      kind: "tactic",
      phase: "review",
      serves: ["strategy-s"],
      execution: { branch: "now", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
    });

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, { "tactic-now": { state: "merged" } }),
      date: "2026-07-10",
    });

    expect(plan.reconciled).toContainEqual({ id: "tactic-now", target: "done" });
    expect(readNode(dir, "strategy-s").rounds).toEqual({
      count: 1,
      last_completed: "2026-07-10",
      last_aligned: null,
    });
  });

  it("normalizes empty-string merge evidence to null rather than recording a blank sha", () => {
    // The bash wrapper builds the entry with `jq -r '.mergeCommitSha // empty'`,
    // so an absent/null GitHub field arrives as "". optionalString preserves ""
    // verbatim, so an un-normalized "" would land as evidence satisfying the
    // Completion JSDoc's "both non-null" merge proof while proving nothing.
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, {
      id: "tactic-blank",
      kind: "tactic",
      phase: "review",
      execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    reconcileGraph({
      dir,
      prStatesFile: prStates(dir, {
        "tactic-blank": { state: "merged", mergedAt: "2026-07-11T12:00:00Z", mergeCommitSha: "" },
      }),
      date: "2026-07-10",
    });
    expect(readNode(dir, "tactic-blank").execution?.completion).toEqual({
      mergedAt: "2026-07-11T12:00:00Z",
      mergeCommitSha: null,
      graphCommitSha: null,
    });
  });

  it("errors instead of silently writing an empty completion when a merged tactic has no execution", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, { id: "tactic-noexec", kind: "tactic", phase: "review" });
    expect(() =>
      reconcileGraph({
        dir,
        prStatesFile: prStates(dir, {
          "tactic-noexec": { state: "merged", mergedAt: "2026-07-11T12:00:00Z", mergeCommitSha: "sha" },
        }),
        date: "2026-07-10",
      }),
    ).toThrow(/no execution object/);
  });

  it("ignores tactics whose PR is not terminal or that are draft/done", () => {
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(dir, { id: "tactic-draft", kind: "tactic", phase: "draft" });
    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, { "tactic-draft": { state: "merged" } }),
      date: "2026-07-10",
    });
    expect(plan.reconciled).toEqual([]);
  });

  it("leaves a tactic already at main-qa with NO residue heading completely untouched", () => {
    // The silent regression this pins. A destination node minted directly at
    // `main-qa` at qa record time carries its source's PR and, by design, NO
    // `## needs-main` heading. `main-qa` is an OPEN phase, so without the
    // merge-absorbable narrowing the pass-1 enumeration picks the node up,
    // reads it as residue-free, and reconcileMergedPhase(false) routes it
    // straight to `done` — destroying the verification node before /qa-main
    // ever runs, with nothing in the output to signal it happened.
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(
      dir,
      {
        id: "tactic-minted-at-main-qa",
        kind: "tactic",
        phase: "main-qa",
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
      },
      "# body\n\nNo residue heading: verification is the whole point of this node.\n",
    );
    const file = join(dir, "tactic-minted-at-main-qa.md");
    const before = readFileSync(file, "utf8");

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, {
        "tactic-minted-at-main-qa": {
          state: "merged",
          mergedAt: "2026-07-11T12:00:00Z",
          mergeCommitSha: "sha-minted",
        },
      }),
      date: "2026-07-10",
    });

    // Not reconciled, not edited, not deferred — the node is simply not this
    // sweep's business.
    expect(plan.reconciled).toEqual([]);
    expect(plan.edit).toEqual([]);
    expect(plan.deferred).toEqual([]);
    // And not written: the phase survives, no completion evidence is stamped,
    // and the file is byte-for-byte what it was.
    expect(readNode(dir, "tactic-minted-at-main-qa").phase).toBe("main-qa");
    expect(readNode(dir, "tactic-minted-at-main-qa").execution?.completion ?? null).toBe(null);
    expect(readFileSync(file, "utf8")).toBe(before);
  });

  it("leaves a tactic already at main-qa WITH a residue heading untouched (the drain tail is /qa-main's to advance)", () => {
    // Same rule from the other side: being at `main-qa` — not the presence or
    // absence of the heading — is what takes the node out of this sweep. A
    // residue-bearing main-qa node would otherwise be re-stamped with merge
    // evidence and re-announced as reconciled on every single tick.
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(
      dir,
      {
        id: "tactic-draining",
        kind: "tactic",
        phase: "main-qa",
        execution: { branch: "b", pr: 2, attempts: {}, markers: [], strategy_fingerprint: null },
      },
      "# body\n\n## needs-main\n\nverify prod\n",
    );
    const file = join(dir, "tactic-draining.md");
    const before = readFileSync(file, "utf8");

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, {
        "tactic-draining": {
          state: "merged",
          mergedAt: "2026-07-11T12:00:00Z",
          mergeCommitSha: "sha-draining",
        },
      }),
      date: "2026-07-10",
    });

    expect(plan.reconciled).toEqual([]);
    expect(plan.edit).toEqual([]);
    expect(plan.deferred).toEqual([]);
    expect(readNode(dir, "tactic-draining").phase).toBe("main-qa");
    expect(readNode(dir, "tactic-draining").execution?.completion ?? null).toBe(null);
    expect(readFileSync(file, "utf8")).toBe(before);
  });

  it("routes a main-qa node whose source PR closed WITHOUT merging to done — nothing landed, so the verification is moot", () => {
    // The narrowing above forbids absorbing a MERGE into a main-qa node
    // ("there is no out-of-band merge left to absorb"). A close-without-merge
    // is a different event and absorbs no merge. It has to be handled HERE
    // because /qa-main structurally cannot: graph-select-target's main-qa arm
    // gates on the PR's `mergedAt`, which stays empty forever, so it answers
    // `pr-not-merged` on every tick. Without this the node is stranded at
    // main-qa permanently — never dispatched, never enumerated again.
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(
      dir,
      {
        id: "tactic-mainqa-abandoned-machine",
        kind: "tactic",
        phase: "main-qa",
        blocked_by: [],
        execution: { branch: "b", pr: 9, attempts: {}, markers: [], strategy_fingerprint: null },
      },
      "# body\n\n## Verification items\n\n- **V1 — check it**\n",
    );

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, { "tactic-mainqa-abandoned-machine": { state: "closed" } }),
      date: "2026-07-10",
    });

    expect(plan.reconciled).toContainEqual({
      id: "tactic-mainqa-abandoned-machine",
      target: "done",
    });
    expect(readNode(dir, "tactic-mainqa-abandoned-machine").phase).toBe("done");
    // No completion evidence — the same deliberate census-flaggable
    // integrity-defect signal every other closed-unmerged tactic gets.
    expect(
      readNode(dir, "tactic-mainqa-abandoned-machine").execution?.completion ?? null,
    ).toBe(null);
  });

  it("still reconciles a merged tactic at phase review to both targets (the narrowing is main-qa-only)", () => {
    // The over-narrowing guard. Excluding `main-qa` from the enumeration must
    // not disturb any other open phase, and in particular `review` must still
    // be able to route INTO main-qa when it carries residue.
    const dir = tempDir();
    node(dir, { id: "kind-tactic", kind: "kind" });
    node(
      dir,
      {
        id: "tactic-review-residue",
        kind: "tactic",
        phase: "review",
        execution: { branch: "r1", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
      },
      "# body\n\n## needs-main\n\nverify prod\n",
    );
    node(
      dir,
      {
        id: "tactic-review-clean",
        kind: "tactic",
        phase: "review",
        execution: { branch: "r2", pr: 2, attempts: {}, markers: [], strategy_fingerprint: null },
      },
      "# body\n\nnothing to verify on main\n",
    );

    const plan = reconcileGraph({
      dir,
      prStatesFile: prStates(dir, {
        "tactic-review-residue": {
          state: "merged",
          mergedAt: "2026-07-11T12:00:00Z",
          mergeCommitSha: "sha-r1",
        },
        "tactic-review-clean": {
          state: "merged",
          mergedAt: "2026-07-11T12:00:00Z",
          mergeCommitSha: "sha-r2",
        },
      }),
      date: "2026-07-10",
    });

    expect(plan.reconciled).toContainEqual({ id: "tactic-review-residue", target: "main-qa" });
    expect(plan.reconciled).toContainEqual({ id: "tactic-review-clean", target: "done" });
    expect(readNode(dir, "tactic-review-residue").phase).toBe("main-qa");
    expect(readNode(dir, "tactic-review-clean").phase).toBe("done");
    expect(readNode(dir, "tactic-review-residue").execution?.completion).toEqual({
      mergedAt: "2026-07-11T12:00:00Z",
      mergeCommitSha: "sha-r1",
      graphCommitSha: null,
    });
    expect(plan.edit).toContain("tactic-review-residue");
    expect(plan.edit).toContain("tactic-review-clean");
  });
});
