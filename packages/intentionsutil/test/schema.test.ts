import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import type { IntentionNode } from "../src/schema.js";
import {
  FIRST_CLASS_FIELD_NAMES,
  STATUSES,
  SUPERSEDED_STATUS,
  fieldWriteClass,
  isRetired,
  isSuperseded,
  refusedCrossClassFields,
  refusedDurableFields,
  refusedFields,
  validateGraph,
  validateGraphProseRefs,
  validateNode,
} from "../src/schema.js";
import { readNode, writeNode } from "../src/store.js";
import { WAIT_MAX_HORIZON_MS } from "../src/waits.js";

describe("validateNode", () => {
  it("accepts a valid full node", () => {
    const input = {
      id: "n1",
      kind: "strategy",
      statement: "A full node.",
      owner: "human",
      status: "codified",
      parent: "p",
      serves: ["v1", "v2"],
      recovers: ["d1"],
      rationale: "r",
      reading: "rd",
      clarifications: [{ question: "q", answer: "a" }],
      tooling_goals: [{ kind: "actuator", statement: "t" }],
      success_signal: {
        observable: "o",
        sensor: "s",
        threshold: "th",
        is_proxy: true,
      },
      attention: {
        boosts: { "1": 2 },
        rationale: "Draws attention now.",
      },
      attributes: { source: "github:natb1/commons.systems#1" },
    };
    expect(validateNode(input)).toEqual({
      ...input,
      // Graph-native dispatch fields default when absent.
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      superseded_by: [],
      supersession_expiry: null,
      office_hours: null,
      pace_exempt: false,
      rounds: null,
    });
  });

  it("parses all graph-native dispatch fields when present", () => {
    const input = {
      id: "n1-dispatch",
      kind: "tactic",
      statement: "A tactic carrying full dispatch state.",
      owner: "ai",
      status: "codified",
      phase: "qa",
      execution: {
        branch: "123-do-the-thing",
        pr: 456,
        attempts: { implement: 1, qa: 2 },
        markers: ["dispatch:qa"],
        strategy_fingerprint: "abc123",
      },
      validates: ["strategy-1"],
      blocked_by: ["tactic-2"],
      office_hours: {
        reason: "needs human input",
        since: "2026-07-03",
        recommendation: "escalate to the author",
      },
      pace_exempt: true,
      rounds: { count: 3, last_completed: "2026-07-02" },
    };
    const result = validateNode(input);
    expect(result.phase).toBe("qa");
    expect(result.execution).toEqual({
      branch: "123-do-the-thing",
      pr: 456,
      attempts: { implement: 1, qa: 2 },
      markers: ["dispatch:qa"],
      strategy_fingerprint: "abc123",
      fix: null,
      conflict: null,
      completion: null,
      lane_pass: null,
    });
    expect(result.validates).toEqual(["strategy-1"]);
    expect(result.blocked_by).toEqual(["tactic-2"]);
    expect(result.office_hours).toEqual({
      reason: "needs human input",
      since: "2026-07-03",
      recommendation: "escalate to the author",
      session_type: "other",
    });
    expect(result.pace_exempt).toBe(true);
    expect(result.rounds).toEqual({
      count: 3,
      last_completed: "2026-07-02",
      last_aligned: null,
    });
  });

  it("defaults execution nested nullables and tolerates a bare execution", () => {
    const result = validateNode({
      id: "n1-exec",
      kind: "tactic",
      statement: "Execution with null pr and fingerprint.",
      owner: "ai",
      status: "raw",
      execution: { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    expect(result.execution).toEqual({
      branch: "b",
      pr: null,
      attempts: {},
      markers: [],
      strategy_fingerprint: null,
      fix: null,
      conflict: null,
      completion: null,
      lane_pass: null,
    });
  });

  it("round-trips a completion object with a full ISO-8601 mergedAt timestamp", () => {
    const result = validateNode({
      id: "n1-completion-pr",
      kind: "tactic",
      statement: "Execution with a real PR-merge completion.",
      owner: "ai",
      status: "raw",
      execution: {
        branch: "b",
        pr: 42,
        attempts: {},
        markers: [],
        strategy_fingerprint: null,
        completion: {
          mergedAt: "2026-07-11T12:00:00Z",
          mergeCommitSha: "feedface",
          graphCommitSha: null,
        },
      },
    });
    expect(result.execution?.completion).toEqual({
      mergedAt: "2026-07-11T12:00:00Z",
      mergeCommitSha: "feedface",
      graphCommitSha: null,
    });
  });

  it("round-trips a completion object for the manual/out-of-band graphCommitSha path", () => {
    const result = validateNode({
      id: "n1-completion-oob",
      kind: "tactic",
      statement: "Execution with an out-of-band completion.",
      owner: "ai",
      status: "raw",
      execution: {
        branch: "b",
        pr: null,
        attempts: {},
        markers: [],
        strategy_fingerprint: null,
        completion: {
          mergedAt: null,
          mergeCommitSha: null,
          graphCommitSha: "abc123",
        },
      },
    });
    expect(result.execution?.completion).toEqual({
      mergedAt: null,
      mergeCommitSha: null,
      graphCommitSha: "abc123",
    });
  });

  it("round-trips a valid execution.conflict object", () => {
    const result = validateNode({
      id: "n1-conflict",
      kind: "tactic",
      statement: "Execution with a conflict interrupt in flight.",
      owner: "ai",
      status: "raw",
      execution: {
        branch: "b",
        pr: 42,
        attempts: {},
        markers: [],
        strategy_fingerprint: null,
        conflict: { since: "2026-08-03", attempt: 1 },
      },
    });
    // A conflict object with no `head_sha` (a legacy interrupt, entered before
    // the review-binding head guard existed) validates to an explicit null —
    // which the guarded clear reads as "unrecognized head", failing closed to a
    // re-review rather than preserving the reviewed marker.
    expect(result.execution?.conflict).toEqual({
      since: "2026-08-03",
      attempt: 1,
      head_sha: null,
    });
  });

  it("round-trips execution.conflict.head_sha", () => {
    const result = validateNode({
      id: "tactic-x",
      kind: "tactic",
      statement: "s",
      owner: "ai",
      status: "raw",
      execution: {
        branch: "b",
        pr: 42,
        attempts: {},
        markers: [],
        strategy_fingerprint: null,
        conflict: { since: "2026-08-03", attempt: 1, head_sha: "deadbeef" },
      },
    });
    expect(result.execution?.conflict?.head_sha).toBe("deadbeef");
  });

  it("accepts a null execution.conflict", () => {
    const result = validateNode({
      id: "n1-conflict-null",
      kind: "tactic",
      statement: "Execution with an explicit null conflict.",
      owner: "ai",
      status: "raw",
      execution: {
        branch: "b",
        pr: null,
        attempts: {},
        markers: [],
        strategy_fingerprint: null,
        conflict: null,
      },
    });
    expect(result.execution?.conflict).toBeNull();
  });

  it("defaults execution.conflict to null when absent", () => {
    const result = validateNode({
      id: "n1-conflict-absent",
      kind: "tactic",
      statement: "Execution with no conflict field at all.",
      owner: "ai",
      status: "raw",
      execution: { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    expect(result.execution?.conflict).toBeNull();
  });

  it("rejects an execution.conflict with a malformed attempt", () => {
    expect(() =>
      validateNode({
        id: "n1-conflict-bad-attempt",
        kind: "tactic",
        statement: "Conflict with a non-numeric attempt.",
        owner: "ai",
        status: "raw",
        execution: {
          branch: "b",
          pr: null,
          attempts: {},
          markers: [],
          strategy_fingerprint: null,
          conflict: { since: "2026-08-03", attempt: "one" },
        },
      }),
    ).toThrow(IntentionSchemaError);
  });

  it("rejects an execution.conflict with a malformed since date", () => {
    expect(() =>
      validateNode({
        id: "n1-conflict-bad-since",
        kind: "tactic",
        statement: "Conflict with a malformed since date.",
        owner: "ai",
        status: "raw",
        execution: {
          branch: "b",
          pr: null,
          attempts: {},
          markers: [],
          strategy_fingerprint: null,
          conflict: { since: "08/03/2026", attempt: 0 },
        },
      }),
    ).toThrow(IntentionSchemaError);
  });

  // --- execution.lane_pass -------------------------------------------------
  //
  // The completed-pass stamp the dispatch ladder reads to tell a successful
  // conflict/qa-fix pass (which never moves `phase`) from a stall.

  /** An `execution` block carrying `lane_pass`, for the round-trip tests below. */
  function nodeWithLanePass(id: string, lanePass: unknown): unknown {
    return {
      id,
      kind: "tactic",
      statement: "Execution with a lane-pass stamp.",
      owner: "ai",
      status: "raw",
      execution: {
        branch: "b",
        pr: 42,
        attempts: {},
        markers: [],
        strategy_fingerprint: null,
        lane_pass: lanePass,
      },
    };
  }

  it("round-trips a valid execution.lane_pass stamp", () => {
    const result = validateNode(
      nodeWithLanePass("n1-lane-pass", {
        at: "2026-08-13T09:41:06Z",
        lane: "conflict",
        phase: "conflict",
        sha: "deadbeef",
      }),
    );
    expect(result.execution?.lane_pass).toEqual({
      at: "2026-08-13T09:41:06Z",
      lane: "conflict",
      phase: "conflict",
      sha: "deadbeef",
    });
  });

  it("defaults execution.lane_pass.sha to null when absent", () => {
    const result = validateNode(
      nodeWithLanePass("n1-lane-pass-no-sha", {
        at: "2026-08-13T09:41:06Z",
        lane: "qa-fix",
        phase: "qa",
      }),
    );
    expect(result.execution?.lane_pass?.sha).toBeNull();
  });

  it("defaults execution.lane_pass to null when absent", () => {
    const result = validateNode({
      id: "n1-lane-pass-absent",
      kind: "tactic",
      statement: "Execution with no lane_pass field at all.",
      owner: "ai",
      status: "raw",
      execution: { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
    });
    expect(result.execution?.lane_pass).toBeNull();
  });

  // The `at` format is load-bearing: the ladder compares stamps with a plain
  // string `>=`, so anything but fixed-width second precision ending in `Z`
  // breaks chronological ordering. Each rejected shape below is a real way a
  // writer drifts.

  it("rejects an execution.lane_pass.at carrying milliseconds", () => {
    // `toISOString()` straight from the clock. `"…:06.789Z" >= "…:06Z"` is
    // false (`.` is 0x2E, `Z` is 0x5A) — a same-second landmine.
    expect(() =>
      validateNode(
        nodeWithLanePass("n1-lane-pass-ms", {
          at: "2026-08-13T09:41:06.789Z",
          lane: "conflict",
          phase: "conflict",
        }),
      ),
    ).toThrow(IntentionSchemaError);
  });

  it("rejects a date-only execution.lane_pass.at", () => {
    // The repo's `YYYY-MM-DD` convention: a stamp written this morning would
    // qualify for every launch window for the rest of the day.
    expect(() =>
      validateNode(
        nodeWithLanePass("n1-lane-pass-date-only", {
          at: "2026-08-13",
          lane: "conflict",
          phase: "conflict",
        }),
      ),
    ).toThrow(IntentionSchemaError);
  });

  it("rejects an execution.lane_pass.at with no trailing Z", () => {
    expect(() =>
      validateNode(
        nodeWithLanePass("n1-lane-pass-no-z", {
          at: "2026-08-13T09:41:06",
          lane: "conflict",
          phase: "conflict",
        }),
      ),
    ).toThrow(IntentionSchemaError);
  });

  it("rejects an unknown execution.lane_pass.lane", () => {
    expect(() =>
      validateNode(
        nodeWithLanePass("n1-lane-pass-bad-lane", {
          at: "2026-08-13T09:41:06Z",
          lane: "review-fix",
          phase: "review",
        }),
      ),
    ).toThrow(IntentionSchemaError);
  });

  it("rejects an unknown execution.lane_pass.phase", () => {
    expect(() =>
      validateNode(
        nodeWithLanePass("n1-lane-pass-bad-phase", {
          at: "2026-08-13T09:41:06Z",
          lane: "conflict",
          phase: "shipping",
        }),
      ),
    ).toThrow(IntentionSchemaError);
  });

  it("accepts the interrupt phase names fix and conflict, which PHASES excludes", () => {
    // `lane_pass.phase` is validated against DISPATCH_PHASE_NAMES, the wider
    // vocabulary `execution.attempts` is already keyed by.
    for (const phase of ["fix", "conflict"]) {
      const result = validateNode(
        nodeWithLanePass(`n1-lane-pass-${phase}`, {
          at: "2026-08-13T09:41:06Z",
          lane: "conflict",
          phase,
        }),
      );
      expect(result.execution?.lane_pass?.phase).toBe(phase);
      // ...and the node's own `phase` field still refuses them.
      expect(() =>
        validateNode({
          id: "n1-phase-strict",
          kind: "tactic",
          statement: "s",
          owner: "ai",
          status: "raw",
          phase,
        }),
      ).toThrow(IntentionSchemaError);
    }
  });

  it("accepts a per-strategy strategy_fingerprint map", () => {
    const result = validateNode({
      id: "n1-fp-map",
      kind: "tactic",
      statement: "Execution with a per-strategy fingerprint map.",
      owner: "ai",
      status: "raw",
      execution: {
        branch: "b",
        pr: null,
        attempts: {},
        markers: [],
        strategy_fingerprint: { "strategy-a": "hash-a", "strategy-b": "hash-b" },
      },
    });
    expect(result.execution?.strategy_fingerprint).toEqual({
      "strategy-a": "hash-a",
      "strategy-b": "hash-b",
    });
  });

  it("accepts the deprecated-legacy bare-string strategy_fingerprint", () => {
    const result = validateNode({
      id: "n1-fp-legacy",
      kind: "tactic",
      statement: "Execution with a legacy bare-string fingerprint.",
      owner: "ai",
      status: "raw",
      execution: { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: "legacy-hash" },
    });
    expect(result.execution?.strategy_fingerprint).toBe("legacy-hash");
  });

  it("rejects a strategy_fingerprint map with a non-string value", () => {
    expect(() =>
      validateNode({
        id: "n1-fp-bad",
        kind: "tactic",
        statement: "Malformed fingerprint map.",
        owner: "ai",
        status: "raw",
        execution: {
          branch: "b",
          pr: null,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": 123 },
        },
      }),
    ).toThrow(/Expected string or \{hash, sha\} object for execution.strategy_fingerprint.strategy-a/);
  });

  it("accepts a strategy_fingerprint map value that is a {hash, sha} object", () => {
    const result = validateNode({
      id: "n1-fp-obj",
      kind: "tactic",
      statement: "Execution with an object-form fingerprint entry.",
      owner: "ai",
      status: "raw",
      execution: {
        branch: "b",
        pr: null,
        attempts: {},
        markers: [],
        strategy_fingerprint: { "strategy-a": { hash: "hash-a", sha: "sha-a" } },
      },
    });
    expect(result.execution?.strategy_fingerprint).toEqual({
      "strategy-a": { hash: "hash-a", sha: "sha-a" },
    });
  });

  it("accepts a mixed map with one bare-string legacy entry and one {hash, sha} object entry", () => {
    const result = validateNode({
      id: "n1-fp-mixed",
      kind: "tactic",
      statement: "Execution with a mixed-form fingerprint map.",
      owner: "ai",
      status: "raw",
      execution: {
        branch: "b",
        pr: null,
        attempts: {},
        markers: [],
        strategy_fingerprint: {
          "strategy-a": "hash-a",
          "strategy-b": { hash: "hash-b", sha: "sha-b" },
        },
      },
    });
    expect(result.execution?.strategy_fingerprint).toEqual({
      "strategy-a": "hash-a",
      "strategy-b": { hash: "hash-b", sha: "sha-b" },
    });
  });

  it("rejects a {hash, sha} map object value missing hash", () => {
    expect(() =>
      validateNode({
        id: "n1-fp-nohash",
        kind: "tactic",
        statement: "Object-form fingerprint entry missing hash.",
        owner: "ai",
        status: "raw",
        execution: {
          branch: "b",
          pr: null,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": { sha: "sha-a" } },
        },
      }),
    ).toThrow(IntentionSchemaError);
  });

  it("rejects a {hash, sha} map object value missing sha", () => {
    expect(() =>
      validateNode({
        id: "n1-fp-nosha",
        kind: "tactic",
        statement: "Object-form fingerprint entry missing sha.",
        owner: "ai",
        status: "raw",
        execution: {
          branch: "b",
          pr: null,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": { hash: "hash-a" } },
        },
      }),
    ).toThrow(IntentionSchemaError);
  });

  it("rejects a {hash, sha} map object value with a non-string hash or sha", () => {
    expect(() =>
      validateNode({
        id: "n1-fp-badhash",
        kind: "tactic",
        statement: "Object-form fingerprint entry with a numeric hash.",
        owner: "ai",
        status: "raw",
        execution: {
          branch: "b",
          pr: null,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": { hash: 123, sha: "sha-a" } },
        },
      }),
    ).toThrow(IntentionSchemaError);
    expect(() =>
      validateNode({
        id: "n1-fp-badsha",
        kind: "tactic",
        statement: "Object-form fingerprint entry with a numeric sha.",
        owner: "ai",
        status: "raw",
        execution: {
          branch: "b",
          pr: null,
          attempts: {},
          markers: [],
          strategy_fingerprint: { "strategy-a": { hash: "hash-a", sha: 456 } },
        },
      }),
    ).toThrow(IntentionSchemaError);
  });

  it("rejects a strategy_fingerprint that is neither string, object, nor null", () => {
    expect(() =>
      validateNode({
        id: "n1-fp-array",
        kind: "tactic",
        statement: "Array fingerprint is not a valid stamp.",
        owner: "ai",
        status: "raw",
        execution: {
          branch: "b",
          pr: null,
          attempts: {},
          markers: [],
          strategy_fingerprint: ["nope"],
        },
      }),
    ).toThrow(/Expected string, object, or null for execution.strategy_fingerprint/);
  });

  it("rejects a phase that is not one of the enum", () => {
    expect(() =>
      validateNode({
        id: "n1-badphase",
        kind: "tactic",
        statement: "Bad phase.",
        owner: "ai",
        status: "raw",
        phase: "shipping",
      }),
    ).toThrow();
  });

  it("accepts the main-qa phase", () => {
    const result = validateNode({
      id: "n1-main-qa",
      kind: "tactic",
      statement: "A tactic in post-merge main-qa verification.",
      owner: "ai",
      status: "codified",
      phase: "main-qa",
    });
    expect(result.phase).toBe("main-qa");
  });

  it("rejects an execution with a non-object attempts", () => {
    expect(() =>
      validateNode({
        id: "n1-badattempts",
        kind: "tactic",
        statement: "Bad attempts.",
        owner: "ai",
        status: "raw",
        execution: { branch: "b", pr: null, attempts: ["nope"], markers: [], strategy_fingerprint: null },
      }),
    ).toThrow();
  });

  it("rejects an execution with a non-numeric attempt count", () => {
    expect(() =>
      validateNode({
        id: "n1-badcount",
        kind: "tactic",
        statement: "Bad attempt count.",
        owner: "ai",
        status: "raw",
        execution: { branch: "b", pr: null, attempts: { qa: "two" }, markers: [], strategy_fingerprint: null },
      }),
    ).toThrow();
  });

  it("rejects an execution with a negative or non-integer attempt count", () => {
    const base = {
      id: "n1-fracattempts",
      kind: "tactic",
      statement: "Non-integer attempt count.",
      owner: "ai",
      status: "raw",
    };
    expect(() =>
      validateNode({
        ...base,
        execution: { branch: "b", pr: null, attempts: { qa: 1.5 }, markers: [], strategy_fingerprint: null },
      }),
    ).toThrow(/non-negative integer for execution.attempts.qa/);
    expect(() =>
      validateNode({
        ...base,
        execution: { branch: "b", pr: null, attempts: { qa: -1 }, markers: [], strategy_fingerprint: null },
      }),
    ).toThrow(/non-negative integer for execution.attempts.qa/);
  });

  it("rejects an execution with a negative or non-integer pr number", () => {
    const base = {
      id: "n1-badpr",
      kind: "tactic",
      statement: "Bad pr number.",
      owner: "ai",
      status: "raw",
    };
    expect(() =>
      validateNode({
        ...base,
        execution: { branch: "b", pr: -3, attempts: {}, markers: [], strategy_fingerprint: null },
      }),
    ).toThrow(/non-negative integer for execution.pr/);
    expect(() =>
      validateNode({
        ...base,
        execution: { branch: "b", pr: 4.2, attempts: {}, markers: [], strategy_fingerprint: null },
      }),
    ).toThrow(/non-negative integer for execution.pr/);
  });

  it("rejects an execution missing branch", () => {
    expect(() =>
      validateNode({
        id: "n1-nobranch",
        kind: "tactic",
        statement: "No branch.",
        owner: "ai",
        status: "raw",
        execution: { pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
      }),
    ).toThrow();
  });

  it("rejects an office_hours missing since", () => {
    expect(() =>
      validateNode({
        id: "n1-noh",
        kind: "tactic",
        statement: "Office hours missing since.",
        owner: "ai",
        status: "raw",
        office_hours: { reason: "parked" },
      }),
    ).toThrow();
  });

  it("defaults office_hours.recommendation to null when omitted", () => {
    const result = validateNode({
      id: "n1-oh-norec",
      kind: "tactic",
      statement: "Office hours without a recommendation.",
      owner: "ai",
      status: "raw",
      office_hours: { reason: "parked", since: "2026-07-06" },
    });
    expect(result.office_hours).toEqual({
      reason: "parked",
      since: "2026-07-06",
      recommendation: null,
      session_type: "other",
    });
  });

  it("accepts an explicit null office_hours.recommendation", () => {
    const result = validateNode({
      id: "n1-oh-nullrec",
      kind: "tactic",
      statement: "Office hours with explicit null recommendation.",
      owner: "ai",
      status: "raw",
      office_hours: { reason: "parked", since: "2026-07-06", recommendation: null },
    });
    expect(result.office_hours?.recommendation).toBeNull();
  });

  it("rejects a non-string office_hours.recommendation", () => {
    expect(() =>
      validateNode({
        id: "n1-oh-badrec",
        kind: "tactic",
        statement: "Office hours with a non-string recommendation.",
        owner: "ai",
        status: "raw",
        office_hours: { reason: "parked", since: "2026-07-06", recommendation: 42 },
      }),
    ).toThrow();
  });

  it("rejects an office_hours.since that is not a YYYY-MM-DD date string", () => {
    const base = {
      id: "n1-badsince",
      kind: "tactic",
      statement: "Office hours with a malformed since.",
      owner: "ai",
      status: "raw",
    };
    for (const since of ["July 3, 2026", "2026-7-3", "2026-07-03T12:00:00Z", ""]) {
      expect(() => validateNode({ ...base, office_hours: { reason: "parked", since } })).toThrow(
        /YYYY-MM-DD date string for office_hours.since/,
      );
    }
  });

  it("accepts each of the three office_hours.session_type enum values", () => {
    for (const sessionType of ["requirement-discovery", "curriculum-review", "other"]) {
      const result = validateNode({
        id: `n1-oh-type-${sessionType}`,
        kind: "tactic",
        statement: "Office hours with an explicit session_type.",
        owner: "ai",
        status: "raw",
        office_hours: { reason: "parked", since: "2026-07-06", session_type: sessionType },
      });
      expect(result.office_hours?.session_type).toBe(sessionType);
    }
  });

  it("defaults office_hours.session_type to other when omitted", () => {
    const result = validateNode({
      id: "n1-oh-notype",
      kind: "tactic",
      statement: "Office hours without a session_type.",
      owner: "ai",
      status: "raw",
      office_hours: { reason: "parked", since: "2026-07-06" },
    });
    expect(result.office_hours?.session_type).toBe("other");
  });

  it("rejects an unknown office_hours.session_type", () => {
    expect(() =>
      validateNode({
        id: "n1-oh-badtype",
        kind: "tactic",
        statement: "Office hours with an unknown session_type.",
        owner: "ai",
        status: "raw",
        office_hours: { reason: "parked", since: "2026-07-06", session_type: "workshop" },
      }),
    ).toThrow();
  });

  it("rejects a rounds with a negative or non-integer count", () => {
    const base = {
      id: "n1-fracrounds",
      kind: "strategy",
      statement: "Non-integer rounds count.",
      owner: "ai",
      status: "raw",
    };
    expect(() =>
      validateNode({ ...base, rounds: { count: 2.5, last_completed: null } }),
    ).toThrow(/non-negative integer for rounds.count/);
    expect(() =>
      validateNode({ ...base, rounds: { count: -1, last_completed: null } }),
    ).toThrow(/non-negative integer for rounds.count/);
  });

  it("rejects a rounds with a non-numeric count", () => {
    expect(() =>
      validateNode({
        id: "n1-badrounds",
        kind: "strategy",
        statement: "Bad rounds count.",
        owner: "ai",
        status: "raw",
        rounds: { count: "3", last_completed: null },
      }),
    ).toThrow();
  });

  it("rejects a non-boolean pace_exempt", () => {
    expect(() =>
      validateNode({
        id: "n1-badpace",
        kind: "tactic",
        statement: "Bad pace_exempt.",
        owner: "ai",
        status: "raw",
        pace_exempt: "yes",
      }),
    ).toThrow();
  });

  it("rejects a validates that is not a string array", () => {
    expect(() =>
      validateNode({
        id: "n1-badval",
        kind: "tactic",
        statement: "Bad validates.",
        owner: "ai",
        status: "raw",
        validates: [1, 2],
      }),
    ).toThrow();
  });

  it("rejects a superseded_by that is not a string array", () => {
    expect(() =>
      validateNode({
        id: "n1-badsup",
        kind: "tactic",
        statement: "Bad superseded_by.",
        owner: "ai",
        status: "raw",
        superseded_by: "tactic-new",
      }),
    ).toThrow();
    expect(() =>
      validateNode({
        id: "n1-badsup2",
        kind: "tactic",
        statement: "Bad superseded_by entries.",
        owner: "ai",
        status: "raw",
        superseded_by: [1, 2],
      }),
    ).toThrow();
  });

  it("rejects a supersession_expiry that is not a string", () => {
    expect(() =>
      validateNode({
        id: "n1-badexp",
        kind: "tactic",
        statement: "Bad supersession_expiry.",
        owner: "ai",
        status: "raw",
        supersession_expiry: 42,
      }),
    ).toThrow();
  });

  it("round-trips a populated superseded_by and supersession_expiry", () => {
    const result = validateNode({
      id: "n1-sup",
      kind: "tactic",
      statement: "A superseded tactic.",
      owner: "ai",
      status: "raw",
      superseded_by: ["tactic-new", "tactic-newer"],
      supersession_expiry: "merge or closure of PR #42",
    });
    expect(result.superseded_by).toEqual(["tactic-new", "tactic-newer"]);
    expect(result.supersession_expiry).toBe("merge or closure of PR #42");
  });

  it("accepts a valid minimal node and applies defaults", () => {
    const result = validateNode({
      id: "n2",
      kind: "tactic",
      statement: "Minimal.",
      owner: "ai",
      status: "raw",
    });
    expect(result).toEqual({
      id: "n2",
      kind: "tactic",
      statement: "Minimal.",
      owner: "ai",
      status: "raw",
      parent: null,
      serves: [],
      recovers: [],
      rationale: null,
      reading: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
      attention: null,
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      superseded_by: [],
      supersession_expiry: null,
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
    });
  });

  it("rejects a node missing a required field", () => {
    expect(() =>
      validateNode({ id: "n3", kind: "tactic", owner: "human", status: "raw" }),
    ).toThrow();
  });

  it("rejects a node missing kind", () => {
    expect(() =>
      validateNode({ id: "n3b", statement: "No kind.", owner: "human", status: "raw" }),
    ).toThrow();
  });

  it("rejects an empty-string kind", () => {
    expect(() =>
      validateNode({ id: "n3c", kind: "", statement: "Empty kind.", owner: "human", status: "raw" }),
    ).toThrow();
  });

  it("accepts any non-empty status string (status is not a central enum)", () => {
    const result = validateNode({
      id: "n3d",
      kind: "tactic",
      statement: "Custom kind-specific status.",
      owner: "human",
      status: "anything-nonempty",
    });
    expect(result.status).toBe("anything-nonempty");
  });

  it("rejects an empty-string status", () => {
    expect(() =>
      validateNode({
        id: "n3e",
        kind: "tactic",
        statement: "Empty status.",
        owner: "human",
        status: "",
      }),
    ).toThrow(/status must be a non-empty string/);
  });

  it("rejects a bad enum value", () => {
    expect(() =>
      validateNode({
        id: "n4",
        kind: "tactic",
        statement: "Bad owner.",
        owner: "robot",
        status: "raw",
      }),
    ).toThrow();
  });

  it("rejects a tooling_goal with a bad kind", () => {
    expect(() =>
      validateNode({
        id: "n5",
        kind: "tactic",
        statement: "Bad tooling kind.",
        owner: "human",
        status: "raw",
        tooling_goals: [{ kind: "lever", statement: "x" }],
      }),
    ).toThrow();
  });

  it("rejects a tooling_goal that is a bare string", () => {
    expect(() =>
      validateNode({
        id: "n6",
        kind: "tactic",
        statement: "Old format.",
        owner: "human",
        status: "raw",
        tooling_goals: ["bare-string"],
      }),
    ).toThrow();
  });

  it("rejects a tooling_goal with missing statement", () => {
    expect(() =>
      validateNode({
        id: "n7",
        kind: "tactic",
        statement: "Missing statement.",
        owner: "human",
        status: "raw",
        tooling_goals: [{ kind: "actuator" }],
      }),
    ).toThrow();
  });

  it("accepts the canonical sparse per-tier boosts map", () => {
    const result = validateNode({
      id: "n8a",
      kind: "strategy",
      statement: "Boosted in two tiers.",
      owner: "human",
      status: "raw",
      attention: { boosts: { "1": 3, "2": 20 }, rationale: "urgent" },
    });
    // Sparse: tier 3 is absent, NOT defaulted to 0.
    expect(result.attention).toEqual({ boosts: { "1": 3, "2": 20 }, rationale: "urgent" });
  });

  it("normalizes number boosts keys to string keys", () => {
    const result = validateNode({
      id: "n8a2",
      kind: "strategy",
      statement: "Number keys from a JS/JSON parse path.",
      owner: "human",
      status: "raw",
      attention: { boosts: { 1: 3, 2: 20 }, rationale: "urgent" },
    });
    expect(result.attention).toEqual({ boosts: { "1": 3, "2": 20 }, rationale: "urgent" });
  });

  it("reinterprets a legacy untagged boost as a tier-1 claim", () => {
    const result = validateNode({
      id: "n8b",
      kind: "strategy",
      statement: "Legacy boost.",
      owner: "human",
      status: "raw",
      attention: { boost: 3, rationale: "urgent" },
    });
    expect(result.attention).toEqual({ boosts: { "1": 3 }, rationale: "urgent" });
  });

  it("reinterprets a legacy tier-tagged boost as a claim in that tier", () => {
    const result = validateNode({
      id: "n8b2",
      kind: "strategy",
      statement: "Legacy tagged boost.",
      owner: "human",
      status: "raw",
      attention: { boost: 5, tier: 2, rationale: "urgent" },
    });
    expect(result.attention).toEqual({ boosts: { "2": 5 }, rationale: "urgent" });
  });

  it("reinterprets a legacy positive override as a plain claim in its tier", () => {
    const result = validateNode({
      id: "n8c",
      kind: "strategy",
      statement: "Legacy override.",
      owner: "human",
      status: "raw",
      attention: { override: 60, tier: 3, rationale: "capped" },
    });
    expect(result.attention).toEqual({ boosts: { "3": 60 }, rationale: "capped" });
  });

  // `override: 0` must NOT canonicalize to `{boosts: {}}`: the empty map is not
  // a writable shape (the next test rejects it on read), so accepting it here
  // would mint a node that `writeNode` emits and `readNode` can no longer load.
  it("rejects a legacy override: 0 rather than minting an unreadable empty map", () => {
    expect(() =>
      validateNode({
        id: "n8c2",
        kind: "strategy",
        statement: "Legacy zeroed branch.",
        owner: "human",
        status: "raw",
        attention: { override: 0, rationale: "parked" },
      }),
    ).toThrow(/override must be > 0, got 0 — the legacy "zero this branch" spelling/);
  });

  it("rejects a negative legacy override", () => {
    expect(() =>
      validateNode({
        id: "n8c3",
        kind: "strategy",
        statement: "Legacy negative override.",
        owner: "human",
        status: "raw",
        attention: { override: -1, rationale: "parked" },
      }),
    ).toThrow(/override must be > 0, got -1/);
  });

  it("rejects a non-null attention whose boosts map is empty", () => {
    expect(() =>
      validateNode({
        id: "n8d",
        kind: "strategy",
        statement: "Empty boosts.",
        owner: "human",
        status: "raw",
        attention: { boosts: {}, rationale: "r" },
      }),
    ).toThrow(/must claim at least one tier/);
  });

  it("rejects an attention block that claims nothing at all", () => {
    expect(() =>
      validateNode({
        id: "n8d2",
        kind: "strategy",
        statement: "No boosts key at all.",
        owner: "human",
        status: "raw",
        attention: { rationale: "r" },
      }),
    ).toThrow(/must claim at least one tier/);
  });

  it("rejects a boost value of 0", () => {
    expect(() =>
      validateNode({
        id: "n8e",
        kind: "strategy",
        statement: "Zero boost.",
        owner: "human",
        status: "raw",
        attention: { boosts: { "1": 0 }, rationale: "r" },
      }),
    ).toThrow(/boosts\[1\] must be > 0/);
  });

  it("rejects a negative boost value", () => {
    expect(() =>
      validateNode({
        id: "n8f",
        kind: "strategy",
        statement: "Negative boost.",
        owner: "human",
        status: "raw",
        attention: { boosts: { "1": -1 }, rationale: "r" },
      }),
    ).toThrow(/boosts\[1\] must be > 0/);
  });

  it("rejects a non-finite boost value", () => {
    expect(() =>
      validateNode({
        id: "n8g",
        kind: "strategy",
        statement: "Infinite boost.",
        owner: "human",
        status: "raw",
        attention: { boosts: { "1": Number.POSITIVE_INFINITY }, rationale: "r" },
      }),
    ).toThrow(/Expected finite number for attention\.boosts\[1\]/);
  });

  it("rejects a boosts key outside the tier vocabulary", () => {
    expect(() =>
      validateNode({
        id: "n8h",
        kind: "strategy",
        statement: "Bogus tier key.",
        owner: "human",
        status: "raw",
        attention: { boosts: { "4": 3 }, rationale: "r" },
      }),
    ).toThrow(/boosts key must be one of 1, 2, 3/);
  });

  it("rejects a legacy tier tag outside the tier vocabulary", () => {
    expect(() =>
      validateNode({
        id: "n9a",
        kind: "strategy",
        statement: "Bogus legacy tier tag.",
        owner: "human",
        status: "raw",
        attention: { boost: 3, tier: 4, rationale: "r" },
      }),
    ).toThrow(/tier must be one of 1, 2, 3/);
  });

  it("rejects an attention missing a rationale", () => {
    expect(() =>
      validateNode({
        id: "n9b",
        kind: "strategy",
        statement: "No rationale.",
        owner: "human",
        status: "raw",
        attention: { boosts: { "1": 1 } },
      }),
    ).toThrow();
  });

  it("rejects an attention with an empty-string rationale", () => {
    expect(() =>
      validateNode({
        id: "n9c",
        kind: "strategy",
        statement: "Empty rationale.",
        owner: "human",
        status: "raw",
        attention: { boosts: { "1": 1 }, rationale: "" },
      }),
    ).toThrow(/rationale must be a non-empty string/);
  });
});

describe("validateGraph", () => {
  /** Build a full IntentionNode fixture for graph-level tests. */
  function gnode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
    return {
      id: partial.id,
      kind: partial.kind,
      statement: partial.statement ?? `Statement for ${partial.id}`,
      owner: partial.owner ?? "human",
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
      // Default status_vocabulary covers the "raw"/"codified" statuses these
      // fixtures use, so kind-node fixtures satisfy rule 16 (every node's
      // status must be a key in its kind node's status_vocabulary) without
      // every test needing to declare one explicitly. Tests that need to
      // exercise rule 16 itself pass their own `attributes` to override this.
      attributes: partial.attributes ?? {
        status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
      },
    };
  }

  it("passes on a self-consistent node set (kind-kind satisfies its own kind check)", () => {
    const nodes = [
      // kind-kind is itself of kind "kind", so it satisfies its own kind check.
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: {
          goal_layer: true,
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
        },
      }),
      gnode({ id: "kind-delegation", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue", status: "codified", parent: null }),
      gnode({ id: "delegation-1", kind: "delegation" }),
      gnode({
        id: "strategy-1",
        kind: "strategy",
        serves: ["virtue-root"],
        recovers: ["delegation-1"],
        attention: {
          boosts: { "1": 3 },
          rationale: "A live strategy that draws attention.",
        },
      }),
      gnode({
        id: "tactic-1",
        kind: "tactic",
        parent: null,
        serves: ["strategy-1"],
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a node's kind has no kind-<kind> node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "ghost-1", kind: "ghost" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(/ghost-1.*kind "ghost" has no kind-ghost node/);
  });

  it("throws when a parent does not resolve to a node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-1", kind: "tactic", parent: "virtue-missing" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1.*parent "virtue-missing" does not resolve to a node/,
    );
  });

  it("throws when a serves entry does not resolve to a node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-1", kind: "tactic", serves: ["virtue-missing"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1.*serves "virtue-missing" does not resolve to a node/,
    );
  });

  it("throws when a recovers entry does not resolve to a node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "strategy-1", kind: "strategy", recovers: ["delegation-missing"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1.*recovers "delegation-missing" does not resolve to a node/,
    );
  });

  it("throws when attention is on a node whose kind lacks goal_layer", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      // kind-virtue is present but carries no goal_layer flag, so virtues are
      // not a goal-layer kind and may not carry attention.
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({
        id: "virtue-1",
        kind: "virtue",
        attention: { boosts: { "1": 1 }, rationale: "r" },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(/attention is only valid on goal-layer kinds/);
  });

  it("throws when a parent resolves to a node of a different kind", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "tactic-1", kind: "tactic", parent: "virtue-root" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: parent "virtue-root" has kind "virtue", expected same kind "tactic"/,
    );
  });

  it("passes when a parent resolves to a node of the same kind", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-parent", kind: "tactic" }),
      gnode({ id: "tactic-child", kind: "tactic", parent: "tactic-parent" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a tactic's serves entry resolves to a non-strategy node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "tactic-1", kind: "tactic", serves: ["virtue-root"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: serves "virtue-root" must resolve to a kind "strategy" node, got kind "virtue"/,
    );
  });

  it("passes when a tactic's serves entry resolves to a strategy", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "tactic-1", kind: "tactic", serves: ["strategy-1"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a strategy's serves entry resolves to a non-virtue node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-1", kind: "tactic" }),
      gnode({ id: "strategy-1", kind: "strategy", serves: ["tactic-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: serves "tactic-1" must resolve to a kind "virtue" node, got kind "tactic"/,
    );
  });

  it("passes when a strategy's serves entry resolves to a virtue", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "strategy-1", kind: "strategy", serves: ["virtue-root"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a non-strategy node carries a non-empty recovers", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-delegation", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "delegation-1", kind: "delegation" }),
      gnode({ id: "tactic-1", kind: "tactic", recovers: ["delegation-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: recovers is only valid on kind "strategy" nodes, got kind "tactic"/,
    );
  });

  it("throws when a strategy's recovers entry resolves to a non-delegation node", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "strategy-1", kind: "strategy", recovers: ["virtue-root"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: recovers "virtue-root" must resolve to a kind "delegation" node, got kind "virtue"/,
    );
  });

  it("passes when a strategy's recovers entry resolves to a delegation", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-delegation", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "delegation-1", kind: "delegation" }),
      gnode({ id: "strategy-1", kind: "strategy", recovers: ["delegation-1"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("lists ALL violations in one throw (kind + parent + serves + recovers + attention)", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      // kind-virtue present without goal_layer, so attention on a virtue is a
      // goal-layer violation.
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue" }),
      gnode({ id: "tactic-mismatch", kind: "tactic" }),
      gnode({
        id: "broken-1",
        kind: "ghost",
        parent: "no-such-parent",
        serves: ["no-such-target"],
        recovers: ["no-such-delegation"],
      }),
      gnode({
        id: "broken-2",
        kind: "virtue",
        attention: { boosts: { "1": 1 }, rationale: "r" },
      }),
      // Same-kind-parent violation: a tactic parented to a virtue.
      gnode({ id: "broken-3", kind: "tactic", parent: "virtue-root" }),
      // Tactic-serves-strategy violation: serves a virtue instead.
      gnode({ id: "broken-4", kind: "tactic", serves: ["virtue-root"] }),
      // Strategy-serves-virtue violation: serves a tactic instead.
      gnode({ id: "broken-5", kind: "strategy", serves: ["tactic-mismatch"] }),
      // recovers-on-non-strategy violation.
      gnode({ id: "broken-6", kind: "tactic", recovers: ["broken-2"] }),
      // recovers-target-not-delegation violation.
      gnode({ id: "broken-7", kind: "strategy", recovers: ["virtue-root"] }),
    ];
    let caught: unknown;
    try {
      validateGraph(nodes);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    if (!(caught instanceof Error)) throw new Error("unreachable");
    expect(caught.message).toContain('kind "ghost" has no kind-ghost node');
    expect(caught.message).toContain('parent "no-such-parent" does not resolve to a node');
    expect(caught.message).toContain('serves "no-such-target" does not resolve to a node');
    expect(caught.message).toContain('recovers "no-such-delegation" does not resolve to a node');
    expect(caught.message).toContain("attention is only valid on goal-layer kinds");
    expect(caught.message).toContain(
      'broken-3: parent "virtue-root" has kind "virtue", expected same kind "tactic"',
    );
    expect(caught.message).toContain(
      'broken-4: serves "virtue-root" must resolve to a kind "strategy" node, got kind "virtue"',
    );
    expect(caught.message).toContain(
      'broken-5: serves "tactic-mismatch" must resolve to a kind "virtue" node, got kind "tactic"',
    );
    expect(caught.message).toContain(
      'broken-6: recovers is only valid on kind "strategy" nodes, got kind "tactic"',
    );
    expect(caught.message).toContain(
      'broken-7: recovers "virtue-root" must resolve to a kind "delegation" node, got kind "virtue"',
    );
  });

  // --- Graph-native dispatch layer rules -----------------------------------

  /** Base kind nodes shared by the dispatch-rule fixtures below. */
  function kindNodes(): IntentionNode[] {
    return [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: {
          goal_layer: true,
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
        },
      }),
      gnode({
        id: "kind-tactic",
        kind: "kind",
        status: "codified",
        attributes: {
          goal_layer: true,
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
        },
      }),
    ];
  }

  it("throws when phase is set on a non-tactic", () => {
    const nodes = [...kindNodes(), gnode({ id: "strategy-1", kind: "strategy", phase: "qa" })];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: phase is only valid on kind "tactic" nodes, got kind "strategy"/,
    );
  });

  it("throws when execution is set on a non-tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({
        id: "strategy-1",
        kind: "strategy",
        execution: { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint: null },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: execution is only valid on kind "tactic" nodes/,
    );
  });

  it("throws when blocked_by is set on a non-tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic" }),
      gnode({ id: "strategy-1", kind: "strategy", blocked_by: ["tactic-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-1: blocked_by is only valid on kind "tactic" nodes/,
    );
  });

  it("throws when validates is set on a non-tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "virtue-1", kind: "virtue", validates: ["strategy-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /virtue-1: validates is only valid on kind "tactic" nodes/,
    );
  });

  it("passes when phase/execution/blocked_by/validates sit on tactics", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "tactic-blocker", kind: "tactic" }),
      gnode({
        id: "tactic-1",
        kind: "tactic",
        phase: "implement",
        execution: { branch: "b", pr: 1, attempts: { implement: 1 }, markers: [], strategy_fingerprint: null },
        blocked_by: ["tactic-blocker"],
        validates: ["strategy-1"],
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when office_hours is on a node whose kind lacks goal_layer", () => {
    const nodes = [
      ...kindNodes(),
      gnode({
        id: "virtue-1",
        kind: "virtue",
        office_hours: { reason: "parked", since: "2026-07-03", recommendation: null, session_type: "other" },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /virtue-1: office_hours is only valid on goal-layer kinds/,
    );
  });

  it("throws when pace_exempt is true on a node whose kind lacks goal_layer", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "virtue-1", kind: "virtue", pace_exempt: true }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /virtue-1: pace_exempt is only valid on goal-layer kinds/,
    );
  });

  it("passes when office_hours/pace_exempt sit on a goal-layer kind (strategy)", () => {
    const nodes = [
      ...kindNodes(),
      gnode({
        id: "strategy-1",
        kind: "strategy",
        office_hours: { reason: "awaiting input", since: "2026-07-03", recommendation: null, session_type: "other" },
        pace_exempt: true,
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when rounds is set on a non-strategy", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic", rounds: { count: 1, last_completed: null, last_aligned: null } }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: rounds is only valid on kind "strategy" nodes, got kind "tactic"/,
    );
  });

  it("passes when rounds sits on a strategy", () => {
    const nodes = [
      ...kindNodes(),
      gnode({
        id: "strategy-1",
        kind: "strategy",
        rounds: { count: 2, last_completed: "2026-07-01", last_aligned: null },
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a blocked_by entry does not resolve to a node", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic", blocked_by: ["tactic-missing"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: blocked_by "tactic-missing" does not resolve to a node/,
    );
  });

  it("throws when a blocked_by entry resolves to a non-tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "tactic-1", kind: "tactic", blocked_by: ["strategy-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: blocked_by "strategy-1" must resolve to a kind "tactic" node, got kind "strategy"/,
    );
  });

  it("passes when a blocked_by entry resolves to a tactic", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic" }),
      gnode({ id: "tactic-2", kind: "tactic", blocked_by: ["tactic-1"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a validates entry does not resolve to a node", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-1", kind: "tactic", validates: ["strategy-missing"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: validates "strategy-missing" does not resolve to a node/,
    );
  });

  it("throws when a validates entry resolves to a non-strategy", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "virtue-1", kind: "virtue" }),
      gnode({ id: "tactic-1", kind: "tactic", validates: ["virtue-1"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: validates "virtue-1" must resolve to a kind "strategy" node, got kind "virtue"/,
    );
  });

  it("passes when a validates entry resolves to a strategy", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "strategy-1", kind: "strategy" }),
      gnode({ id: "tactic-1", kind: "tactic", validates: ["strategy-1"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws on a blocked_by cycle (including a self-loop)", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-a", kind: "tactic", blocked_by: ["tactic-b"] }),
      gnode({ id: "tactic-b", kind: "tactic", blocked_by: ["tactic-a"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(/blocked_by forms a cycle/);
  });

  it("throws on a direct blocked_by self-loop", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-a", kind: "tactic", blocked_by: ["tactic-a"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-a: blocked_by forms a cycle/,
    );
  });

  it("passes on a blocked_by chain with no cycle", () => {
    const nodes = [
      ...kindNodes(),
      gnode({ id: "tactic-a", kind: "tactic", blocked_by: ["tactic-b"] }),
      gnode({ id: "tactic-b", kind: "tactic", blocked_by: ["tactic-c"] }),
      gnode({ id: "tactic-c", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  // --- Rule 16: status must be a key in the kind node's status_vocabulary --

  it("passes when a node's status is a key in its kind node's status_vocabulary", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-tactic",
        kind: "kind",
        status: "codified",
        attributes: { status_vocabulary: { codified: "Complete." } },
      }),
      gnode({ id: "tactic-1", kind: "tactic", status: "codified" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when a node's status is not declared in its kind node's status_vocabulary", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-tactic",
        kind: "kind",
        status: "codified",
        attributes: { status_vocabulary: { codified: "Complete." } },
      }),
      gnode({ id: "tactic-1", kind: "tactic", status: "raw" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: status "raw" is not declared in kind-tactic's status_vocabulary/,
    );
  });

  it("throws when a kind node has no attributes.status_vocabulary declared", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified", attributes: {} }),
      gnode({ id: "tactic-1", kind: "tactic", status: "raw" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: kind-tactic has no attributes\.status_vocabulary declared/,
    );
  });

  // Rule 17: clarifications[].answer must carry a dated provenance clause.
  it("accepts a dated clarification regardless of date placement (front, trailing, mid)", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({
        id: "tactic-1",
        kind: "tactic",
        clarifications: [
          { question: "front-loaded?", answer: "(Recorded 2026-07-05 by author) settled." },
          { question: "trailing?", answer: "Settled the scope. Recorded 2026-07-05." },
          { question: "mid-sentence?", answer: "On 2026-07-05 the author ratified this." },
        ],
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("rejects a dateless clarification, naming the node id and clarification index", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({
        id: "tactic-1",
        kind: "tactic",
        clarifications: [
          { question: "dated?", answer: "Recorded 2026-07-05." },
          { question: "dateless?", answer: "No date anywhere in this answer." },
        ],
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-1: clarifications\[1\]\.answer carries no dated provenance clause/,
    );
  });

  it("passes a node with an empty clarifications array (the gnode default)", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-1", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("accumulates all dateless clarifications across nodes into one thrown error", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({
        id: "tactic-1",
        kind: "tactic",
        clarifications: [{ question: "q", answer: "No date here." }],
      }),
      gnode({
        id: "virtue-1",
        kind: "virtue",
        clarifications: [{ question: "q", answer: "Also no date." }],
      }),
    ];
    let caught: unknown;
    try {
      validateGraph(nodes);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    if (!(caught instanceof Error)) throw new Error("unreachable");
    expect(caught.message).toMatch(/tactic-1: clarifications\[0\]\.answer carries no dated provenance clause/);
    expect(caught.message).toMatch(/virtue-1: clarifications\[0\]\.answer carries no dated provenance clause/);
  });

  // Rule 18: strategy-main-health owns tier 3 exclusively.

  /**
   * Build a minimal goal-layer node set with `strategy-main-health` (holding
   * `attributes.tier: 3` by default) and a sibling `strategy-other` carrying
   * `sibling`'s fields. Pass `mainHealth: null` to omit strategy-main-health
   * from the set entirely (exercises the inert path), or override its own
   * fields to exercise the "must hold tier 3" half.
   */
  function mainHealthNodes(
    sibling: Partial<IntentionNode> = {},
    opts: { mainHealth?: Partial<IntentionNode> | null } = {},
  ): IntentionNode[] {
    const mh: Partial<IntentionNode> | null =
      "mainHealth" in opts ? opts.mainHealth ?? null : { attributes: { tier: 3 } };
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: {
          goal_layer: true,
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
        },
      }),
      gnode({ id: "strategy-other", kind: "strategy", ...sibling }),
    ];
    if (mh !== null) {
      nodes.push(gnode({ id: "strategy-main-health", kind: "strategy", ...mh }));
    }
    return nodes;
  }

  it("Rule 18: throws when another node authors an explicit attributes.tier: 3", () => {
    const nodes = mainHealthNodes({ attributes: { tier: 3 } });
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-other: authors attributes\.tier: 3, the tier reserved for strategy-main-health/,
    );
  });

  it("Rule 18: passes when the tier-3 author opts out via ACK: main-health-dominance in rationale", () => {
    const nodes = mainHealthNodes({
      attributes: { tier: 3 },
      rationale: "Deliberately co-dominant. ACK: main-health-dominance",
    });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 18: passes when the ACK lives in attention.rationale instead", () => {
    const nodes = mainHealthNodes({
      attributes: { tier: 3 },
      attention: {
        boosts: { "3": 5 },
        rationale: "Deliberately co-dominant. ACK: main-health-dominance",
      },
    });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 18: passes for a sibling authoring attributes.tier: 2 (only tier 3 is reserved)", () => {
    const nodes = mainHealthNodes({ attributes: { tier: 2 } });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 18: throws when strategy-main-health is present without attributes.tier: 3", () => {
    const nodes = mainHealthNodes({}, { mainHealth: {} });
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-main-health: must author attributes\.tier: 3/,
    );
  });

  it("Rule 18: strategy-main-health's own rationale narrating the ACK does not exempt it", () => {
    // The landed node's rationale describes this very guard, quoting the token.
    // Descriptive prose must not self-exempt the node from the must-hold half.
    const nodes = mainHealthNodes(
      {},
      {
        mainHealth: {
          rationale:
            "2026-07-31: no other node may author an explicit attributes.tier: 3, and this node must keep it, unless the commit carries the ACK: main-health-dominance override.",
        },
      },
    );
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-main-health: must author attributes\.tier: 3/,
    );
  });

  it("Rule 18: strategy-main-health opts out of the must-hold half via attention.rationale", () => {
    const nodes = mainHealthNodes(
      {},
      {
        mainHealth: {
          attention: {
            boosts: { "1": 5 },
            rationale: "Deliberately demoted. ACK: main-health-dominance",
          },
        },
      },
    );
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 18: is inert when strategy-main-health is absent from the node set", () => {
    const nodes = mainHealthNodes({ attributes: { tier: 2 } }, { mainHealth: null });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 18: strategy-main-health's own attributes.tier: 3 does not self-trip the authorship half", () => {
    const nodes = mainHealthNodes();
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  // Rule 19: tier-mark shape. (Rule 20, the per-tier boost namespace check, is
  // retired — attention now carries a per-tier boosts map with no namespace tag
  // to cross-check.)

  /** A goal-layer kind set plus one strategy carrying the fields under test. */
  function tierNodes(partial: Partial<IntentionNode>): IntentionNode[] {
    return [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: {
          goal_layer: true,
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
        },
      }),
      gnode({ id: "strategy-under-test", kind: "strategy", ...partial }),
    ];
  }

  it("Rule 19: rejects a non-boolean attributes.bug_fix", () => {
    const nodes = tierNodes({ attributes: { bug_fix: "yes" } });
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-under-test: attributes\.bug_fix must be a boolean, got string/,
    );
  });

  it("Rule 19: rejects an explicit attributes.tier: 1 (1 is the implicit default)", () => {
    const nodes = tierNodes({ attributes: { tier: 1 } });
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-under-test: attributes\.tier must be 2 or 3, got 1 — tier 1 is the implicit default/,
    );
  });

  it("Rule 19: rejects an out-of-range attributes.tier: 4", () => {
    const nodes = tierNodes({ attributes: { tier: 4 } });
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-under-test: attributes\.tier must be 2 or 3, got 4/,
    );
  });

  it("accepts a tier-marked node whose boosts claim a tier other than its own", () => {
    // Retired rule 20 would have rejected this: the node's own tier is 2 (via
    // bug_fix) while its only claim sits in tier 1. With the per-tier map the
    // two are independent — a node may claim attention in any tier's scale.
    const nodes = tierNodes({
      attributes: { bug_fix: true },
      attention: { boosts: { "1": 5 }, rationale: "hot" },
    });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("accepts a tier-marked node claiming several tiers at once", () => {
    const nodes = tierNodes({
      attributes: { bug_fix: true },
      attention: { boosts: { "1": 5, "2": 40 }, rationale: "hot" },
    });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("accepts a marked node with no attention at all", () => {
    const nodes = tierNodes({ attributes: { bug_fix: true, security: true }, attention: null });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  // Rule 21: attributes.measured_impact shape.

  /** A well-formed measurement record, the base every rule-21 fixture mutates. */
  const measurement = {
    metric: "recurrence_count",
    value: 4,
    unit: "occurrences",
    window: "7d",
    sensor: "token-economy-sensor",
    measured: "2026-08-12",
  };

  /** A goal-layer kind set plus one strategy carrying `measured_impact`. */
  function impactNodes(measured_impact: unknown): IntentionNode[] {
    return tierNodes({ attributes: { measured_impact } });
  }

  it("Rule 21: accepts an array of well-formed measurement records", () => {
    const nodes = impactNodes([
      measurement,
      { ...measurement, metric: "recoverable_tokens", value: 12_500.5, unit: "tokens" },
    ]);
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 21: is inert when the key is absent, and accepts an empty list", () => {
    expect(() => validateGraph(tierNodes({ attributes: {} }))).not.toThrow();
    expect(() => validateGraph(impactNodes([]))).not.toThrow();
  });

  it("Rule 21: rejects a non-array measured_impact", () => {
    expect(() => validateGraph(impactNodes(measurement))).toThrow(
      /strategy-under-test: attributes\.measured_impact must be an array of measurement records, got object/,
    );
    expect(() => validateGraph(impactNodes(null))).toThrow(
      /attributes\.measured_impact must be an array of measurement records, got null/,
    );
  });

  it("Rule 21: rejects a non-record entry", () => {
    expect(() => validateGraph(impactNodes(["recurrence_count=4"]))).toThrow(
      /strategy-under-test: attributes\.measured_impact\[0\] must be a \{metric, value, unit, window, sensor, measured\} record, got string/,
    );
  });

  it("Rule 21: rejects a missing or empty string field, naming its index", () => {
    const { sensor: _dropped, ...noSensor } = measurement;
    expect(() => validateGraph(impactNodes([measurement, noSensor]))).toThrow(
      /strategy-under-test: attributes\.measured_impact\[1\]\.sensor must be a non-empty string, got undefined/,
    );
    expect(() => validateGraph(impactNodes([{ ...measurement, metric: "   " }]))).toThrow(
      /attributes\.measured_impact\[0\]\.metric must be a non-empty string, got "   "/,
    );
  });

  it("Rule 21: rejects a non-finite or non-numeric value", () => {
    expect(() => validateGraph(impactNodes([{ ...measurement, value: "4" }]))).toThrow(
      /attributes\.measured_impact\[0\]\.value must be a finite number, got "4"/,
    );
    expect(() =>
      validateGraph(impactNodes([{ ...measurement, value: Number.POSITIVE_INFINITY }])),
    ).toThrow(/attributes\.measured_impact\[0\]\.value must be a finite number/);
  });

  it("Rule 21: rejects a measured date that is not YYYY-MM-DD", () => {
    expect(() =>
      validateGraph(impactNodes([{ ...measurement, measured: "August 12 2026" }])),
    ).toThrow(
      /attributes\.measured_impact\[0\]\.measured must be a YYYY-MM-DD date, got "August 12 2026"/,
    );
  });

  it("Rule 21: accepts a value of 0 — a measured zero is a measurement", () => {
    expect(() => validateGraph(impactNodes([{ ...measurement, value: 0 }]))).not.toThrow();
  });

  // Rule 22: WAIT-node shape.

  /** The attributes a well-formed WAIT node holding `tactic-source` carries. */
  function waitAttrs(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      wait_for: "tactic-source",
      wait_until: "2026-08-07T00:00:00Z",
      wait_reason: "the deployed behavior has not been observed yet",
      wait_recommendation: "re-check after the next production deploy",
      ...overrides,
    };
  }

  /**
   * A kind set, the held source tactic, and one node under test carrying the
   * WAIT signature. `id` defaults to the canonical `waitIdFor("tactic-source")`.
   */
  function waitNodes(partial: Partial<IntentionNode> = {}): IntentionNode[] {
    return [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: {
          goal_layer: true,
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
        },
      }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified" }),
      gnode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      gnode({ id: "strategy-1", kind: "strategy", serves: ["virtue-root"] }),
      gnode({
        id: "tactic-source",
        kind: "tactic",
        serves: ["strategy-1"],
        blocked_by: ["tactic-wait-source"],
      }),
      gnode({
        id: "tactic-wait-source",
        kind: "tactic",
        serves: ["strategy-1"],
        attributes: waitAttrs(),
        ...partial,
      }),
    ];
  }

  it("Rule 22: accepts a well-formed armed WAIT node", () => {
    expect(() => validateGraph(waitNodes())).not.toThrow();
  });

  it("Rule 22: accepts a released WAIT node (phase done) and one carrying wait_attempts", () => {
    const nodes = waitNodes({ phase: "done", attributes: waitAttrs({ wait_attempts: 2 }) });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 22: is inert on an ordinary tactic with no attributes.wait_for", () => {
    const nodes = waitNodes({
      // No wait_* attributes at all: none of Rule 22's requirements apply.
      attributes: { status_vocabulary: { raw: "Not yet started.", codified: "Complete." } },
      phase: "implement",
    });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 22: is inert on a non-tactic node carrying wait_for (the gate is kind + wait_for)", () => {
    const nodes = waitNodes();
    // A strategy carrying the WAIT signature is not a WAIT node — the rule
    // never fires, so its id mismatch and missing fields go unreported here.
    nodes.push(
      gnode({
        id: "strategy-decoy",
        kind: "strategy",
        serves: ["virtue-root"],
        attributes: { wait_for: "tactic-source" },
      }),
    );
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 22: rejects a non-string attributes.wait_for", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_for: 7 }) });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_for must be a non-empty string/,
    );
  });

  it("Rule 22: rejects an empty attributes.wait_for", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_for: "" }) });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_for must be a non-empty string/,
    );
  });

  it("Rule 22: rejects an id that is not waitIdFor(wait_for)", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_for: "tactic-other" }) });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: a WAIT node's id must equal waitIdFor\(attributes\.wait_for\), which is "tactic-wait-other"/,
    );
  });

  it("Rule 22: reports a wait_for whose derived id fails the node-id slug shape", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_for: "Tactic_Source!" }) }); // type-safety-ok: "!" is inside a string literal test fixture, not a non-null assertion
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_for "Tactic_Source!" does not derive a usable wait id — .*does not match the node-id slug shape/, // type-safety-ok: "!" is inside a regex literal test fixture, not a non-null assertion
    );
  });

  it("Rule 22: rejects a missing attributes.wait_until", () => {
    const attrs = waitAttrs();
    delete attrs.wait_until;
    const nodes = waitNodes({ attributes: attrs });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_until must be an ISO 8601 UTC instant/,
    );
  });

  it("Rule 22: rejects a date-only attributes.wait_until (sub-day precision is required)", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_until: "2026-08-07" }) });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_until must be an ISO 8601 UTC instant/,
    );
  });

  it("Rule 22: rejects a well-shaped but unparseable attributes.wait_until", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_until: "2026-13-45T99:99:99Z" }) });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_until must be an ISO 8601 UTC instant/,
    );
  });

  it("Rule 22: rejects a non-integer attributes.wait_attempts when present", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_attempts: 1.5 }) });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_attempts must be an integer >= 1 when present/,
    );
  });

  it("Rule 22: rejects attributes.wait_attempts: 0 (the counter starts at 1)", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_attempts: 0 }) });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_attempts must be an integer >= 1 when present/,
    );
  });

  it("Rule 22: rejects a missing attributes.wait_reason", () => {
    const attrs = waitAttrs();
    delete attrs.wait_reason;
    const nodes = waitNodes({ attributes: attrs });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_reason must be a non-empty string/,
    );
  });

  it("Rule 22: rejects a missing attributes.wait_recommendation", () => {
    const attrs = waitAttrs();
    delete attrs.wait_recommendation;
    const nodes = waitNodes({ attributes: attrs });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_recommendation must be a non-empty string/,
    );
  });

  it("Rule 22: rejects a ladder phase on a WAIT node", () => {
    const nodes = waitNodes({ phase: "implement" });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: a WAIT node's phase must be null \(armed\) or "done" \(released\), got "implement"/,
    );
  });

  // The horizon bound. arm-wait refuses to WRITE an over-horizon wait; these
  // are what stop a hand-landed one — the node that would be armed once, never
  // come due, never reach WAIT_ATTEMPT_CAP, and hold its source forever.
  /** An instant `ms` beyond the real current time, in WAIT_UNTIL_RE shape. */
  function fromNow(ms: number): string {
    return new Date(Date.now() + ms).toISOString().replace(/\.\d{3}Z$/, "Z");
  }

  it("Rule 22: rejects a wait_until beyond the wait horizon", () => {
    const nodes = waitNodes({
      attributes: waitAttrs({ wait_until: fromNow(WAIT_MAX_HORIZON_MS + 60 * 60 * 1000) }),
    });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_until .* is more than 30 days in the future/,
    );
  });

  it("Rule 22: rejects the degenerate far-future wait_until", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_until: "9999-12-31T23:59:59Z" }) });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_until .* is more than 30 days in the future/,
    );
  });

  it("Rule 22: accepts a wait_until inside the horizon", () => {
    const nodes = waitNodes({
      attributes: waitAttrs({ wait_until: fromNow(24 * 60 * 60 * 1000) }),
    });
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("Rule 22: rejects a wait_until more than the horizon past wait_armed_since", () => {
    // Inside the horizon measured from now, but far past the arming instant:
    // the extend-forever loop, which never increments wait_attempts.
    const nodes = waitNodes({
      attributes: waitAttrs({
        wait_until: fromNow(24 * 60 * 60 * 1000),
        wait_armed_since: new Date(Date.now() - WAIT_MAX_HORIZON_MS - 24 * 60 * 60 * 1000)
          .toISOString()
          .replace(/\.\d{3}Z$/, "Z"),
      }),
    });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_until .* is more than 30 days after attributes\.wait_armed_since/,
    );
  });

  it("Rule 22: rejects a malformed attributes.wait_armed_since when present", () => {
    const nodes = waitNodes({ attributes: waitAttrs({ wait_armed_since: "2026-08-07" }) });
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-wait-source: attributes\.wait_armed_since must be an ISO 8601 UTC instant/,
    );
  });

  it("Rule 22: accepts a WAIT node with no wait_armed_since at all", () => {
    // Waits minted before the field existed stay landable.
    expect(() => validateGraph(waitNodes())).not.toThrow();
  });

  // Rule 23: no attributes key shadows a first-class field (presence, not shape).

  it("Rule 23: rejects the historical attributes.phase squatter, naming the node", () => {
    const nodes = tierNodes({ attributes: { phase: "main-qa" } });
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-under-test: attributes\.phase shadows the first-class phase field — the attributes squatter representation is retired; move the value to the node's own phase field and delete attributes\.phase/,
    );
  });

  it("Rule 23: rejects attributes.execution and attributes.office_hours", () => {
    // The other two keys the retired check-node-selection.ts fallback readers
    // honored. The ban is the whole first-class field set, not just `phase`.
    expect(() =>
      validateGraph(
        tierNodes({
          attributes: {
            execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
          },
        }),
      ),
    ).toThrow(
      /strategy-under-test: attributes\.execution shadows the first-class execution field — the attributes squatter representation is retired; move the value to the node's own execution field and delete attributes\.execution/,
    );
    expect(() =>
      validateGraph(
        tierNodes({
          attributes: { office_hours: { reason: "author park", since: "2026-07-07" } },
        }),
      ),
    ).toThrow(
      /strategy-under-test: attributes\.office_hours shadows the first-class office_hours field — the attributes squatter representation is retired; move the value to the node's own office_hours field and delete attributes\.office_hours/,
    );
  });

  it("Rule 23: rejects EVERY first-class field name under attributes", () => {
    // The forbidden set is derived from the compiler-enforced
    // FIRST_CLASS_FIELD_PROBE, so this walks the schema's own field list rather
    // than a hand-copied one — a field added to IntentionNode is covered here
    // the moment the probe admits it.
    expect(FIRST_CLASS_FIELD_NAMES.length).toBeGreaterThan(0);
    for (const key of FIRST_CLASS_FIELD_NAMES) {
      expect(() => validateGraph(tierNodes({ attributes: { [key]: "x" } }))).toThrow(
        new RegExp(`attributes\\.${key} shadows the first-class ${key} field`),
      );
    }
  });

  it("Rule 23: rejects a shadowing key whatever its value — presence is the violation", () => {
    // null, a non-string, and a well-formed phase string all fail identically:
    // there is no correct way to spell a first-class field under `attributes`.
    for (const value of [null, 42, "implement"]) {
      expect(() => validateGraph(tierNodes({ attributes: { phase: value } }))).toThrow(
        /attributes\.phase shadows the first-class phase field/,
      );
    }
  });

  it("Rule 23: reports every violating key on one node, not just the first", () => {
    let message = "";
    try {
      validateGraph(tierNodes({ attributes: { phase: null, execution: null, rounds: null } }));
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).toMatch(/attributes\.phase shadows the first-class phase field/);
    expect(message).toMatch(/attributes\.execution shadows the first-class execution field/);
    expect(message).toMatch(/attributes\.rounds shadows the first-class rounds field/);
  });

  it("Rule 23: is inert on a node with no shadowing key", () => {
    // Empty attributes and legitimate non-shadowing keys both pass — the rule
    // bans the first-class field names, it does not police `attributes`.
    // `pre_namespacing_boost`, `bug_fix`, `tier` and `measured_impact` are all
    // real keys in the live store's attributes census. (The first-class `phase`
    // field itself is exercised by every tactic fixture in this file; rule 12
    // keeps it off the strategy `tierNodes` builds.)
    expect(() => validateGraph(tierNodes({ attributes: {} }))).not.toThrow();
    expect(() =>
      validateGraph(
        tierNodes({
          attributes: { bug_fix: true, tier: 2, measured_impact: [], pre_namespacing_boost: 40 },
        }),
      ),
    ).not.toThrow();
  });

  // --- Supersession: rules 24 (same-kind target), 25 (no cycles), 26 (expiry) ---

  /**
   * The kind nodes every supersession fixture needs, with a vocabulary that
   * declares `superseded` so rule 16 is satisfied and the rule under test is
   * the one that fires.
   */
  function supersessionKinds(): IntentionNode[] {
    const vocab = {
      status_vocabulary: {
        raw: "Not yet started.",
        codified: "Complete.",
        superseded: "Abandoned; superseded_by names the successor.",
      },
    };
    return [
      gnode({ id: "kind-kind", kind: "kind", status: "codified", attributes: vocab }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified", attributes: vocab }),
      gnode({ id: "kind-virtue", kind: "kind", status: "codified", attributes: vocab }),
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: { goal_layer: true, ...vocab },
      }),
    ];
  }

  it("rule 24: accepts a superseded_by naming a same-kind node", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({ id: "tactic-old", kind: "tactic", superseded_by: ["tactic-new"] }),
      gnode({ id: "tactic-new", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("rule 24: rejects a superseded_by that does not resolve", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({ id: "tactic-old", kind: "tactic", superseded_by: ["tactic-ghost"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-old.*superseded_by "tactic-ghost" does not resolve to a node/,
    );
  });

  it("rule 24: rejects a superseded_by whose target is a different kind", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      gnode({ id: "strategy-successor", kind: "strategy", serves: ["virtue-root"] }),
      gnode({ id: "tactic-old", kind: "tactic", superseded_by: ["strategy-successor"] }),
    ];
    // A tactic superseded by a strategy is not a supersession, it is a
    // re-parenting — the same-kind rule modelled on rule 6's parent-kind check.
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-old.*superseded_by "strategy-successor" must resolve to a kind "tactic" node, got kind "strategy"/,
    );
  });

  it("rule 24 is NOT kind-confined: a superseded strategy passes rule 10", () => {
    // The half of the requirement a tactic-only `phase` terminal could not
    // express. `phase`/`blocked_by`/`validates` are tactic-only; `superseded_by`
    // deliberately is not.
    const nodes = [
      ...supersessionKinds(),
      gnode({ id: "virtue-root", kind: "virtue", status: "codified" }),
      gnode({
        id: "strategy-old",
        kind: "strategy",
        serves: ["virtue-root"],
        status: "superseded",
        superseded_by: ["strategy-new"],
      }),
      gnode({ id: "strategy-new", kind: "strategy", serves: ["virtue-root"] }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("rule 25: rejects self-supersession (the length-1 cycle)", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({ id: "tactic-self", kind: "tactic", superseded_by: ["tactic-self"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-self: superseded_by forms a cycle — a node cannot transitively supersede itself/,
    );
  });

  it("rule 25: rejects a two-node superseded_by cycle", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({ id: "tactic-a", kind: "tactic", superseded_by: ["tactic-b"] }),
      gnode({ id: "tactic-b", kind: "tactic", superseded_by: ["tactic-a"] }),
    ];
    const run = (): void => validateGraph(nodes);
    expect(run).toThrow(/tactic-a: superseded_by forms a cycle/);
    expect(run).toThrow(/tactic-b: superseded_by forms a cycle/);
  });

  it("rule 25: accepts a three-node non-cyclic supersession chain", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({ id: "tactic-a", kind: "tactic", superseded_by: ["tactic-b"] }),
      gnode({ id: "tactic-b", kind: "tactic", superseded_by: ["tactic-c"] }),
      gnode({ id: "tactic-c", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("rule 25 does not confuse the two cycle edges: a blocked_by cycle still names blocked_by", () => {
    // The shared `checkEdgeCycles` is called once per edge field; each call must
    // keep its own message. A regression that traversed the wrong field here
    // would be invisible without this case.
    const nodes = [
      ...supersessionKinds(),
      gnode({ id: "tactic-a", kind: "tactic", blocked_by: ["tactic-b"] }),
      gnode({ id: "tactic-b", kind: "tactic", blocked_by: ["tactic-a"] }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-a: blocked_by forms a cycle — a tactic cannot be transitively blocked by itself/,
    );
    expect(() => validateGraph(nodes)).not.toThrow(/superseded_by forms a cycle/);
  });

  it("rule 26: rejects a node superseded while in flight with no expiry named", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({
        id: "tactic-live",
        kind: "tactic",
        phase: "implement",
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
        superseded_by: ["tactic-new"],
      }),
      gnode({ id: "tactic-new", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /tactic-live: superseded while in flight .* supersession_expiry is not named/,
    );
  });

  it("rule 26: accepts an in-flight supersession that names its expiry event", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({
        id: "tactic-live",
        kind: "tactic",
        phase: "implement",
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
        superseded_by: ["tactic-new"],
        supersession_expiry: "merge or closure of PR #1",
      }),
      gnode({ id: "tactic-new", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("rule 26: rejects a whitespace-only expiry — naming nothing is not naming", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({
        id: "tactic-live",
        kind: "tactic",
        phase: "implement",
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
        superseded_by: ["tactic-new"],
        supersession_expiry: "   ",
      }),
      gnode({ id: "tactic-new", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).toThrow(/tactic-live: superseded while in flight/);
  });

  it("rule 26 is inert on a superseded node that is NOT in flight", () => {
    // No interim live risk to except, so no expiry is owed.
    const nodes = [
      ...supersessionKinds(),
      gnode({
        id: "tactic-old",
        kind: "tactic",
        status: "superseded",
        phase: "implement",
        execution: null,
        superseded_by: ["tactic-new"],
      }),
      gnode({ id: "tactic-new", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("rule 26 is inert on an in-flight node that is not superseded", () => {
    const nodes = [
      ...supersessionKinds(),
      gnode({
        id: "tactic-live",
        kind: "tactic",
        phase: "implement",
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("rule 16 governs the superseded terminal: it passes only where the kind declares it", () => {
    const declaring = [
      ...supersessionKinds(),
      gnode({ id: "tactic-old", kind: "tactic", status: "superseded" }),
    ];
    expect(() => validateGraph(declaring)).not.toThrow();

    // The same node against a kind fixture whose vocabulary omits `superseded`.
    const silent = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({ id: "tactic-old", kind: "tactic", status: "superseded" }),
    ];
    expect(() => validateGraph(silent)).toThrow(/tactic-old.*superseded.*status_vocabulary/);
  });

  it("rule 26 is inert at phase done even though execution is never cleared", () => {
    // Regression: the rule keyed "in flight" on `execution !== null` alone, but
    // nothing ever nulls the execution record — measured 2026-08-31, 151 of the
    // 208 `phase: "done"` nodes on the live store still carry one. So a
    // completed node could not take a supersession edge without inventing an
    // expiry for work that finished long ago, and an expiry whose named event
    // had already fired could never be set back to null.
    const nodes = [
      ...supersessionKinds(),
      gnode({
        id: "tactic-old",
        kind: "tactic",
        phase: "done",
        execution: { branch: "b", pr: 1, attempts: {}, markers: [], strategy_fingerprint: null },
        superseded_by: ["tactic-new"],
        supersession_expiry: null,
      }),
      gnode({ id: "tactic-new", kind: "tactic" }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("CHARACTERIZATION (known gap): status `superseded` and `superseded_by` are not coupled", () => {
    // THIS TEST PINS A GAP. It records what the schema does TODAY; it does NOT
    // assert that the behavior is correct. Read the whole comment before
    // changing anything here.
    //
    // No rule ties the `superseded` STATUS to a non-empty `superseded_by`, in
    // either direction, so both half-supersessions below validate clean today:
    //
    //   (a) status `superseded` with an EMPTY `superseded_by`. It escapes rule
    //       26's expiry requirement entirely — `checkSupersessionExpiry`
    //       returns on the length-0 guard before any other clause runs. Once
    //       PR19b wires `isSuperseded` into selection, such a node drops out of
    //       the frontier with NO successor recorded anywhere: the work is
    //       retired and whatever replaced it is unnameable.
    //
    //   (b) the mirror — `superseded_by` populated while `status` is still
    //       `raw`. Also clean, and the node stays LIVE forever: selection keys
    //       on `status`, so the successor edge exists but the supersession
    //       never takes effect.
    //
    // The coupling is DEFERRED BY DECISION, not by oversight. Closing it needs
    // a new numbered rule plus its transcription into `intentions/kind-kind.md`,
    // and the PR that introduced `supersession_expiry` was already carrying one
    // piece of unratified design surface; compounding two invented rules in one
    // PR was judged worse than deferring one. The decision belongs to the
    // follow-on work (PR19b) that builds the readers making this hazard
    // reachable.
    //
    // So this is a characterization test of the kind
    // `.claude/rules/test-integrity.md` permits — it documents a gap honestly
    // rather than blessing a bug. Whoever adds the coupling rule should EXPECT
    // BOTH ASSERTIONS BELOW TO GO RED, and must then REPLACE them with
    // `toThrow` expectations naming the new rule. Do not make a red here go
    // green by loosening the rule; deleting or skipping this test is the one
    // response that is never right.
    const missingSuccessor = [
      ...supersessionKinds(),
      gnode({ id: "tactic-old", kind: "tactic", status: "superseded", superseded_by: [] }),
    ];
    expect(() => validateGraph(missingSuccessor)).not.toThrow();

    const missingStatus = [
      ...supersessionKinds(),
      gnode({ id: "tactic-old", kind: "tactic", status: "raw", superseded_by: ["tactic-new"] }),
      gnode({ id: "tactic-new", kind: "tactic" }),
    ];
    expect(() => validateGraph(missingStatus)).not.toThrow();
  });

  // --- Rule 27: write-class declaration agrees with the code mirror ---------

  /**
   * The classification `kind-kind` records, as a fresh object per call so a
   * test may delete or override one entry without leaking into the next.
   * Transcribed from `intentions/kind-kind.md`'s
   * `attributes.field_write_class`, which is the authority; `attributes` is
   * absent because it is classified per key on the individual kind nodes.
   */
  function fullWriteClassMap(): Record<string, string> {
    return {
      id: "intent",
      kind: "intent",
      statement: "intent",
      owner: "intent",
      status: "shared",
      parent: "intent",
      serves: "intent",
      recovers: "intent",
      rationale: "intent",
      reading: "orchestration",
      clarifications: "intent",
      tooling_goals: "intent",
      success_signal: "intent",
      attention: "intent",
      phase: "orchestration",
      execution: "orchestration",
      validates: "intent",
      blocked_by: "shared",
      superseded_by: "intent",
      supersession_expiry: "intent",
      office_hours: "orchestration",
      pace_exempt: "orchestration",
      rounds: "orchestration",
    };
  }

  /** A `kind-kind` fixture carrying `declaration` as its write-class map. */
  function authorityKindNode(declaration: unknown): IntentionNode {
    return gnode({
      id: "kind-kind",
      kind: "kind",
      status: "codified",
      attributes: {
        status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
        field_write_class: declaration,
      },
    });
  }

  it("passes when the authority kind node classifies every first-class field", () => {
    expect(() => validateGraph([authorityKindNode(fullWriteClassMap())])).not.toThrow();
  });

  it("is inert when a kind node declares no field_write_class at all", () => {
    // The mirror's own completeness is a COMPILE-time guarantee; rule 27 only
    // judges declarations that exist, so a graph predating the classification
    // (and every fixture in this file) stays valid.
    expect(() =>
      validateGraph([gnode({ id: "kind-kind", kind: "kind", status: "codified" })]),
    ).not.toThrow();
  });

  it("throws when the authority kind node leaves a first-class field unclassified", () => {
    const partial = fullWriteClassMap();
    delete partial.rationale;
    expect(() => validateGraph([authorityKindNode(partial)])).toThrow(IntentionSchemaError);
    expect(() => validateGraph([authorityKindNode(partial)])).toThrow(
      /kind-kind: attributes\.field_write_class has no declaration for first-class field "rationale"/,
    );
  });

  it("throws when a declared class contradicts the code mirror", () => {
    const contradictory = fullWriteClassMap();
    contradictory.rationale = "orchestration";
    expect(() => validateGraph([authorityKindNode(contradictory)])).toThrow(
      /kind-kind: attributes\.field_write_class\["rationale"\] is "orchestration", but the code mirror FIELD_WRITE_CLASS_PROBE says "intent"/,
    );
  });

  it("throws when a declaration names a field that is not first-class", () => {
    const unknownField = fullWriteClassMap();
    unknownField.gap = "orchestration";
    expect(() => validateGraph([authorityKindNode(unknownField)])).toThrow(
      /kind-kind: attributes\.field_write_class declares "gap", which is not a first-class field/,
    );
  });

  it("throws when a declared value is not a legal write class", () => {
    const badValue = fullWriteClassMap();
    badValue.rationale = "durable";
    expect(() => validateGraph([authorityKindNode(badValue)])).toThrow(
      /kind-kind: attributes\.field_write_class\["rationale"\] is "durable", not one of intent, orchestration, shared/,
    );
  });

  it("throws when field_write_class is not a map", () => {
    expect(() => validateGraph([authorityKindNode(["phase: orchestration"])])).toThrow(
      /kind-kind: attributes\.field_write_class must be a map from field name to write class/,
    );
  });

  it("accepts a non-authority kind node's partial map, attributes.<key> entries included", () => {
    // kind-tactic declares only its kind-scoped fields and its own attribute
    // keys — exactly what `intentions/kind-tactic.md` records. No coverage
    // obligation follows it there, and the `attributes.` entries are per-key
    // declarations the mirror deliberately cannot enumerate.
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-tactic",
        kind: "kind",
        status: "codified",
        attributes: {
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
          field_write_class: {
            phase: "orchestration",
            execution: "orchestration",
            validates: "intent",
            blocked_by: "shared",
            attention: "intent",
            "attributes.measured_impact": "orchestration",
            "attributes.ledger_entry": "intent",
          },
        },
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  it("throws when an attributes.<key> entry shadows a first-class field", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-tactic",
        kind: "kind",
        status: "codified",
        attributes: {
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
          field_write_class: { "attributes.phase": "orchestration" },
        },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /kind-tactic: attributes\.field_write_class declares "attributes\.phase", but "phase" is a first-class field/,
    );
  });

  it("still contradicts on a non-authority kind node — agreement is not scoped to the authority", () => {
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: {
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
          field_write_class: { recovers: "orchestration", rounds: "orchestration" },
        },
      }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /kind-strategy: attributes\.field_write_class\["recovers"\] is "orchestration", but the code mirror FIELD_WRITE_CLASS_PROBE says "intent"/,
    );
  });

  it("never judges an ordinary node's attributes — the rule is kind-node scoped", () => {
    // A tactic carrying a stray `field_write_class` attribute is rule 23's
    // business (it is not a first-class name, so nothing bans it) — rule 27
    // reads declarations only off nodes that DEFINE a kind.
    const nodes = [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-tactic", kind: "kind", status: "codified" }),
      gnode({
        id: "tactic-1",
        kind: "tactic",
        attributes: { field_write_class: { rationale: "orchestration" } },
      }),
    ];
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  // --- Rule 28: criteria / standing_criteria shape -------------------------

  /** A well-formed criterion, overridable field by field. */
  function criterion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: "nf-test-integrity",
      statement: "A failing test is fixed in the code or escalated.",
      class: "non-functional",
      authority: "deferred",
      recorded: "2026-09-01",
      ...overrides,
    };
  }

  /** `kind-strategy` plus a strategy carrying `criteria`, the usual shape. */
  function criteriaGraph(criteria: unknown, standing?: unknown): IntentionNode[] {
    return [
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: {
          status_vocabulary: { raw: "Not yet started.", codified: "Complete." },
          ...(standing === undefined ? {} : { standing_criteria: standing }),
        },
      }),
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "strategy-x", kind: "strategy", attributes: { criteria } }),
    ];
  }

  it("accepts well-formed criteria in all three classes", () => {
    expect(() =>
      validateGraph(
        criteriaGraph(
          [
            criterion({ id: "f-1", class: "functional" }),
            criterion({ id: "nf-1", class: "non-functional" }),
            criterion({ id: "a-1", class: "assumption" }),
          ],
          [criterion()],
        ),
      ),
    ).not.toThrow();
  });

  it("is inert on a node carrying neither key — it cannot retroactively break main", () => {
    expect(() =>
      validateGraph([
        gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
        gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
        gnode({ id: "strategy-x", kind: "strategy" }),
      ]),
    ).not.toThrow();
  });

  it("rejects a criteria value that is not an array", () => {
    expect(() => validateGraph(criteriaGraph("nf-security"))).toThrow(
      /strategy-x: attributes\.criteria must be an array of \{id, statement, class, authority, recorded\} criteria, got string/,
    );
  });

  it("rejects an unknown key rather than ignoring it", () => {
    expect(() => validateGraph(criteriaGraph([criterion({ tier: "gating" })]))).toThrow(
      /strategy-x: attributes\.criteria\[0\]\.tier is not a criterion field/,
    );
  });

  it("rejects an empty statement, a bad class, a bad authority and a bad date", () => {
    expect(() => validateGraph(criteriaGraph([criterion({ statement: " " })]))).toThrow(
      /attributes\.criteria\[0\]\.statement must be a non-empty string/,
    );
    expect(() => validateGraph(criteriaGraph([criterion({ class: "perf" })]))).toThrow(
      /attributes\.criteria\[0\]\.class must be one of functional, non-functional, assumption/,
    );
    expect(() => validateGraph(criteriaGraph([criterion({ authority: "approved" })]))).toThrow(
      /attributes\.criteria\[0\]\.authority must be one of ratified, delegated, deferred/,
    );
    expect(() => validateGraph(criteriaGraph([criterion({ recorded: "2026-9-1" })]))).toThrow(
      /attributes\.criteria\[0\]\.recorded must be a YYYY-MM-DD date/,
    );
  });

  it("rejects a duplicate criterion id within one list", () => {
    expect(() =>
      validateGraph(criteriaGraph([criterion(), criterion({ statement: "other" })])),
    ).toThrow(/attributes\.criteria\[1\]\.id duplicates "nf-test-integrity"/);
  });

  it("rejects a functional or assumption entry in the standing home", () => {
    expect(() =>
      validateGraph(criteriaGraph([], [criterion({ id: "f-1", class: "functional" })])),
    ).toThrow(
      /kind-strategy: attributes\.standing_criteria\[0\] \("f-1"\) is class "functional", but the standing set is NON-FUNCTIONAL ONLY/,
    );
    expect(() =>
      validateGraph(criteriaGraph([], [criterion({ id: "a-1", class: "assumption" })])),
    ).toThrow(
      /kind-strategy: attributes\.standing_criteria\[0\] \("a-1"\) is class "assumption", but the standing set is NON-FUNCTIONAL ONLY/,
    );
  });

  it("rejects a standing set stored anywhere but kind-strategy", () => {
    const nodes = [
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "strategy-x", kind: "strategy", attributes: { standing_criteria: [criterion()] } }),
    ];
    expect(() => validateGraph(nodes)).toThrow(
      /strategy-x: attributes\.standing_criteria is only meaningful on kind-strategy/,
    );
  });

  it("reports every defect in one run rather than stopping at the first", () => {
    // The report-all style is why the rule restates criteria.ts's shape check
    // instead of calling its throw-on-first-defect validators.
    try {
      validateGraph(criteriaGraph([criterion({ class: "perf", authority: "approved" })]));
      expect.unreachable("expected validateGraph to throw");
    } catch (error) {
      const message = (error as Error).message; // type-safety-ok: catch binds unknown; the assertion below is the narrowing
      expect(message).toMatch(/\.class must be one of/);
      expect(message).toMatch(/\.authority must be one of/);
    }
  });

  // --- Rule 28 part three: basis_pins shape --------------------------------

  const PIN_HASH = "a1b2c3d4".repeat(8);

  /** `kind-strategy` plus a strategy carrying `basis_pins`. */
  function pinGraph(pins: unknown): IntentionNode[] {
    return [
      gnode({
        id: "kind-strategy",
        kind: "kind",
        status: "codified",
        attributes: { status_vocabulary: { raw: "Not yet started.", codified: "Complete." } },
      }),
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "strategy-x", kind: "strategy", attributes: { basis_pins: pins } }),
    ];
  }

  /** A well-formed pin, overridable field by field. */
  function basisPin(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      cites: "strategy-graph-integrity#clarification:What is the criterion?",
      hash: PIN_HASH,
      pinned_at: "2026-09-01",
      ...overrides,
    };
  }

  it("accepts a well-formed pin under every disposition selector", () => {
    expect(() =>
      validateGraph(
        pinGraph([
          basisPin(),
          basisPin({ cites: "strategy-a#criterion:fn-1" }),
          basisPin({ cites: "strategy-a#statement" }),
          basisPin({ cites: "strategy-a#rationale" }),
          basisPin({ cites: "strategy-a#conditions" }),
          basisPin({ cites: "strategy-a#node" }),
        ]),
      ),
    ).not.toThrow();
  });

  it("is inert on a node carrying no pins", () => {
    expect(() => validateGraph(pinGraph(null))).not.toThrow();
  });

  it("rejects a basis_pins value that is not an array, and a non-record entry", () => {
    expect(() => validateGraph(pinGraph("strategy-a#statement"))).toThrow(
      /strategy-x: attributes\.basis_pins must be an array of \{cites, hash, pinned_at\} pins, got string/,
    );
    expect(() => validateGraph(pinGraph(["strategy-a#statement"]))).toThrow(
      /attributes\.basis_pins\[0\] must be a \{cites, hash, pinned_at\} record, got string/,
    );
  });

  it("rejects an unknown key rather than ignoring it", () => {
    expect(() => validateGraph(pinGraph([basisPin({ waived: true })]))).toThrow(
      /attributes\.basis_pins\[0\]\.waived is not a basis-pin field/,
    );
  });

  it("rejects a reference that does not parse as <node-id>#<selector>", () => {
    // A MALFORMED reference is caught here so it never reaches the stale-intent
    // arm, where it would be indistinguishable from a genuine dangling citation.
    expect(() => validateGraph(pinGraph([basisPin({ cites: "strategy-a" })]))).toThrow(
      /must be a disposition reference <node-id>#<selector>/,
    );
    expect(() => validateGraph(pinGraph([basisPin({ cites: "#statement" })]))).toThrow(
      /must be a disposition reference <node-id>#<selector>/,
    );
    expect(() => validateGraph(pinGraph([basisPin({ cites: "strategy-a#body" })]))).toThrow(
      /names unknown disposition selector "body"/,
    );
    expect(() => validateGraph(pinGraph([basisPin({ cites: "strategy-a#criterion:" })]))).toThrow(
      /names selector "criterion", which requires a key/,
    );
    expect(() => validateGraph(pinGraph([basisPin({ cites: "strategy-a#node:x" })]))).toThrow(
      /names selector "node", which takes no key/,
    );
  });

  it("rejects a hash that is not a lowercase sha256 hex digest, and a malformed date", () => {
    expect(() => validateGraph(pinGraph([basisPin({ hash: PIN_HASH.toUpperCase() })]))).toThrow(
      /attributes\.basis_pins\[0\]\.hash must be a lowercase sha256 hex digest/,
    );
    expect(() => validateGraph(pinGraph([basisPin({ hash: "abc" })]))).toThrow(
      /\.hash must be a lowercase sha256 hex digest/,
    );
    expect(() => validateGraph(pinGraph([basisPin({ pinned_at: "2026-9-1" })]))).toThrow(
      /attributes\.basis_pins\[0\]\.pinned_at must be a YYYY-MM-DD date/,
    );
  });

  it("rejects two pins on the same citation", () => {
    expect(() =>
      validateGraph(pinGraph([basisPin(), basisPin({ hash: "f".repeat(64) })])),
    ).toThrow(/attributes\.basis_pins\[1\]\.cites duplicates/);
  });

  // --- Rule 28 part four: shims shape ---------------------------------------

  /** `kind-strategy`/`kind-kind` plus a strategy carrying `shims`. */
  function shimGraph(shims: unknown): IntentionNode[] {
    return [
      gnode({ id: "kind-kind", kind: "kind", status: "codified" }),
      gnode({ id: "kind-strategy", kind: "kind", status: "codified" }),
      gnode({ id: "strategy-x", kind: "strategy", attributes: { shims } }),
    ];
  }

  /** A well-formed shim, overridable field by field — mirrors `shims.ts`'s `ShimDeclaration`. */
  function shimEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: "finding-ledger",
      target: "a structured finding-ledger record",
      liquidation: "the finding-ledger deriver goes live",
      liquidated_by: null,
      declared: "2026-09-01",
      ...overrides,
    };
  }

  it("accepts a well-formed shims list, including a non-null liquidated_by", () => {
    expect(() =>
      validateGraph(
        shimGraph([shimEntry(), shimEntry({ id: "review", liquidated_by: "validate-graph" })]),
      ),
    ).not.toThrow();
  });

  it("is inert on a node carrying no shims key", () => {
    expect(() => validateGraph(shimGraph(null))).not.toThrow();
  });

  it("rejects a shims value that is not an array, and a non-record entry", () => {
    expect(() => validateGraph(shimGraph("finding-ledger"))).toThrow(
      /strategy-x: attributes\.shims must be an array of \{id, target, liquidation, liquidated_by, declared\} shims, got string/,
    );
    expect(() => validateGraph(shimGraph(["finding-ledger"]))).toThrow(
      /attributes\.shims\[0\] must be a \{id, target, liquidation, liquidated_by, declared\} record, got string/,
    );
  });

  it("rejects an unknown key rather than ignoring it", () => {
    expect(() => validateGraph(shimGraph([shimEntry({ waived: true })]))).toThrow(
      /attributes\.shims\[0\]\.waived is not a shim field/,
    );
  });

  for (const field of ["id", "target", "liquidation"]) {
    it(`rejects an empty ${field}`, () => {
      expect(() => validateGraph(shimGraph([shimEntry({ [field]: "" })]))).toThrow(
        new RegExp(`attributes\\.shims\\[0\\]\\.${field} must be a non-empty string`),
      );
    });
  }

  it("rejects a liquidated_by that is neither a non-empty string nor null", () => {
    expect(() => validateGraph(shimGraph([shimEntry({ liquidated_by: 42 })]))).toThrow(
      /attributes\.shims\[0\]\.liquidated_by must be a non-empty string or null/,
    );
    expect(() => validateGraph(shimGraph([shimEntry({ liquidated_by: "" })]))).toThrow(
      /attributes\.shims\[0\]\.liquidated_by must be a non-empty string or null/,
    );
  });

  it("rejects a malformed declared date", () => {
    expect(() => validateGraph(shimGraph([shimEntry({ declared: "2026-9-1" })]))).toThrow(
      /attributes\.shims\[0\]\.declared must be a YYYY-MM-DD date/,
    );
  });

  it("rejects a duplicate shim id within one node's list", () => {
    expect(() =>
      validateGraph(shimGraph([shimEntry({ id: "x" }), shimEntry({ id: "x" })])),
    ).toThrow(/attributes\.shims\[1\]\.id duplicates "x"/);
  });
});

describe("write-class primitives", () => {
  it("fieldWriteClass returns the recorded class for every first-class field", () => {
    expect(fieldWriteClass("rationale")).toBe("intent");
    expect(fieldWriteClass("statement")).toBe("intent");
    expect(fieldWriteClass("phase")).toBe("orchestration");
    expect(fieldWriteClass("reading")).toBe("orchestration");
    expect(fieldWriteClass("status")).toBe("shared");
    expect(fieldWriteClass("blocked_by")).toBe("shared");
  });

  it("fieldWriteClass classifies every first-class field name and nothing else", () => {
    for (const field of FIRST_CLASS_FIELD_NAMES) {
      expect(fieldWriteClass(field)).not.toBeNull();
    }
    expect(fieldWriteClass("gap")).toBeNull();
    expect(fieldWriteClass("")).toBeNull();
    // Not a field, and specifically not reachable through the prototype chain.
    expect(fieldWriteClass("toString")).toBeNull();
    expect(fieldWriteClass("constructor")).toBeNull();
  });

  it("refusedCrossClassFields lets an intent writer touch intent and shared fields", () => {
    expect(refusedCrossClassFields("intent", ["rationale", "statement", "status", "blocked_by"]))
      .toEqual([]);
  });

  it("refusedCrossClassFields refuses orchestration fields to an intent writer", () => {
    expect(
      refusedCrossClassFields("intent", ["rationale", "phase", "reading", "office_hours"]),
    ).toEqual(["phase", "reading", "office_hours"]);
  });

  it("refusedCrossClassFields refuses intent fields to an orchestration writer", () => {
    expect(
      refusedCrossClassFields("orchestration", ["phase", "rationale", "statement", "status"]),
    ).toEqual(["rationale", "statement"]);
  });

  it("refusedCrossClassFields refuses an unrecognized field name to BOTH classes", () => {
    // The negative-check discipline `isDurableWriteRefused` established:
    // unknown refuses, because a write fence that fails open is silent.
    expect(refusedCrossClassFields("intent", ["gap"])).toEqual(["gap"]);
    expect(refusedCrossClassFields("orchestration", ["gap"])).toEqual(["gap"]);
  });

  it("refusedCrossClassFields preserves the order given and returns [] for no changes", () => {
    expect(refusedCrossClassFields("orchestration", ["statement", "rationale"])).toEqual([
      "statement",
      "rationale",
    ]);
    expect(refusedCrossClassFields("intent", [])).toEqual([]);
  });

  it("refusedCrossClassFields throws on a shared WRITER declaration", () => {
    expect(() => refusedCrossClassFields("shared", ["rationale"])).toThrow(IntentionSchemaError);
    expect(() => refusedCrossClassFields("shared", ["rationale"])).toThrow(
      /write class "shared" is a field classification, not a writer declaration/,
    );
  });

  it("refusedFields unions the class fence with the kind-scoped durable fence", () => {
    // On a durable kind, an intent writer is still refused `rationale` — the
    // class fence permits it, the durable fence does not.
    expect(refusedDurableFields("strategy", ["rationale"])).toEqual(["rationale"]);
    expect(refusedCrossClassFields("intent", ["rationale"])).toEqual([]);
    expect(refusedFields("intent", "strategy", ["rationale"])).toEqual(["rationale"]);
  });

  it("refusedFields refuses nothing a non-durable kind permits to its own class", () => {
    expect(refusedFields("intent", "tactic", ["rationale", "statement", "status"])).toEqual([]);
    expect(refusedFields("orchestration", "tactic", ["phase", "reading", "blocked_by"])).toEqual(
      [],
    );
  });

  it("refusedFields reports each refused field once, in the order given", () => {
    // On `strategy` (a durable kind) an orchestration writer is refused only
    // `rationale` — the durable fence's exemption covers `reading` and `phase`,
    // and the class fence agrees with an orchestration writer on both.
    expect(
      refusedFields("orchestration", "strategy", ["reading", "rationale", "phase"]),
    ).toEqual(["rationale"]);
    // The same three to an INTENT writer: `rationale` refused by the durable
    // fence alone, `reading` and `phase` by the class fence alone. Each appears
    // once even though `rationale` is refused twice over.
    expect(refusedFields("intent", "strategy", ["reading", "rationale", "phase"])).toEqual([
      "reading",
      "rationale",
      "phase",
    ]);
  });

  it("refusedFields throws on a shared WRITER declaration too", () => {
    expect(() => refusedFields("shared", "tactic", ["rationale"])).toThrow(
      /write class "shared" is a field classification, not a writer declaration/,
    );
  });

  it("refusedFields leaves the durable fence's own signature and behaviour alone", () => {
    // Unit 3 adds a union; it does not move `refusedDurableFields`.
    expect(refusedDurableFields("tactic", ["rationale"])).toEqual([]);
    expect(refusedDurableFields("strategy", ["phase", "rationale"])).toEqual(["rationale"]);
  });
});

describe("supersession predicates", () => {
  function pnode(partial: Partial<IntentionNode>): IntentionNode {
    return validateNode({
      id: "tactic-p",
      kind: "tactic",
      statement: "A tactic.",
      owner: "ai",
      status: "raw",
      ...partial,
    });
  }

  it("isSuperseded is true only at the superseded status", () => {
    expect(isSuperseded(pnode({ status: SUPERSEDED_STATUS }))).toBe(true);
    expect(isSuperseded(pnode({ status: "raw" }))).toBe(false);
    expect(isSuperseded(pnode({ status: "codified", phase: "done" }))).toBe(false);
  });

  it("isRetired covers BOTH terminals and nothing else", () => {
    expect(isRetired(pnode({ status: "raw", phase: "done" }))).toBe(true);
    expect(isRetired(pnode({ status: SUPERSEDED_STATUS, phase: "implement" }))).toBe(true);
    expect(isRetired(pnode({ status: "raw", phase: "implement" }))).toBe(false);
    expect(isRetired(pnode({ status: "raw", phase: null }))).toBe(false);
  });

  it("SUPERSEDED_STATUS is deliberately absent from the legacy STATUSES array", () => {
    // Nothing validates against STATUSES; the terminal lives in each kind
    // node's status_vocabulary. Adding it here would imply a central status
    // enum the graph does not have.
    expect(STATUSES).toEqual(["raw", "refining", "delegated", "codified"]);
    expect(STATUSES).not.toContain(SUPERSEDED_STATUS);
  });

  it("the new fields are first-class, so rule 23 bans them from attributes", () => {
    expect(FIRST_CLASS_FIELD_NAMES).toContain("superseded_by");
    expect(FIRST_CLASS_FIELD_NAMES).toContain("supersession_expiry");
  });
});

describe("validateGraphProseRefs", () => {
  /** Build a full IntentionNode fixture for prose-ref tests. */
  function pnode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
    return {
      id: partial.id,
      kind: partial.kind,
      statement: partial.statement ?? `Statement for ${partial.id}`,
      owner: partial.owner ?? "human",
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

  // A real node so the "tactic-" kind prefix exists in the derived vocabulary
  // (prefixes are derived from the store ids, never hardcoded).
  const realTactic = pnode({ id: "tactic-real", kind: "tactic" });

  it("throws on a missing backtick ref in rationale", () => {
    const nodes = [
      realTactic,
      pnode({ id: "tactic-a", kind: "tactic", rationale: "See `tactic-missing` for context." }),
    ];
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set())).toThrow(
      /tactic-a: prose reference `tactic-missing` does not resolve to a node/,
    );
  });

  it("throws on a missing backtick ref in a clarification answer", () => {
    const nodes = [
      realTactic,
      pnode({
        id: "tactic-a",
        kind: "tactic",
        clarifications: [{ question: "q", answer: "Depends on `tactic-missing`." }],
      }),
    ];
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set())).toThrow(
      /tactic-a: prose reference `tactic-missing` does not resolve to a node/,
    );
  });

  it("throws on a missing backtick ref in the body", () => {
    const nodes = [realTactic, pnode({ id: "tactic-a", kind: "tactic" })];
    const bodies = new Map([["tactic-a", "# heading\n\nBlocked on `tactic-missing`.\n"]]);
    expect(() => validateGraphProseRefs(nodes, bodies, [], new Set())).toThrow(
      /tactic-a: prose reference `tactic-missing` does not resolve to a node/,
    );
  });

  it("passes when a backtick ref resolves to a live node in the store", () => {
    const nodes = [
      realTactic,
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Depends on `tactic-real`." }),
    ];
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set())).not.toThrow();
  });

  it("passes when a backtick ref names a pruned (deleted) node", () => {
    const nodes = [
      realTactic,
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Superseded `tactic-gone`." }),
    ];
    expect(() =>
      validateGraphProseRefs(nodes, new Map(), ["tactic-gone"], new Set()),
    ).not.toThrow();
  });

  it("passes a missing ref that an OTHER open tactic plans (mentions in its statement)", () => {
    const nodes = [
      realTactic,
      // An open (non-done) tactic whose statement mentions the id — the ref is a
      // forward reference to planned-but-uncommitted work, not a dangling ref.
      pnode({
        id: "tactic-planner",
        kind: "tactic",
        phase: "implement",
        statement: "This will create tactic-planned.",
      }),
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Coordinates with `tactic-planned`." }),
    ];
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set())).not.toThrow();
  });

  it("does NOT treat a missing ref as planned when the only mentioning tactic is done", () => {
    const nodes = [
      realTactic,
      pnode({
        id: "tactic-planner",
        kind: "tactic",
        phase: "done",
        statement: "This created tactic-planned.",
      }),
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Coordinates with `tactic-planned`." }),
    ];
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set())).toThrow(
      /tactic-a: prose reference `tactic-planned` does not resolve to a node/,
    );
  });

  it("passes a missing, non-planned ref that is present in the baseline", () => {
    const nodes = [
      realTactic,
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Example id `tactic-example`." }),
    ];
    const baseline = new Set(["tactic-example|tactic-a"]);
    expect(() => validateGraphProseRefs(nodes, new Map(), [], baseline)).not.toThrow();
  });

  it("never flags a non-backticked prose compound that merely looks id-shaped", () => {
    const nodes = [
      realTactic,
      // Plain-text "tactic-only" used as English prose (no backticks) — a
      // non-backticked token counts only if it is in the known vocabulary, so it
      // can never be classified missing.
      pnode({
        id: "tactic-a",
        kind: "tactic",
        rationale: "This is the tactic-only case discussed above.",
      }),
    ];
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set())).not.toThrow();
  });

  // --- batch-under-write resolution (forward cross-references) ---------------
  //
  // A write batch whose members land one graph-commit at a time cannot name a
  // sibling of the same batch unless the members are hand-ordered: at the moment
  // the first member is validated the sibling is in neither the store nor the
  // deleted set. `batchIds` lets the writer declare the ids it is minting so the
  // reference resolves; the tests below pin BOTH halves — the forward reference
  // is accepted, and a genuinely dangling reference is still rejected.

  it("passes a forward cross-reference to a sibling in the SAME batch under write", () => {
    const nodes = [
      realTactic,
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Cross-links `tactic-sibling`." }),
    ];
    const batch = new Set(["tactic-a", "tactic-sibling"]);
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set(), batch)).not.toThrow();
  });

  it("passes a forward cross-reference from a node BODY to a sibling in the batch", () => {
    const nodes = [realTactic, pnode({ id: "tactic-a", kind: "tactic" })];
    const bodies = new Map([["tactic-a", "# heading\n\nSee `tactic-sibling` for the pair.\n"]]);
    const batch = new Set(["tactic-sibling"]);
    expect(() => validateGraphProseRefs(nodes, bodies, [], new Set(), batch)).not.toThrow();
  });

  it("STILL throws on a ref in neither the batch nor the store — a batch is not a blanket pass", () => {
    const nodes = [
      realTactic,
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Names `tactic-nowhere`." }),
    ];
    // A non-empty batch is declared and simply does not contain the reference.
    const batch = new Set(["tactic-a", "tactic-sibling"]);
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set(), batch)).toThrow(
      /tactic-a: prose reference `tactic-nowhere` does not resolve to a node/,
    );
  });

  it("matches batch ids EXACTLY — a longer compound is not covered by a batch member", () => {
    const nodes = [
      realTactic,
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Names `tactic-sibling-v2`." }),
    ];
    const batch = new Set(["tactic-sibling"]);
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set(), batch)).toThrow(
      /tactic-a: prose reference `tactic-sibling-v2` does not resolve to a node/,
    );
  });

  it("is exactly as strict as before when no batch is declared", () => {
    const nodes = [
      realTactic,
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Cross-links `tactic-sibling`." }),
    ];
    expect(() => validateGraphProseRefs(nodes, new Map(), [], new Set())).toThrow(
      /tactic-a: prose reference `tactic-sibling` does not resolve to a node/,
    );
  });

  it("lists ALL prose-ref violations in one throw", () => {
    const nodes = [
      realTactic,
      pnode({ id: "tactic-a", kind: "tactic", rationale: "Needs `tactic-x`." }),
      pnode({
        id: "tactic-b",
        kind: "tactic",
        clarifications: [{ question: "q", answer: "Also `tactic-y`." }],
      }),
    ];
    let caught: unknown;
    try {
      validateGraphProseRefs(nodes, new Map(), [], new Set());
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    if (!(caught instanceof Error)) throw new Error("unreachable");
    expect(caught.message).toContain("tactic-a: prose reference `tactic-x`");
    expect(caught.message).toContain("tactic-b: prose reference `tactic-y`");
  });
});

describe("attention store round-trip", () => {
  it("round-trips a per-tier boosts map through writeNode/readNode", () => {
    // YAML serializes the string key "1" as the bare scalar `1` and parses it
    // back as a number-ish key, so this is the test that actually proves the
    // canonicalization is stable in BOTH directions, not just on read.
    const dir = mkdtempSync(join(tmpdir(), "intentions-attention-"));
    const attention = { boosts: { "1": 3, "2": 20 }, rationale: "Two-tier claim." };
    writeNode(dir, {
      id: "strategy-round-trip",
      kind: "strategy",
      statement: "A node whose attention claims two tiers.",
      owner: "human",
      status: "codified",
      attention,
    });
    expect(readNode(dir, "strategy-round-trip").attention).toEqual(attention);
  });
});
