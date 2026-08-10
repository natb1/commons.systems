import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import { SensorRegistry } from "../src/sensors.js";
import { listNodes, readNode, writeNode } from "../src/store.js";
import type { IntentionNodeInput } from "../src/schema.js";
import {
  buildDefaultRegistry,
  makeDelegationRecordsSensor,
  readDelegationRecords,
  readDelegationRecordsReading,
  readStoreSensors,
  renderDelegationRecordsReport,
} from "../scripts/read-sensors.js";

// The exact `success_signal.sensor` string on
// intentions/strategy-exercise-recovery-paths.md. Hardcoded here (not imported)
// so the test doubles as a guard: a rename of the production constant that
// diverges from the strategy's declared sensor name fails this suite.
const DELEGATION_SENSOR_NAME = "the delegation records themselves";

// This test file lives at packages/intentionsutil/test/, so repo root is
// three dirname() calls up — same pattern as office-hours.test.ts. The
// `strategy-exercise-recovery-paths` branch of the delegation-records sensor
// (per its production implementation) always reads the REAL repo's
// `intentions/` dir via the module-level `intentionsDir` const — it does NOT
// go through the injected `loadNodes` closure, unlike the
// `strategy-realign-attachments` branch. So its expected reading is computed
// dynamically from the real store below, not hardcoded, to avoid the test
// drifting out of sync with the live delegation-record count.
const realRepoRoot = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const realIntentionsDir = join(realRepoRoot, "intentions");

function tempStore(): string {
  return mkdtempSync(join(tmpdir(), "delegation-records-sensor-"));
}

/** A well-formed delegation record fixture with overridable exercise fields. */
function delegationNode(
  id: string,
  opts: {
    origin?: string;
    lastExercised?: string | null;
    lastAssessed?: string;
    attributes?: Record<string, unknown>;
  } = {},
): IntentionNodeInput {
  const attributes = opts.attributes ?? {
    origin: opts.origin ?? "chosen",
    irreversibility: {
      recovery_path: "re-host",
      last_exercised: opts.lastExercised ?? null,
    },
    non_delegable_floor: `floor for ${id}`,
    review_trigger: `trigger for ${id}`,
    last_assessed: opts.lastAssessed ?? "2026-07-02",
  };
  return {
    id,
    kind: "delegation",
    statement: `delegation ${id}`,
    owner: "human",
    status: "codified",
    attributes,
  };
}

/** A fixture strategy whose success_signal names the delegation sensor. */
function strategyNode(id: string): IntentionNodeInput {
  return {
    id,
    kind: "strategy",
    statement: `strategy ${id}`,
    owner: "human",
    status: "raw",
    success_signal: {
      observable: "last_exercised on every delegation record",
      sensor: DELEGATION_SENSOR_NAME,
      threshold: "no record's last_exercised is null",
      is_proxy: false,
    },
  };
}

describe("readDelegationRecords", () => {
  it("extracts exercise-relevant fields from every delegation node", () => {
    const dir = tempStore();
    writeNode(dir, delegationNode("delegation-a", { lastExercised: "2026-06-30" }));
    writeNode(dir, delegationNode("delegation-b", { lastExercised: null }));
    // A non-delegation node in the store is ignored.
    writeNode(dir, {
      id: "strategy-x",
      kind: "strategy",
      statement: "s",
      owner: "human",
      status: "raw",
    });

    const records = readDelegationRecords(dir);
    expect(records.map((r) => r.id)).toEqual(["delegation-a", "delegation-b"]);
    expect(records[0].lastExercised).toBe("2026-06-30");
    expect(records[1].lastExercised).toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });

  it("throws a clear error naming a record with malformed attributes", () => {
    const dir = tempStore();
    writeNode(
      dir,
      delegationNode("delegation-bad", {
        // review_trigger missing entirely — a malformed record.
        attributes: {
          origin: "chosen",
          irreversibility: { last_exercised: null },
          non_delegable_floor: "floor",
          last_assessed: "2026-07-02",
        },
      }),
    );
    expect(() => readDelegationRecords(dir)).toThrow(IntentionSchemaError);
    expect(() => readDelegationRecords(dir)).toThrow(/delegation-bad/);
    rmSync(dir, { recursive: true, force: true });
  });

  it("throws when irreversibility.last_exercised has the wrong type", () => {
    const dir = tempStore();
    writeNode(
      dir,
      delegationNode("delegation-wrongtype", {
        attributes: {
          origin: "chosen",
          irreversibility: { last_exercised: 42 },
          non_delegable_floor: "floor",
          review_trigger: "trigger",
          last_assessed: "2026-07-02",
        },
      }),
    );
    expect(() => readDelegationRecords(dir)).toThrow(/delegation-wrongtype.*last_exercised/s);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("readDelegationRecordsReading", () => {
  it("counts exercised, declined-class, and oldest last_assessed", () => {
    const dir = tempStore();
    writeNode(
      dir,
      delegationNode("delegation-exercised", { lastExercised: "2026-06-30", lastAssessed: "2026-07-05" }),
    );
    writeNode(
      dir,
      delegationNode("delegation-unexercised", { lastExercised: null, lastAssessed: "2026-07-01" }),
    );
    writeNode(
      dir,
      delegationNode("delegation-declined", {
        origin: "declined",
        lastExercised: null,
        lastAssessed: "2026-06-20",
      }),
    );

    const reading = readDelegationRecordsReading(dir, new Date("2026-07-11T00:00:00Z"));
    expect(reading).toBe(
      "1 of 3 delegation records exercised (last_exercised set); " +
        "1 declined-origin (no entered path to exercise); " +
        "oldest last_assessed 2026-06-20 (sensor read 2026-07-11)",
    );
    rmSync(dir, { recursive: true, force: true });
  });

  it("never counts a declined record as unexercised (its own class)", () => {
    const dir = tempStore();
    // Only a declined record: 0 exercised, 1 declined — not 1 unexercised.
    writeNode(
      dir,
      delegationNode("delegation-declined", { origin: "declined", lastExercised: null }),
    );
    const reading = readDelegationRecordsReading(dir, new Date("2026-07-11T00:00:00Z"));
    expect(reading).toContain("0 of 1 delegation records exercised");
    expect(reading).toContain("1 declined-origin");
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("renderDelegationRecordsReport", () => {
  it("renders one markdown row per record with escaped prose cells", () => {
    const dir = tempStore();
    writeNode(
      dir,
      delegationNode("delegation-a", {
        lastExercised: "2026-06-30",
        attributes: {
          origin: "chosen",
          irreversibility: { last_exercised: "2026-06-30" },
          non_delegable_floor: "a floor | with a pipe",
          review_trigger: "line one\nline two",
          last_assessed: "2026-07-02",
        },
      }),
    );
    const report = renderDelegationRecordsReport(dir);
    const lines = report.split("\n");
    expect(lines[0]).toContain("| id | origin | last_exercised |");
    expect(lines).toHaveLength(3); // header + separator + one row
    // Pipe escaped, newline collapsed so the table stays one row per record.
    expect(lines[2]).toContain("a floor \\| with a pipe");
    expect(lines[2]).toContain("line one line two");
    expect(lines[2]).not.toContain("line one\nline two");
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("buildDefaultRegistry", () => {
  it("registers the delegation sensor under the name the strategy declares", () => {
    const registry = buildDefaultRegistry();
    expect(registry.resolve(DELEGATION_SENSOR_NAME).name).toBe(DELEGATION_SENSOR_NAME);
  });
});

/** A fixture delegation node carrying an `attributes.divergence.level`. */
function delegationWithDivergence(
  id: string,
  divergenceLevel: string | undefined,
  attributesOverride?: Record<string, unknown>,
): IntentionNodeInput {
  const base = delegationNode(id);
  const attributes: Record<string, unknown> = {
    ...base.attributes,
    ...(divergenceLevel === undefined ? {} : { divergence: { level: divergenceLevel } }),
    ...attributesOverride,
  };
  return { ...base, attributes };
}

describe("makeDelegationRecordsSensor", () => {
  describe("strategy-exercise-recovery-paths branch", () => {
    it("matches the format: exercised k/n; m null; fixed review_trigger prose", () => {
      // Per the production implementation, this branch reads the REAL repo's
      // intentions/ dir (module-level `intentionsDir`), not the injected
      // `loadNodes` closure's dir — so this asserts the exact string format
      // against a count computed fresh from the live store, not a hardcoded
      // fixture expectation (which would drift as delegation records change).
      const realRecords = readDelegationRecords(realIntentionsDir);
      const n = realRecords.length;
      const k = realRecords.filter((r) => r.lastExercised !== null).length;
      const m = n - k;
      const expected = `exercised: ${k}/${n} records; ${m} null last_exercised; review_trigger firing not recorded`;

      // loadNodes is irrelevant to this branch, but still supplied per the
      // factory's signature — an empty fixture store proves the branch does
      // NOT depend on it.
      const sensor = makeDelegationRecordsSensor(() => []);
      const reading = sensor.read({
        id: "strategy-exercise-recovery-paths",
        kind: "strategy",
        statement: "s",
        owner: "human",
        status: "raw",
        parent: null,
        serves: [],
        recovers: [],
        rationale: null,
        reading: null,
        gap: null,
        clarifications: [],
        tooling_goals: [],
        success_signal: null,
        attention: null,
        phase: null,
        execution: null,
        validates: [],
        blocked_by: [],
        office_hours: null,
        pace_exempt: false,
        rounds: null,
        attributes: {},
      });
      expect(reading).toBe(expected);
    });
  });

  describe("strategy-realign-attachments branch", () => {
    it("reports 'none' uncovered when every high-divergence record has a recovers edge", () => {
      const dir = tempStore();
      writeNode(dir, delegationWithDivergence("delegation-high", "High"));
      writeNode(dir, delegationWithDivergence("delegation-low", "low"));
      writeNode(dir, {
        id: "strategy-covers-it",
        kind: "strategy",
        statement: "covers delegation-high",
        owner: "human",
        status: "raw",
        recovers: ["delegation-high"],
      });
      const node = readNode(dir, "delegation-high");
      const sensor = makeDelegationRecordsSensorForDir(dir);

      const reading = sensor.read({ ...node, id: "strategy-realign-attachments" });
      expect(reading).toBe("high-divergence: 1 records; 1 covered by recovers; uncovered: none");
      rmSync(dir, { recursive: true, force: true });
    });

    it("lists uncovered high-divergence record ids, sorted, comma-separated", () => {
      const dir = tempStore();
      writeNode(dir, delegationWithDivergence("delegation-z-high", "high"));
      writeNode(dir, delegationWithDivergence("delegation-a-high", "high"));
      writeNode(dir, delegationWithDivergence("delegation-low", "low"));
      const node = readNode(dir, "delegation-low");
      const sensor = makeDelegationRecordsSensorForDir(dir);

      const reading = sensor.read({ ...node, id: "strategy-realign-attachments" });
      expect(reading).toBe(
        "high-divergence: 2 records; 0 covered by recovers; uncovered: delegation-a-high, delegation-z-high",
      );
      rmSync(dir, { recursive: true, force: true });
    });

    it("treats missing/malformed divergence as not high-divergence, never throws", () => {
      const dir = tempStore();
      writeNode(dir, delegationWithDivergence("delegation-no-divergence", undefined));
      writeNode(dir, delegationWithDivergence("delegation-malformed", "high", { divergence: "not-an-object" }));
      const node = readNode(dir, "delegation-no-divergence");
      const sensor = makeDelegationRecordsSensorForDir(dir);

      const reading = sensor.read({ ...node, id: "strategy-realign-attachments" });
      expect(reading).toBe("high-divergence: 0 records; 0 covered by recovers; uncovered: none");
      rmSync(dir, { recursive: true, force: true });
    });
  });

  describe("fallback branch", () => {
    it("returns a total 'no per-node rule' string for any other node id, never throws", () => {
      const dir = tempStore();
      writeNode(dir, delegationNode("delegation-a"));
      const node = readNode(dir, "delegation-a");
      const sensor = makeDelegationRecordsSensorForDir(dir);

      const reading = sensor.read({ ...node, id: "some-unrelated-node" });
      expect(reading).toBe("no per-node rule for some-unrelated-node");
      rmSync(dir, { recursive: true, force: true });
    });
  });
});

/** Build a `makeDelegationRecordsSensor` whose `loadNodes` reads the given fixture dir. */
function makeDelegationRecordsSensorForDir(dir: string) {
  return makeDelegationRecordsSensor(() => listNodes(dir));
}

describe("readStoreSensors end-to-end", () => {
  it("writes reading and a non-null gap onto a strategy naming this sensor (exercise-recovery-paths format)", () => {
    const dir = tempStore();
    writeNode(dir, strategyNode("strategy-exercise-recovery-paths"));

    // Register the real per-id-dispatching sensor factory (not a hand-rolled
    // stand-in), with the fixture strategy's id set to
    // "strategy-exercise-recovery-paths" so the sensor's matching branch
    // fires. That branch (per the production implementation) reads the REAL
    // repo's intentions/ dir rather than this fixture store's dir — see the
    // "strategy-exercise-recovery-paths branch" describe block above — so the
    // expected reading is computed fresh from the live store, not hardcoded.
    const registry = new SensorRegistry();
    registry.register(makeDelegationRecordsSensor(() => listNodes(dir)));

    const summary = readStoreSensors(dir, registry);
    expect(summary.read).toBe(1);
    expect(summary.unregistered).toHaveLength(0);

    const realRecords = readDelegationRecords(realIntentionsDir);
    const n = realRecords.length;
    const k = realRecords.filter((r) => r.lastExercised !== null).length;
    const m = n - k;

    const strategy = readNode(dir, "strategy-exercise-recovery-paths");
    expect(strategy.reading).toBe(
      `exercised: ${k}/${n} records; ${m} null last_exercised; review_trigger firing not recorded`,
    );
    expect(strategy.gap).not.toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });
});
