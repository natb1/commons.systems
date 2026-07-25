import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  formatDisposition,
  parseSelectorArgs,
  resolveSessionCwd,
} from "../scripts/office-hours-select.js";

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
    expect(queue.find((m) => m.nodeId === "tactic-quiet")?.rank).toBe(0);
    expect(queue.find((m) => m.nodeId === "tactic-a")?.rank).toBe(5);
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
    expect(queue.find((m) => m.nodeId === "tactic-other")?.rank).toBe(10);
    expect(queue.find((m) => m.nodeId === "tactic-reqdisc")?.rank).toBe(10 * SESSION_TYPE_PENALTY);
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

  it("computes QueueMember.rank as rawAttention * SESSION_TYPE_PENALTY for a penalized type, and raw for other", () => {
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

    expect(queue.find((m) => m.nodeId === "tactic-other")?.rank).toBe(8);
    expect(queue.find((m) => m.nodeId === "tactic-currev")?.rank).toBe(8 * SESSION_TYPE_PENALTY);
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
    });
  });

  it("returns no target for empty args", () => {
    expect(parseSelectorArgs([])).toEqual({
      kind: "ok",
      wantList: false,
      sessionType: undefined,
      target: undefined,
    });
  });

  it("sets wantList for --list with no target", () => {
    expect(parseSelectorArgs(["--list"])).toEqual({
      kind: "ok",
      wantList: true,
      sessionType: undefined,
      target: undefined,
    });
  });

  it("sets sessionType for --type <t> with no target", () => {
    expect(parseSelectorArgs(["--type", "curriculum-review"])).toEqual({
      kind: "ok",
      wantList: false,
      sessionType: "curriculum-review",
      target: undefined,
    });
  });

  it("combines --type and --list, excluding the type value from positionals", () => {
    expect(parseSelectorArgs(["--type", "curriculum-review", "--list"])).toEqual({
      kind: "ok",
      wantList: true,
      sessionType: "curriculum-review",
      target: undefined,
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
