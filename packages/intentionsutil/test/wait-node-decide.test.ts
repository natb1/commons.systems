import { describe, expect, it } from "vitest";
import { validateNode, type IntentionNode } from "../src/schema.js";
import {
  WAIT_MAX_HORIZON_MS,
  WAIT_RELEASE_SENTENCE,
  WAIT_UNTIL_RE,
  waitIdFor,
} from "../src/waits.js";
import { decideWait, type WaitInput } from "../scripts/wait-node-decide.js";

// tactic-wait-calendar-release Unit 5 — the network-free WAIT node decision.
// `decideWait` is pure over an in-memory node array, so these exercise it
// directly (no store, no subprocess), mirroring hold-node-decide.test.ts.

const STRATEGY = "strategy-graph-native-dispatch";
const STRATEGY_B = "strategy-main-health";
const SOURCE = "tactic-some-work";
const WAIT_ID = "tactic-wait-some-work";
const NOW = "2026-07-25T00:00:00Z";
const UNTIL = "2026-07-26T00:00:00Z";

function source(extra: Record<string, unknown> = {}): IntentionNode {
  return validateNode({
    id: SOURCE,
    kind: "tactic",
    statement: "some work",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    phase: "implement",
    ...extra,
  });
}

function wait(extra: Record<string, unknown> = {}): IntentionNode {
  return validateNode({
    id: WAIT_ID,
    kind: "tactic",
    statement: "wait",
    owner: "ai",
    status: "codified",
    serves: [STRATEGY],
    office_hours: null,
    attributes: {
      wait_for: SOURCE,
      wait_until: "2026-07-20T00:00:00Z",
      wait_armed_since: "2026-07-19T00:00:00Z",
      wait_attempts: 1,
      wait_reason: "old reason",
      wait_recommendation: "old recommendation",
    },
    ...extra,
  });
}

function input(overrides: Partial<WaitInput> = {}): WaitInput {
  return {
    sourceId: SOURCE,
    until: UNTIL,
    reason: "waiting for the verdict window to open\nsecond line",
    recommendation: "re-check whether the verdict is observable yet",
    diagnosis: null,
    now: NOW,
    ...overrides,
  };
}

describe("CLI --now default shape", () => {
  // Regression test for a bug where the CLI's `--now` default was
  // `new Date().toISOString()`, which always emits millisecond precision
  // (e.g. `2026-08-06T00:29:55.123Z`). `WAIT_UNTIL_RE` requires whole-second
  // precision with no milliseconds, and `decideWait` validates `now` through
  // `parseWaitUntil` (which uses `WAIT_UNTIL_RE`) — so the un-fixed default
  // failed validation on every CLI invocation that omitted `--now`. The fix
  // strips the milliseconds before assignment; `parseArgs`/`main` aren't
  // exported from wait-node-decide.ts, so this asserts the corrected
  // expression's output shape directly.
  it("produces a whole-second ISO instant matching WAIT_UNTIL_RE", () => {
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    expect(now).toMatch(WAIT_UNTIL_RE);
  });
});

describe("decideWait dispositions", () => {
  it("returns NONE with a constructed node and body when no wait exists", () => {
    const d = decideWait([source()], input());
    expect(d.disposition).toBe("NONE");
    expect(d.wait_id).toBe(WAIT_ID);
    expect(d.node).toBeDefined();
    expect(typeof d.node_body).toBe("string");
    expect(d.node_body_append).toBeUndefined();
    expect(d.node?.phase).toBeNull();
    expect(d.node?.office_hours).toBeNull(); // born UNPARKED, unlike a hold
    expect(d.node?.attributes).toEqual({
      wait_for: SOURCE,
      wait_until: UNTIL,
      wait_armed_since: NOW,
      wait_attempts: 1,
      wait_reason: input().reason,
      wait_recommendation: input().recommendation,
    });
  });

  it("returns REARM with incremented attempts when the wait is done", () => {
    const done = wait({ phase: "done", attributes: { ...wait().attributes, wait_attempts: 2 } });
    const d = decideWait([source(), done], input());
    expect(d.disposition).toBe("REARM");
    expect(d.node).toEqual({
      phase: null,
      attributes: {
        wait_until: UNTIL,
        // A re-arm starts a new arming cycle, so the armed-age clock restarts.
        wait_armed_since: NOW,
        wait_attempts: 3,
        wait_reason: input().reason,
        wait_recommendation: input().recommendation,
      },
    });
    expect(d.node_body_append).toContain(`## Arm ${NOW}`);
    expect(d.node_body_append).toContain(UNTIL);
    expect(d.node_body).toBeUndefined();
  });

  it("REARM refreshes reason/recommendation from CLI args, not the old node", () => {
    const done = wait({ phase: "done" });
    const d = decideWait(
      [source(), done],
      input({ reason: "new reason", recommendation: "new recommendation" }),
    );
    expect(d.node?.attributes).toMatchObject({
      wait_reason: "new reason",
      wait_recommendation: "new recommendation",
    });
  });

  it("returns EXTEND without incrementing attempts when the wait is still armed", () => {
    const armed = wait({ phase: null, attributes: { ...wait().attributes, wait_attempts: 2 } });
    const d = decideWait([source(), armed], input());
    expect(d.disposition).toBe("EXTEND");
    // Only attributes.wait_until changes — wait_attempts is NOT incremented,
    // and wait_armed_since is NOT refreshed (that is what makes cumulative
    // armed age, rather than the never-moving attempt counter, boundable).
    expect(d.node).toEqual({ attributes: { wait_until: UNTIL } });
    expect(d.node_body_append).toContain(`## Extend ${NOW}`);
    expect(d.node_body_append).toContain(UNTIL);
    expect(d.node_body).toBeUndefined();
  });

  it("EXTEND backfills wait_armed_since on a wait minted before the field existed", () => {
    const legacy = wait({
      phase: null,
      attributes: {
        wait_for: SOURCE,
        wait_until: "2026-07-20T00:00:00Z",
        wait_attempts: 2,
        wait_reason: "old reason",
        wait_recommendation: "old recommendation",
      },
    });
    const d = decideWait([source(), legacy], input());
    expect(d.disposition).toBe("EXTEND");
    // Backfilled at `now` — starting the clock beats leaving it unbounded.
    expect(d.node).toEqual({ attributes: { wait_until: UNTIL, wait_armed_since: NOW } });
  });

  it("EXTEND leaves a garbled wait_armed_since replaced rather than trusted", () => {
    const garbled = wait({
      phase: null,
      attributes: { ...wait().attributes, wait_armed_since: "not-an-instant" },
    });
    const d = decideWait([source(), garbled], input());
    expect(d.node).toEqual({ attributes: { wait_until: UNTIL, wait_armed_since: NOW } });
  });
});

describe("decideWait throw cases", () => {
  it("throws when the source node is not in the store", () => {
    expect(() => decideWait([], input())).toThrow(/is not in the store/);
  });

  it("throws when --until fails ISO instant validation", () => {
    expect(() => decideWait([source()], input({ until: "2026-07-26" }))).toThrow(
      /not a valid ISO 8601 UTC instant/,
    );
  });

  it("throws when --until is not strictly after --now", () => {
    expect(() => decideWait([source()], input({ until: NOW }))).toThrow(
      /must be strictly after/,
    );
    expect(() =>
      decideWait([source()], input({ until: "2026-07-24T00:00:00Z" })),
    ).toThrow(/must be strictly after/);
  });

  // The horizon exists because WAIT_ATTEMPT_CAP counts release/re-arm ROUNDS:
  // a wait that never comes due never increments it, so an unbounded --until
  // (or an unbounded extension loop) would suppress its source forever without
  // ever escalating to the author.
  it("throws when --until is beyond the wait horizon", () => {
    const beyond = new Date(Date.parse(NOW) + WAIT_MAX_HORIZON_MS + 24 * 60 * 60 * 1000)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");
    expect(() => decideWait([source()], input({ until: beyond }))).toThrow(
      /more than 30 days after --now/,
    );
    expect(() => decideWait([source()], input({ until: "9999-12-31T23:59:59Z" }))).toThrow(
      /more than 30 days after --now/,
    );
  });

  it("accepts an --until exactly at the horizon", () => {
    const atHorizon = new Date(Date.parse(NOW) + WAIT_MAX_HORIZON_MS)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");
    expect(decideWait([source()], input({ until: atHorizon })).disposition).toBe("NONE");
  });

  it("throws when an EXTEND would push the wait past the horizon from wait_armed_since", () => {
    const armed = wait({
      phase: null,
      attributes: { ...wait().attributes, wait_armed_since: "2026-07-01T00:00:00Z" },
    });
    // 2026-08-20 is inside the horizon measured from NOW (2026-07-25) but 50
    // days past the arming instant — the extend-forever loop this closes.
    expect(() =>
      decideWait([source(), armed], input({ until: "2026-08-20T00:00:00Z" })),
    ).toThrow(/continuously armed for more than 30 days/);
  });

  it("throws when the existing wait node carries a non-null office_hours", () => {
    const capped = wait({
      phase: null,
      office_hours: { reason: "cap exhausted", since: "2026-07-24", recommendation: null },
    });
    expect(() => decideWait([source(), capped], input())).toThrow(
      /already carries a non-null office_hours/,
    );
  });
});

describe("decideWait serves copying", () => {
  it("copies serves verbatim from the source", () => {
    const d = decideWait([source()], input());
    expect(d.node?.serves).toEqual([STRATEGY]);
  });

  it("copies a multi-entry serves array verbatim, in order", () => {
    const d = decideWait([source({ serves: [STRATEGY, STRATEGY_B] })], input());
    expect(d.node?.serves).toEqual([STRATEGY, STRATEGY_B]);
  });

  it("never forces a strategy onto a source that serves nothing", () => {
    const d = decideWait([source({ serves: [] })], input());
    expect(d.node?.serves).toEqual([]);
  });
});

describe("decideWait source edge", () => {
  it("appends the wait id when the edge is absent", () => {
    const d = decideWait([source({ blocked_by: ["tactic-other"] })], input());
    expect(d.source_edge_needed).toBe(true);
    expect(d.source_blocked_by).toEqual(["tactic-other", WAIT_ID]);
  });

  it("is idempotent when the edge is already present", () => {
    const existing = wait({ phase: "done" });
    const src = source({ blocked_by: ["tactic-other", WAIT_ID] });
    const d = decideWait([src, existing], input());
    expect(d.source_edge_needed).toBe(false);
    expect(d.source_blocked_by).toEqual(["tactic-other", WAIT_ID]);
  });

  it("never emits an office_hours write for the source node", () => {
    const d = decideWait([source()], input());
    expect(Object.keys(d).filter((k) => k.startsWith("source_")).sort()).toEqual([
      "source_blocked_by",
      "source_edge_needed",
    ]);
    expect(d.node?.id).toBe(WAIT_ID);
  });
});

describe("constructed wait node", () => {
  it("passes validateNode for the NONE disposition", () => {
    const d = decideWait([source()], input());
    const validated = validateNode(d.node);
    expect(validated.id).toBe(WAIT_ID);
    expect(validated.kind).toBe("tactic");
    expect(validated.owner).toBe("ai");
    expect(validated.status).toBe("codified");
    expect(validated.parent).toBeNull();
    expect(validated.phase).toBeNull();
    expect(validated.execution).toBeNull();
    expect(validated.validates).toEqual([]);
    expect(validated.blocked_by).toEqual([]);
    expect(validated.office_hours).toBeNull();
  });

  it("derives the wait id via waitIdFor", () => {
    expect(waitIdFor(SOURCE)).toBe(WAIT_ID);
  });
});

describe("generated body", () => {
  it("contains the closing WAIT_RELEASE_SENTENCE", () => {
    const d = decideWait([source()], input());
    expect(d.node_body).toContain(WAIT_RELEASE_SENTENCE);
  });

  it("states the source id and the recheck recipe", () => {
    const d = decideWait([source()], input());
    expect(d.node_body).toContain(SOURCE);
    expect(d.node_body).toContain("## How to recheck");
    expect(d.node_body).toContain(input().recommendation);
  });

  it("includes a Diagnosis section only when a body file was supplied", () => {
    const without = decideWait([source()], input());
    expect(without.node_body).not.toContain("## Diagnosis");

    const with_ = decideWait(
      [source()],
      input({ diagnosis: "recheck steps:\n- a\n- b" }),
    );
    expect(with_.node_body).toContain("## Diagnosis");
    expect(with_.node_body).toContain("recheck steps:");
  });
});
