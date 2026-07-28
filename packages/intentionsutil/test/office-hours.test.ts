import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import type { Attention, IntentionNode, OfficeHours } from "../src/schema.js";
import {
  officeHoursQueue,
  openBlockers,
  selectOfficeHours,
  type OfficeHoursSelection,
} from "../src/officeHours.js";
import { formatDisposition, resolveSessionCwd } from "../scripts/office-hours-select.js";
import { extractFrontmatter } from "../src/frontmatter.js";

// This test file lives at packages/intentionsutil/test/, so repo root is
// three dirname() calls up from this file's own location — same pattern as
// committed-store.test.ts and office-hours-select.ts.
const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(testDir)));
const selectScript = join(repoRoot, "packages/intentionsutil/scripts/office-hours-select.ts");

/** True when `origin/main` resolves in this checkout — the CLI tests below can
 * only run meaningfully against the real repo (office-hours-select.ts resolves
 * its own repoRoot from import.meta.url), so they skip cleanly rather than
 * false-failing in an isolated checkout with no `origin` remote. */
function hasOriginMain(): boolean {
  try {
    execFileSync("git", ["-C", repoRoot, "rev-parse", "--verify", "origin/main"], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function runSelect(args: string[]): string {
  return execFileSync("npx", ["tsx", selectScript, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

/** Build a full IntentionNode fixture, filling required/default fields. */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "ai",
    status: partial.status ?? "raw",
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

/** The kind nodes eligibility needs: strategy and tactic are goal-layer. */
function kinds(): IntentionNode[] {
  return [
    anode({ id: "kind-kind", kind: "kind", status: "codified" }),
    anode({ id: "kind-strategy", kind: "kind", status: "codified", attributes: { goal_layer: true } }),
    anode({ id: "kind-tactic", kind: "kind", status: "codified", attributes: { goal_layer: true } }),
    anode({ id: "kind-virtue", kind: "kind", status: "codified" }),
  ];
}

function boost(amount: number): Attention {
  return { boost: amount, override: null, rationale: "because" };
}

function parked(recommendation: string | null = null): OfficeHours {
  return { reason: "parked", since: "2026-07-06", recommendation };
}

describe("officeHoursQueue", () => {
  it("orders parked nodes by rank desc, id asc on ties, and excludes unparked", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-a", kind: "tactic", attention: boost(5), office_hours: parked() }),
      anode({ id: "tactic-c", kind: "tactic", attention: boost(5), office_hours: parked() }),
      anode({ id: "tactic-b", kind: "tactic", attention: boost(3), office_hours: parked() }),
      anode({ id: "tactic-quiet", kind: "tactic", office_hours: parked() }),
      anode({ id: "tactic-unparked", kind: "tactic", attention: boost(9) }),
    ];

    const queue = officeHoursQueue(nodes);

    expect(queue.map((m) => m.nodeId)).toEqual([
      "tactic-a",
      "tactic-c",
      "tactic-b",
      "tactic-quiet",
    ]);
    expect(queue.find((m) => m.nodeId === "tactic-quiet")?.rank).toBe(0);
    expect(queue.find((m) => m.nodeId === "tactic-a")?.rank).toBe(5);
  });

  it("returns an empty queue when nothing is parked", () => {
    const nodes = [...kinds(), anode({ id: "tactic-x", kind: "tactic" })];
    expect(officeHoursQueue(nodes)).toEqual([]);
  });
});

describe("openBlockers", () => {
  it("reports missing and non-done blockers, excludes done blockers", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-blocked",
        kind: "tactic",
        office_hours: parked(),
        blocked_by: ["tactic-gone", "tactic-done", "tactic-open"],
      }),
      anode({ id: "tactic-done", kind: "tactic", phase: "done" }),
      anode({ id: "tactic-open", kind: "tactic", phase: "implement" }),
    ];

    const blockers = openBlockers(nodes, "tactic-blocked");

    expect(blockers).toEqual([
      { id: "tactic-gone", missing: true },
      { id: "tactic-open", missing: false },
    ]);
  });

  it("returns no blockers for an unknown node", () => {
    expect(openBlockers([...kinds()], "nope")).toEqual([]);
  });
});

describe("selectOfficeHours", () => {
  it("selects the queue head with its blockers when no target is given", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-head",
        kind: "tactic",
        attention: boost(7),
        office_hours: parked(),
        blocked_by: ["tactic-missing"],
      }),
      anode({ id: "tactic-low", kind: "tactic", attention: boost(1), office_hours: parked() }),
    ];

    expect(selectOfficeHours(nodes)).toEqual({
      kind: "launch",
      nodeId: "tactic-head",
      blockers: [{ id: "tactic-missing", missing: true }],
    });
  });

  it("returns empty when nothing is parked and no target is given", () => {
    expect(selectOfficeHours([...kinds()])).toEqual({ kind: "empty" });
  });

  it("launches an explicitly targeted parked node", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-t", kind: "tactic", office_hours: parked() }),
    ];
    expect(selectOfficeHours(nodes, "tactic-t")).toEqual({
      kind: "launch",
      nodeId: "tactic-t",
      blockers: [],
    });
  });

  it("reports not-parked for a targeted node with null office_hours", () => {
    const nodes = [...kinds(), anode({ id: "tactic-t", kind: "tactic" })];
    expect(selectOfficeHours(nodes, "tactic-t")).toEqual({
      kind: "not-parked",
      nodeId: "tactic-t",
    });
  });

  it("reports not-parked for a nonexistent target", () => {
    expect(selectOfficeHours([...kinds()], "tactic-ghost")).toEqual({
      kind: "not-parked",
      nodeId: "tactic-ghost",
    });
  });
});

describe("resolveSessionCwd", () => {
  it("returns the worktree dir when it exists", () => {
    const root = mkdtempSync(join(tmpdir(), "oh-cwd-"));
    mkdirSync(join(root, ".claude", "worktrees", "tactic-here"), { recursive: true });
    expect(resolveSessionCwd(root, "tactic-here")).toBe(
      join(root, ".claude", "worktrees", "tactic-here"),
    );
  });

  it("falls back to the repo root when no worktree dir exists", () => {
    const root = mkdtempSync(join(tmpdir(), "oh-cwd-"));
    expect(resolveSessionCwd(root, "tactic-absent")).toBe(root);
  });

  it("rejects a path-unsafe id without touching the fs", () => {
    const root = mkdtempSync(join(tmpdir(), "oh-cwd-"));
    expect(() => resolveSessionCwd(root, "../escape")).toThrow(/unsafe node id/);
  });
});

describe("formatDisposition", () => {
  const stubCwd = (id: string): string => `/root/.claude/worktrees/${id}`;

  it("formats a launch line with no blockers", () => {
    const d: OfficeHoursSelection = { kind: "launch", nodeId: "tactic-a", blockers: [] };
    expect(formatDisposition(d, stubCwd)).toEqual({
      stdout: "launch tactic-a /root/.claude/worktrees/tactic-a",
      stderr: "",
    });
  });

  it("formats a launch line with a blocker NOTE on stderr", () => {
    const d: OfficeHoursSelection = {
      kind: "launch",
      nodeId: "tactic-a",
      blockers: [
        { id: "tactic-gone", missing: true },
        { id: "tactic-open", missing: false },
      ],
    };
    expect(formatDisposition(d, stubCwd)).toEqual({
      stdout: "launch tactic-a /root/.claude/worktrees/tactic-a",
      stderr: "NOTE — tactic-a is blocked by open tactic(s): tactic-gone (missing), tactic-open",
    });
  });

  it("formats an empty disposition", () => {
    expect(formatDisposition({ kind: "empty" }, stubCwd)).toEqual({ stdout: "empty", stderr: "" });
  });

  it("formats a not-parked disposition", () => {
    const d: OfficeHoursSelection = { kind: "not-parked", nodeId: "tactic-x" };
    expect(formatDisposition(d, stubCwd)).toEqual({
      stdout: "empty not-parked tactic-x",
      stderr: "",
    });
  });
});

// These tests exercise the real CLI against THIS repo's actual `origin/main`
// state, not in-memory fixtures — the direct regression test for the
// main-authority invariant office-hours-select.ts now guarantees (every queued
// node is genuinely parked on `origin/main`, not just in the local worktree).
// They skip cleanly when no `origin/main` ref is resolvable (e.g. a stripped
// checkout with no `origin` remote), matching the defensive posture of
// committed-store.test.ts's `describe.skipIf(!existsSync(...))`.
describe.skipIf(!hasOriginMain())("office-hours-select CLI (real repo)", () => {
  it("--list: every line matches rank\\tnodeId\\tsince", () => {
    const out = runSelect(["--list"]);
    const lines = out.split("\n").filter((l) => l.length > 0);
    for (const line of lines) {
      expect(line).toMatch(/^-?\d+(\.\d+)?\t\S+\t\S+$/);
    }
  }, 15000);

  it("main-authority invariant: every listed node is parked on origin/main", () => {
    const out = runSelect(["--list"]);
    const lines = out.split("\n").filter((l) => l.length > 0);
    const nodeIds = lines.map((line) => line.split("\t")[1]);
    for (const id of nodeIds) {
      const raw = execFileSync("git", ["-C", repoRoot, "show", `origin/main:intentions/${id}.md`], {
        encoding: "utf8",
      });
      const frontmatter = extractFrontmatter(raw, id);
      const parsed: unknown = parse(frontmatter);
      expect(parsed).toBeTruthy();
      expect((parsed as { office_hours?: unknown }).office_hours).not.toBeNull();
    }
  }, 15000);

  it("targeted not-parked: a fabricated node id reports not-parked", () => {
    const out = runSelect(["absent-node-id-xyz"]);
    expect(out).toBe("empty not-parked absent-node-id-xyz\n");
  }, 15000);

  it("--ref plumbing: --ref origin/main matches the no-flag default", () => {
    const withRef = runSelect(["--ref", "origin/main", "--list"]);
    const withoutRef = runSelect(["--list"]);
    expect(withRef).toBe(withoutRef);
  }, 15000);
});
