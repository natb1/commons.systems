import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import { SensorRegistry } from "../src/sensors.js";
import { readNode, writeNode } from "../src/store.js";
import type { IntentionNodeInput } from "../src/schema.js";
import {
  buildDefaultRegistry,
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

describe("readStoreSensors end-to-end", () => {
  it("writes reading and a non-null gap onto a strategy naming this sensor", () => {
    const dir = tempStore();
    writeNode(dir, delegationNode("delegation-a", { lastExercised: null }));
    writeNode(dir, strategyNode("strategy-exercise-fixture"));

    // The production sensor closes over the repo's own intentions dir, so build
    // a registry whose delegation sensor reads THIS fixture store instead.
    const registry = new SensorRegistry();
    registry.register({
      name: DELEGATION_SENSOR_NAME,
      read: () => readDelegationRecordsReading(dir, new Date("2026-07-11T00:00:00Z")),
    });

    const summary = readStoreSensors(dir, registry);
    expect(summary.read).toBe(1);
    expect(summary.unregistered).toHaveLength(0);

    const strategy = readNode(dir, "strategy-exercise-fixture");
    expect(strategy.reading).toContain("0 of 1 delegation records exercised");
    expect(strategy.gap).not.toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });
});
