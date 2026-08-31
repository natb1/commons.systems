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
  SESSION_TYPE_PENALTY,
  type OfficeHoursSelection,
} from "../src/officeHours.js";
import type { SessionType } from "../src/schema.js";
import {
  formatBandNote,
  formatDisposition,
  formatQueueRow,
  parseSelectorArgs,
  resolveSessionCwd,
} from "../scripts/office-hours-select.js";
import { extractFrontmatter } from "../src/frontmatter.js";
import { writeNode } from "../src/store.js";
import { listNodesAtRef } from "../scripts/lib-store-at-ref.js";

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

/** Spawns via the tsx ESM *loader*, not the `tsx` CLI. The CLI opens an IPC
 * unix socket, which this project's sandboxed test runner refuses with
 * `EPERM ... /tmp/.../tsx-*.pipe` — the same reason graph-commit's two spawns
 * moved to this form. The loader needs no npm resolution and opens no socket.
 * `reader-required-dir.test.ts` spawns the same way. */
function runSelect(args: string[]): string {
  return execFileSync(process.execPath, ["--import", "tsx/esm", selectScript, ...args], {
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
  return { boosts: { "1": amount }, rationale: "because" };
}

function parked(recommendation: string | null = null): OfficeHours {
  return { reason: "parked", since: "2026-07-06", recommendation, session_type: "other" };
}

/** Like `parked`, but with an explicit session_type (for penalty-ranking tests). */
function parkedTyped(sessionType: SessionType, recommendation: string | null = null): OfficeHours {
  return { reason: "parked", since: "2026-07-06", recommendation, session_type: sessionType };
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
    expect(queue.find((m) => m.nodeId === "tactic-quiet")?.score).toBe(0);
    expect(queue.find((m) => m.nodeId === "tactic-a")?.score).toBe(5);
  });

  it("returns an empty queue when nothing is parked", () => {
    const nodes = [...kinds(), anode({ id: "tactic-x", kind: "tactic" })];
    expect(officeHoursQueue(nodes)).toEqual([]);
  });

  it("soft-penalizes requirement-discovery/curriculum-review parks below an equal-attention other park", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-other",
        kind: "tactic",
        attention: boost(10),
        office_hours: parkedTyped("other"),
      }),
      anode({
        id: "tactic-reqdisc",
        kind: "tactic",
        attention: boost(10),
        office_hours: parkedTyped("requirement-discovery"),
      }),
      anode({
        id: "tactic-currev",
        kind: "tactic",
        attention: boost(10),
        office_hours: parkedTyped("curriculum-review"),
      }),
    ];

    const queue = officeHoursQueue(nodes);

    expect(queue.map((m) => m.nodeId)).toEqual(["tactic-other", "tactic-currev", "tactic-reqdisc"]);
    expect(queue.find((m) => m.nodeId === "tactic-other")?.score).toBe(10);
    expect(queue.find((m) => m.nodeId === "tactic-reqdisc")?.score).toBe(
      10 * SESSION_TYPE_PENALTY,
    );
  });

  it("lets a sufficiently boosted penalized park overtake a lower-boost other park (soft, not a hard floor)", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-other-low",
        kind: "tactic",
        attention: boost(3),
        office_hours: parkedTyped("other"),
      }),
      anode({
        id: "tactic-reqdisc-high",
        kind: "tactic",
        attention: boost(20),
        office_hours: parkedTyped("requirement-discovery"),
      }),
    ];

    const queue = officeHoursQueue(nodes);

    expect(queue.map((m) => m.nodeId)).toEqual(["tactic-reqdisc-high", "tactic-other-low"]);
  });

  it("computes QueueMember.score as rawAttention * SESSION_TYPE_PENALTY for a penalized type, and raw for other", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-other",
        kind: "tactic",
        attention: boost(8),
        office_hours: parkedTyped("other"),
      }),
      anode({
        id: "tactic-currev",
        kind: "tactic",
        attention: boost(8),
        office_hours: parkedTyped("curriculum-review"),
      }),
    ];

    const queue = officeHoursQueue(nodes);

    expect(queue.find((m) => m.nodeId === "tactic-other")?.score).toBe(8);
    expect(queue.find((m) => m.nodeId === "tactic-currev")?.score).toBe(8 * SESSION_TYPE_PENALTY);
  });

  it("puts a tier-2 parked node ahead of a higher-raw-rank tier-1 node (hard outer axis)", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-tier1-high",
        kind: "tactic",
        attention: boost(100),
        office_hours: parked(),
      }),
      anode({
        id: "tactic-tier2-low",
        kind: "tactic",
        attention: boost(1),
        attributes: { tier: 2 },
        office_hours: parked(),
      }),
    ];

    const queue = officeHoursQueue(nodes);

    expect(queue.map((m) => m.nodeId)).toEqual(["tactic-tier2-low", "tactic-tier1-high"]);
    expect(queue.find((m) => m.nodeId === "tactic-tier2-low")?.tier).toBe(2);
    expect(queue.find((m) => m.nodeId === "tactic-tier1-high")?.tier).toBe(1);
  });

  it("exposes sessionType on every QueueMember and filters by sessionType when given", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-other",
        kind: "tactic",
        attention: boost(1),
        office_hours: parkedTyped("other"),
      }),
      anode({
        id: "tactic-reqdisc",
        kind: "tactic",
        attention: boost(1),
        office_hours: parkedTyped("requirement-discovery"),
      }),
      anode({
        id: "tactic-currev",
        kind: "tactic",
        attention: boost(1),
        office_hours: parkedTyped("curriculum-review"),
      }),
    ];

    const full = officeHoursQueue(nodes);
    expect(full.map((m) => m.sessionType).sort()).toEqual(
      ["curriculum-review", "other", "requirement-discovery"].sort(),
    );

    const filtered = officeHoursQueue(nodes, "requirement-discovery");
    expect(filtered.map((m) => m.nodeId)).toEqual(["tactic-reqdisc"]);
    expect(filtered.every((m) => m.sessionType === "requirement-discovery")).toBe(true);
  });

  it("bands a parked hold with the live work it blocks, and sums that work's score into its own", () => {
    // Under the widened attention relation the blocked source is one of the
    // hold's PARENTS, so the source's score reaches the hold as its `band` (and
    // its lineage contribution as score) — no separate lift step.
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-hold", kind: "tactic", office_hours: parked() }),
      anode({
        id: "tactic-source",
        kind: "tactic",
        attention: boost(60),
        phase: "implement",
        blocked_by: ["tactic-hold"],
      }),
      anode({
        id: "tactic-unrelated",
        kind: "tactic",
        attention: boost(40),
        office_hours: parked(),
      }),
    ];

    const queue = officeHoursQueue(nodes);

    expect(queue.map((m) => m.nodeId)).toEqual(["tactic-hold", "tactic-unrelated"]);
    const hold = queue.find((m) => m.nodeId === "tactic-hold");
    expect(hold?.band).toBe(60);
    expect(hold?.score).toBe(60);
    expect(hold?.ownScore).toBe(60);
    expect(hold?.bandSource).toBe("tactic-source");
    // The unbanded park outranks nothing: band is compared before score.
    expect(queue.find((m) => m.nodeId === "tactic-unrelated")?.band).toBe(0);
  });

  it("inherits a higher tier from a node it blocks, and scores per-tier there (tier is a namespace)", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-hold", kind: "tactic", attention: boost(100), office_hours: parked() }),
      anode({
        id: "tactic-source",
        kind: "tactic",
        attention: boost(1),
        attributes: { tier: 2 },
        phase: "implement",
        blocked_by: ["tactic-hold"],
      }),
    ];

    const hold = officeHoursQueue(nodes).find((m) => m.nodeId === "tactic-hold");

    expect(hold?.tier).toBe(2);
    expect(hold?.ownTier).toBe(2);
    // Both boosts are authored on tier 1, so neither counts in the tier-2
    // ranking the hold now resolves in — the point of per-tier namespacing.
    expect(hold?.band).toBe(0);
    expect(hold?.score).toBe(0);
    expect(hold?.bandSource).toBeNull();
  });

  it("bands with the highest-scoring blocked source and sums every one of them", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-hold", kind: "tactic", office_hours: parked() }),
      anode({
        id: "tactic-src-low",
        kind: "tactic",
        attention: boost(5),
        phase: "implement",
        blocked_by: ["tactic-hold"],
      }),
      anode({
        id: "tactic-src-high",
        kind: "tactic",
        attention: boost(30),
        phase: "implement",
        blocked_by: ["tactic-hold"],
      }),
    ];

    const hold = officeHoursQueue(nodes).find((m) => m.nodeId === "tactic-hold");

    expect(hold?.band).toBe(30);
    expect(hold?.bandSource).toBe("tactic-src-high");
    // Score is the whole deduped lineage's contribution: 5 + 30.
    expect(hold?.score).toBe(35);
  });

  it("breaks a band tie between equal blocked sources by id ascending", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-hold", kind: "tactic", office_hours: parked() }),
      anode({
        id: "tactic-src-z",
        kind: "tactic",
        attention: boost(9),
        phase: "implement",
        blocked_by: ["tactic-hold"],
      }),
      anode({
        id: "tactic-src-a",
        kind: "tactic",
        attention: boost(9),
        phase: "implement",
        blocked_by: ["tactic-hold"],
      }),
    ];

    const hold = officeHoursQueue(nodes).find((m) => m.nodeId === "tactic-hold");

    expect(hold?.band).toBe(9);
    expect(hold?.bandSource).toBe("tactic-src-a");
  });

  it("takes no band or score from a blocked source already at phase done (cleared blocker)", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-hold", kind: "tactic", attention: boost(2), office_hours: parked() }),
      anode({
        id: "tactic-src-done",
        kind: "tactic",
        attention: boost(50),
        phase: "done",
        blocked_by: ["tactic-hold"],
      }),
    ];

    const hold = officeHoursQueue(nodes).find((m) => m.nodeId === "tactic-hold");

    expect(hold?.score).toBe(2);
    expect(hold?.band).toBe(0);
    expect(hold?.tier).toBe(1);
    expect(hold?.bandSource).toBeNull();
  });

  it("bands with a blocked source that scores below it, its own score still summing both", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-hold", kind: "tactic", attention: boost(20), office_hours: parked() }),
      anode({
        id: "tactic-source",
        kind: "tactic",
        attention: boost(3),
        phase: "implement",
        blocked_by: ["tactic-hold"],
      }),
    ];

    const hold = officeHoursQueue(nodes).find((m) => m.nodeId === "tactic-hold");

    expect(hold?.band).toBe(3);
    expect(hold?.bandSource).toBe("tactic-source");
    expect(hold?.score).toBe(23);
    expect(hold?.ownScore).toBe(23);
  });

  it("applies the session-type penalty to BOTH band and score, and never to tier", () => {
    const nodes = [
      ...kinds(),
      anode({
        id: "tactic-hold",
        kind: "tactic",
        office_hours: parkedTyped("requirement-discovery"),
      }),
      anode({
        id: "tactic-source",
        kind: "tactic",
        attention: boost(40),
        phase: "implement",
        blocked_by: ["tactic-hold"],
      }),
      anode({
        id: "tactic-tier2",
        kind: "tactic",
        attention: boost(1),
        attributes: { tier: 2 },
        office_hours: parked(),
      }),
    ];

    const queue = officeHoursQueue(nodes);
    const hold = queue.find((m) => m.nodeId === "tactic-hold");

    expect(hold?.band).toBe(40 * SESSION_TYPE_PENALTY);
    expect(hold?.score).toBe(40 * SESSION_TYPE_PENALTY);
    // `ownScore` reports the UN-penalized value.
    expect(hold?.ownScore).toBe(40);
    expect(hold?.tier).toBe(1);
    // The penalized band is huge, but tier is still the hard outer axis.
    expect(queue.map((m) => m.nodeId)).toEqual(["tactic-tier2", "tactic-hold"]);
  });

  it("leaves a parked node with no inbound blocked_by edges unbanded", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-alone", kind: "tactic", attention: boost(7), office_hours: parked() }),
      anode({ id: "tactic-elsewhere", kind: "tactic", attention: boost(90), phase: "implement" }),
    ];

    const alone = officeHoursQueue(nodes).find((m) => m.nodeId === "tactic-alone");

    expect(alone?.bandSource).toBeNull();
    expect(alone?.band).toBe(0);
    expect(alone?.score).toBe(alone?.ownScore);
    expect(alone?.tier).toBe(alone?.ownTier);
    expect(alone?.score).toBe(7);
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

  it("throws when both target and sessionType are supplied", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-t", kind: "tactic", office_hours: parked() }),
    ];
    expect(() => selectOfficeHours(nodes, "tactic-t", "curriculum-review")).toThrow(
      /mutually exclusive/,
    );
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

describe("parseSelectorArgs", () => {
  it("treats a single positional as the target (the regression case)", () => {
    expect(parseSelectorArgs(["tactic-some-id"])).toEqual({
      kind: "ok",
      wantList: false,
      sessionType: undefined,
      target: "tactic-some-id",
      ref: "origin/main",
    });
  });

  it("returns no target for empty args", () => {
    expect(parseSelectorArgs([])).toEqual({
      kind: "ok",
      wantList: false,
      sessionType: undefined,
      target: undefined,
      ref: "origin/main",
    });
  });

  it("sets wantList for --list with no target", () => {
    expect(parseSelectorArgs(["--list"])).toEqual({
      kind: "ok",
      wantList: true,
      sessionType: undefined,
      target: undefined,
      ref: "origin/main",
    });
  });

  it("sets sessionType for --type <t> with no target", () => {
    expect(parseSelectorArgs(["--type", "curriculum-review"])).toEqual({
      kind: "ok",
      wantList: false,
      sessionType: "curriculum-review",
      target: undefined,
      ref: "origin/main",
    });
  });

  it("combines --type and --list, excluding the type value from positionals", () => {
    expect(parseSelectorArgs(["--type", "curriculum-review", "--list"])).toEqual({
      kind: "ok",
      wantList: true,
      sessionType: "curriculum-review",
      target: undefined,
      ref: "origin/main",
    });
  });

  it("errors when --type is combined with a node-id positional", () => {
    const result = parseSelectorArgs(["--type", "curriculum-review", "tactic-x"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/--type is mutually exclusive/);
  });

  it("errors when --list is combined with a node-id positional", () => {
    const result = parseSelectorArgs(["--list", "tactic-x"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/--list is mutually exclusive/);
  });

  it("errors on an unknown --type value", () => {
    const result = parseSelectorArgs(["--type", "bogus"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/unknown --type/);
  });

  it("errors with a missing-value message when --type is the last token", () => {
    const result = parseSelectorArgs(["--type"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/missing value for --type/);
    // The unknown-value branch would interpolate the literal string "undefined".
    expect(result.kind === "error" && result.message).not.toMatch(/undefined/);
  });

  it("errors with a missing-value message when --type is followed by another flag", () => {
    const result = parseSelectorArgs(["--type", "--list"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/missing value for --type/);
  });

  it("accepts the --type=<value> spelling", () => {
    expect(parseSelectorArgs(["--type=curriculum-review"])).toEqual({
      kind: "ok",
      wantList: false,
      sessionType: "curriculum-review",
      target: undefined,
      ref: "origin/main",
    });
  });

  it("accepts --type=<value> combined with --list", () => {
    expect(parseSelectorArgs(["--type=requirement-discovery", "--list"])).toEqual({
      kind: "ok",
      wantList: true,
      sessionType: "requirement-discovery",
      target: undefined,
      ref: "origin/main",
    });
  });

  it("errors on an unknown --type=<value>", () => {
    const result = parseSelectorArgs(["--type=bogus"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/unknown --type/);
  });

  it("errors with a missing-value message on an empty --type=", () => {
    const result = parseSelectorArgs(["--type="]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/missing value for --type/);
  });

  it("errors on an unrecognized flag rather than silently ignoring it", () => {
    // The regression: a filtered-out unknown flag left sessionType undefined and
    // emitted the UNFILTERED queue head with exit 0.
    const result = parseSelectorArgs(["--typ", "curriculum-review"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/unknown flag "--typ"/);
  });

  it("errors when a boolean flag is given a value", () => {
    const result = parseSelectorArgs(["--list=true"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/--list takes no value/);
  });

  it("sets ref for --ref <git-ref>, excluding the ref value from positionals", () => {
    expect(parseSelectorArgs(["--ref", "HEAD"])).toEqual({
      kind: "ok",
      wantList: false,
      sessionType: undefined,
      target: undefined,
      ref: "HEAD",
    });
  });

  it("accepts the --ref=<value> spelling alongside a node-id target", () => {
    expect(parseSelectorArgs(["--ref=HEAD", "tactic-some-id"])).toEqual({
      kind: "ok",
      wantList: false,
      sessionType: undefined,
      target: "tactic-some-id",
      ref: "HEAD",
    });
  });

  it("errors when --ref is the last token", () => {
    const result = parseSelectorArgs(["--ref"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/--ref requires a git-ref argument/);
  });

  it("errors when --ref is followed by another flag", () => {
    const result = parseSelectorArgs(["--ref", "--list"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/--ref requires a git-ref argument/);
  });

  it("errors on more than one node-id positional", () => {
    const result = parseSelectorArgs(["tactic-a", "tactic-b"]);
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/at most one node-id/);
  });
});

describe("formatQueueRow", () => {
  it("renders the tab-separated --list columns in contract order", () => {
    // Column order is parsed positionally by office-hours-graph's
    // `IFS=$'\t' read -r score sessiontype nid date` loop; a reorder there or
    // here breaks every park lookup and reports a false empty queue.
    const row = formatQueueRow({
      nodeId: "tactic-a",
      tier: 1,
      band: 0,
      score: 12.5,
      depth: 0,
      ownTier: 1,
      ownScore: 12.5,
      bandSource: null,
      sessionType: "curriculum-review",
      since: "2026-07-01",
    });
    expect(row).toBe("12.5\tcurriculum-review\ttactic-a\t2026-07-01");
    expect(row.split("\t")).toEqual(["12.5", "curriculum-review", "tactic-a", "2026-07-01"]);
  });

  it("emits exactly four tab-separated fields, even for a banded member", () => {
    const row = formatQueueRow({
      nodeId: "tactic-b",
      tier: 3,
      band: 30,
      score: 35,
      depth: 1,
      ownTier: 3,
      ownScore: 35,
      bandSource: "tactic-blocked",
      sessionType: "other",
      since: "2026-08-01",
    });
    expect(row.split("\t")).toHaveLength(4);
    expect(row).toBe("35\tother\ttactic-b\t2026-08-01");
  });
});

describe("formatBandNote", () => {
  it("renders the advisory naming the band source and the member's own score", () => {
    const note = formatBandNote({
      nodeId: "tactic-b",
      tier: 3,
      band: 30,
      score: 35,
      depth: 1,
      ownTier: 3,
      ownScore: 35,
      bandSource: "tactic-blocked",
      sessionType: "other",
      since: "2026-08-01",
    });
    expect(note).toBe(
      "NOTE — tactic-b ranks at tier 3 band 30 via tactic-blocked (own score 35)",
    );
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

// --- office-hours-select CLI: fixture-backed regression coverage ----------
//
// These cases used to spawn the real `office-hours-select.ts` CLI as a
// subprocess against THIS repo's actual `origin/main` graph. That has two
// problems, not one:
//
//  1. `office-hours-select.ts` resolves its OWN repo root from
//     `import.meta.url` (see that file's "Paths" section), never from the
//     subprocess's `cwd` — so a subprocess spawned from this test file can
//     never be pointed at a fixture repo. It always reads THIS checkout's
//     real `origin/main`. Any PR that both migrates `intentions/` node data
//     and tightens the schema code reading it is then red by construction
//     until merge (the F4 defect these tests were rewritten to stop
//     causing) — every assertion below sidesteps that by never touching
//     this repo's real graph.
//  2. Spawning `npx tsx <script>` as a subprocess is heavier than these
//     cases need and, empirically, less portable: under this project's
//     sandboxed test runner the `tsx` subprocess's own IPC pipe listener
//     fails with `EPERM`, so the old CLI-subprocess tests could only run
//     with the sandbox disabled. `listNodesAtRef` (imported directly below)
//     shells out to plain `git` only, which has no such issue.
//
// `buildGitFixture` commits a small `intentions/` tree to a throwaway repo
// so `listNodesAtRef` — the git-archive-at-a-ref read path this whole block
// exists to guard — is exercised for real, just against fixture content
// instead of this repo's live graph. Every assertion the original block made
// is still made below; see the per-case comment for where each one moved.
function buildGitFixture(nodes: IntentionNode[]): string {
  const root = mkdtempSync(join(tmpdir(), "oh-fixture-"));
  const intentionsDir = join(root, "intentions");
  for (const node of nodes) writeNode(intentionsDir, node);
  execFileSync("git", ["-C", root, "init", "-q"]);
  execFileSync("git", ["-C", root, "config", "user.email", "test@example.com"]);
  execFileSync("git", ["-C", root, "config", "user.name", "Fixture Builder"]);
  execFileSync("git", ["-C", root, "add", "-A"]);
  execFileSync("git", ["-C", root, "commit", "-q", "-m", "fixture"]);
  return root;
}

describe("office-hours-select CLI (fixture repo)", () => {
  it("--list: every line matches rank\\tsessionType\\tnodeId\\tsince", () => {
    // Was: the real CLI's `--list` against this repo's live `origin/main`
    // graph. Now: the same production formatter (`formatQueueRow`) over an
    // `officeHoursQueue` computed from fixture nodes — the column-shape
    // contract is pinned against real computed scores/ids without depending
    // on this repo's real graph content.
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-list-a", kind: "tactic", office_hours: parked() }),
      anode({
        id: "tactic-list-b",
        kind: "tactic",
        office_hours: parkedTyped("curriculum-review"),
      }),
    ];
    const rows = officeHoursQueue(nodes).map(formatQueueRow);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toMatch(/^-?\d+(\.\d+)?\t\S+\t\S+\t\S+$/);
    }
  });

  it("main-authority invariant: every listed node is parked in the COMMITTED tree at the ref, not in a dirty working tree", () => {
    // Was: `git show origin/main:intentions/<id>.md` against this repo's
    // real checkout. Now: the identical re-read-independently-of-the-parser
    // mechanic (raw `git show` + `extractFrontmatter` + `parse`) against a
    // fixture repo — AND with a working-tree mutation left uncommitted, so
    // this also proves `listNodesAtRef` answers from the COMMIT, never from
    // a dirty checkout. That is the exact distinction "genuinely parked on
    // origin/main, not just in the local worktree" was guarding.
    const parkedNode = anode({
      id: "tactic-committed-park",
      kind: "tactic",
      office_hours: parked(),
    });
    const unparkedNode = anode({ id: "tactic-committed-open", kind: "tactic" });
    const root = buildGitFixture([...kinds(), parkedNode, unparkedNode]);

    // Dirty the working tree AFTER the commit, without committing: clear the
    // parked node's office_hours on disk. A read that consulted the working
    // tree instead of the ref would now see it as unparked.
    writeNode(join(root, "intentions"), { ...parkedNode, office_hours: null });

    const nodesAtRef = listNodesAtRef(root, "HEAD");
    const queued = officeHoursQueue(nodesAtRef);
    const nodeIds = queued.map((m) => m.nodeId);

    expect(nodeIds).toContain("tactic-committed-park");
    expect(nodeIds).not.toContain("tactic-committed-open");

    for (const id of nodeIds) {
      const raw = execFileSync("git", ["-C", root, "show", `HEAD:intentions/${id}.md`], {
        encoding: "utf8",
      });
      const frontmatter = extractFrontmatter(raw, id);
      const parsed: unknown = parse(frontmatter);
      expect(parsed).toBeTruthy();
      expect((parsed as { office_hours?: unknown }).office_hours).not.toBeNull();
    }
  });

  it("--ref plumbing: the CLI's default ref is the literal string \"origin/main\", matching an explicit --ref origin/main", () => {
    // Was: two real CLI-subprocess invocations against this repo's live
    // `origin/main`, compared for equal output. `office-hours-select.ts`
    // resolves its own repo root (see the block comment above), so a
    // subprocess can't be redirected at a fixture — but `parseSelectorArgs`
    // (pure, already imported above) is the single place the default is
    // set (`ref = DEFAULT_REF` when `--ref` is omitted; see
    // office-hours-select.ts around its `parseSelectorArgs` body). Asserting
    // the two parses agree pins the same fact the subprocess comparison was
    // checking — the default and the explicit flag resolve identically —
    // without needing a live repo or a subprocess.
    const withoutFlag = parseSelectorArgs([]);
    const withExplicitFlag = parseSelectorArgs(["--ref", "origin/main"]);
    if (withoutFlag.kind !== "ok" || withExplicitFlag.kind !== "ok") {
      throw new Error("expected both parses to succeed");
    }
    expect(withoutFlag.ref).toBe("origin/main");
    expect(withExplicitFlag.ref).toBe(withoutFlag.ref);
  });
});

// The one deliberately-LIVE case: exercises the real CLI subprocess against
// THIS repo's actual `origin/main`, catching a real end-to-end wiring
// regression (subprocess spawn, the actual script file, its own repo-root
// resolution, a real `git archive` read against a real ref) that no fixture
// can reach, since `office-hours-select.ts` always reads ITS OWN checkout's
// `origin/main` (see the fixture block's comment above). Kept minimal and
// content-independent — "does this fabricated id exist" is true regardless
// of what the real graph currently holds, so this stays robust to graph
// churn while every other original assertion moved to the fixture block
// above. Skips cleanly when no `origin/main` ref is resolvable (e.g. a
// stripped checkout with no `origin` remote) — same defensive posture as
// committed-store.test.ts's `describe.skipIf(!existsSync(...))`.
describe.skipIf(!hasOriginMain())("office-hours-select CLI (live smoke, real repo)", () => {
  it("targeted not-parked: a fabricated node id reports not-parked", () => {
    const out = runSelect(["absent-node-id-xyz"]);
    expect(out).toBe("empty not-parked absent-node-id-xyz\n");
  }, 15000);
});
