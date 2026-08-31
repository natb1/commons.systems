import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { listNodes, writeNode } from "../src/store.js";
import type { IntentionNode, IntentionNodeInput, Phase } from "../src/schema.js";
import {
  LADDER_TERMINUS_SENSOR_NAME,
  buildDefaultRegistry,
  makeLadderTerminusSensor,
} from "../scripts/read-sensors.js";

// tactic-ladder-terminus-owns-main-qa's census (`../src/terminus.ts`), wired up
// as a registered sensor. This test does NOT re-derive the classification
// logic — it only checks the sensor wiring: the reading format, the
// degraded/error path's leak-free discipline, and the anti-drift guard on the
// registered name (mirrors delegation-records-sensor.test.ts /
// lifecycle-sensor.test.ts).

function tempStore(): string {
  return mkdtempSync(join(tmpdir(), "terminus-sensor-"));
}

/** A merged `execution` block (with a merged `completion`), never PR-carrying. */
function mergedExecution(): IntentionNodeInput["execution"] {
  return {
    branch: "b",
    pr: null,
    attempts: {},
    markers: [],
    strategy_fingerprint: null,
    completion: { mergedAt: "2026-08-01T00:00:00Z", mergeCommitSha: "abc123", graphCommitSha: null },
  };
}

/** A minimal merged tactic fixture, overridable to hit each classification. */
function mergedTactic(
  id: string,
  opts: {
    phase?: Phase | null;
    officeHours?: IntentionNodeInput["office_hours"];
    blockedBy?: string[];
  } = {},
): IntentionNodeInput {
  return {
    id,
    kind: "tactic",
    statement: `tactic ${id}`,
    owner: "ai",
    status: "codified",
    phase: opts.phase ?? "main-qa",
    execution: mergedExecution(),
    office_hours: opts.officeHours ?? null,
    blocked_by: opts.blockedBy ?? [],
  };
}

/**
 * The sensor's `read()` ignores its `node` argument (this sensor is
 * store-wide, like `makeIntentionStoreSensor` above it), so any well-formed
 * `IntentionNode` will do as the call argument.
 */
const DUMMY_NODE: IntentionNode = {
  id: "dummy",
  kind: "tactic",
  statement: "dummy",
  owner: "ai",
  status: "codified",
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
};

describe("makeLadderTerminusSensor", () => {
  it("produces the exact reading string over a known mix", () => {
    const dir = tempStore();
    // excused-parked: merged, not done, office_hours set.
    writeNode(
      dir,
      mergedTactic("tactic-parked", {
        officeHours: {
          reason: "needs a call",
          since: "2026-08-01",
          recommendation: null,
          session_type: "other",
        },
      }),
    );
    // excused-blocked: merged, not done, blocked_by names a real, present,
    // not-done blocker (tactic-other below) — an absent or done blocker no
    // longer excuses, so the blocker must exist in the store and stay open.
    writeNode(dir, mergedTactic("tactic-blocked", { blockedBy: ["tactic-other"] }));
    // The open blocker itself: present, not done, no completion — so it
    // classifies not-merged and never enters the census population.
    writeNode(dir, {
      id: "tactic-other",
      kind: "tactic",
      statement: "blocker for tactic-blocked",
      owner: "ai",
      status: "codified",
      phase: "implement",
    });
    // violation: merged, not done, no excuse.
    writeNode(dir, mergedTactic("tactic-violation"));
    // done: merged AND done — excluded from the census population entirely.
    writeNode(dir, mergedTactic("tactic-done", { phase: "done" }));
    // not-merged: no execution.completion.mergedAt — excluded entirely.
    writeNode(dir, {
      id: "tactic-unmerged",
      kind: "tactic",
      statement: "unmerged",
      owner: "ai",
      status: "raw",
      phase: "implement",
    });

    const sensor = makeLadderTerminusSensor(() => listNodes(dir));
    const reading = sensor.read(DUMMY_NODE);
    expect(reading).toBe("ladder terminus: 3 merged-not-done, 2 excused, 1 violations");
    rmSync(dir, { recursive: true, force: true });
  });

  it("degrades to a fixed status token when loadNodes throws, and never leaks the error text", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const secretDetail = "ENOENT: /home/nathan/private/path/does-not-exist";
    const sensor = makeLadderTerminusSensor(() => {
      throw new Error(secretDetail);
    });

    const reading = sensor.read(DUMMY_NODE);

    expect(reading).toBe("ladder terminus: unknown");
    expect(reading).not.toContain(secretDetail);
    expect(reading).not.toContain("ENOENT");
    // The caught error is reported to stderr only, never into the reading.
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain(secretDetail);
    errorSpy.mockRestore();
  });
});

describe("buildDefaultRegistry", () => {
  it("registers the ladder-terminus sensor under the exact declared name", () => {
    const registry = buildDefaultRegistry();
    // Guards against whitespace drift: an even slightly reworded name
    // silently de-registers this sensor from whatever node later declares it
    // as its success_signal.sensor.
    expect(LADDER_TERMINUS_SENSOR_NAME).toBe(
      "ladder-terminus census over the intention store (merged-but-not-terminal count)",
    );
    expect(registry.resolve(LADDER_TERMINUS_SENSOR_NAME).name).toBe(LADDER_TERMINUS_SENSOR_NAME);
  });
});
