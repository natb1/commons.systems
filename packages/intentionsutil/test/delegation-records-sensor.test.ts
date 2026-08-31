import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import { readingDate } from "../src/router.js";
import { SensorRegistry, deriveGap } from "../src/sensors.js";
import { listNodes, readNode, writeNode } from "../src/store.js";
import type { IntentionNodeInput } from "../src/schema.js";
import {
  EXERCISE_RECOVERY_PATHS_MET_READING,
  buildDefaultRegistry,
  makeDelegationRecordsSensor,
  readDelegationRecords,
  readExerciseRecoveryPathsReading,
  readStoreSensors,
  renderDelegationRecordsReport,
} from "../scripts/read-sensors.js";

// The exact `success_signal.sensor` string on
// intentions/strategy-exercise-recovery-paths.md. Hardcoded here (not imported)
// so the test doubles as a guard: a rename of the production constant that
// diverges from the strategy's declared sensor name fails this suite.
const DELEGATION_SENSOR_NAME = "the delegation records themselves";

// Every branch of the delegation-records sensor is exercised against an
// injected fixture store: `loadNodes` for the `strategy-realign-attachments`
// branch, and `makeDelegationRecordsSensor`'s `recordsDir` parameter for the
// `strategy-exercise-recovery-paths` branch (which reads records straight off
// disk). No test here reads the real repo's `intentions/` dir — that would
// couple unit-test CI to mutable content and would derive the expected value
// by re-running the very helper under test.

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

// The declined-origin rule, asserted against the reader that actually lands a
// reading on a node. These two cases were written for the id-blind
// `readDelegationRecordsReading`, which had zero production callers and has now
// been deleted; they are RETARGETED here rather than removed, because they hold
// the only assertions of the declined-origin rule in the repo. The rule is
// load-bearing, not cosmetic: a `origin: declined` delegation was never entered,
// so its `last_exercised` can never be set, and counting it as unexercised makes
// this strategy's absolute threshold permanently unsatisfiable.
const PINNED_NOW = new Date("2026-07-11T00:00:00Z");

describe("readExerciseRecoveryPathsReading", () => {
  it("counts exercised over ACTIVE records and breaks out the declined class", () => {
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

    const reading = readExerciseRecoveryPathsReading(dir, PINNED_NOW);
    // 3 records, 1 declined → 2 active, 1 of them exercised, 1 null. The
    // declined record is in neither the numerator nor the null count.
    expect(reading).toBe(
      "exercised: 1/2 active records (1 declined-origin excluded); 1 null last_exercised; " +
        "review_trigger firing not recorded (sensor read 2026-07-11)",
    );
    rmSync(dir, { recursive: true, force: true });
  });

  it("never counts a declined record as unexercised (its own class)", () => {
    const dir = tempStore();
    // Only a declined record: 0 active, 1 declined — not 1 unexercised.
    writeNode(
      dir,
      delegationNode("delegation-declined", { origin: "declined", lastExercised: null }),
    );
    const reading = readExerciseRecoveryPathsReading(dir, PINNED_NOW);
    expect(reading).toContain("1 declined-origin excluded");
    expect(reading).toContain("0 null last_exercised");
    expect(reading).not.toContain("1 null last_exercised");
    // ...and a store with no ACTIVE record is never reported met: "every active
    // record is exercised" is vacuously true over zero records, and a green off
    // zero measured paths would be a false all-clear.
    expect(reading).not.toBe(EXERCISE_RECOVERY_PATHS_MET_READING);
    rmSync(dir, { recursive: true, force: true });
  });

  it("emits the canonical date-free MET literal once every ACTIVE record is exercised", () => {
    const dir = tempStore();
    writeNode(dir, delegationNode("delegation-a", { lastExercised: "2026-06-30" }));
    writeNode(dir, delegationNode("delegation-b", { lastExercised: "2026-07-01" }));
    // The declined record stays null forever and must NOT hold the met state back.
    writeNode(
      dir,
      delegationNode("delegation-declined", { origin: "declined", lastExercised: null }),
    );

    const reading = readExerciseRecoveryPathsReading(dir, PINNED_NOW);
    // Hardcoded, not derived from the exported constant: this is the byte-exact
    // string that must be copied into `success_signal.threshold`, and asserting
    // it against the constant would pass for any value the constant took.
    expect(reading).toBe(
      "exercised: every non-declined delegation record has last_exercised set; " +
        "review_trigger firing not recorded",
    );
    // No date, no counts — the two things that make a reading unable to equal a
    // fixed threshold.
    expect(reading).not.toMatch(/\d/);
    // The exported constant is the same literal, so a node authored from it is
    // authored from what the sensor emits.
    expect(EXERCISE_RECOVERY_PATHS_MET_READING).toBe(reading);
    rmSync(dir, { recursive: true, force: true });
  });

  it("MET state drives deriveGap to null on a node whose threshold is that literal", () => {
    // The assertion that proves the whole unit: `deriveGap` is trimmed,
    // case-insensitive string EQUALITY, so a met state is only reachable if the
    // reader emits a fixed literal a threshold can equal.
    const dir = tempStore();
    writeNode(dir, delegationNode("delegation-a", { lastExercised: "2026-06-30" }));
    writeNode(
      dir,
      delegationNode("delegation-declined", { origin: "declined", lastExercised: null }),
    );
    writeNode(dir, {
      ...strategyNode("strategy-exercise-recovery-paths"),
      success_signal: {
        observable: "last_exercised on every delegation record",
        sensor: DELEGATION_SENSOR_NAME,
        threshold: EXERCISE_RECOVERY_PATHS_MET_READING,
        is_proxy: false,
      },
    });

    const registry = new SensorRegistry();
    registry.register(makeDelegationRecordsSensor(() => listNodes(dir), dir, FIXED_NOW));
    readStoreSensors(dir, registry);

    const strategy = readNode(dir, "strategy-exercise-recovery-paths");
    expect(strategy.reading).toBe(EXERCISE_RECOVERY_PATHS_MET_READING);
    expect(deriveGap(strategy)).toBeNull();
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

// A pinned clock for the `now` injection point. Both per-strategy readings end
// with `(sensor read <YYYY-MM-DD>)` — the token the router's fresh-reading gate
// (`readingDate`, src/router.ts) parses; a strategy whose reading carries no
// parseable date is dropped with a `stale-reading` event once
// `rounds.last_aligned` is stamped. Pinning the clock keeps the asserted date
// clause exact instead of flaking across UTC midnight.
const FIXED_NOW = (): Date => new Date("2026-07-11T00:00:00Z");
const FIXED_READ_DATE = "2026-07-11";

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
    it("matches the UNMET format: exercised k/n active; m null; fixed review_trigger prose", () => {
      // Fixture store: 2 of 3 delegation records exercised, 1 null, none
      // declined. The expectation is hardcoded from those fixtures — never
      // derived by re-running the helper under test.
      const dir = tempStore();
      writeNode(dir, delegationNode("delegation-a", { lastExercised: "2026-06-30" }));
      writeNode(dir, delegationNode("delegation-b", { lastExercised: "2026-07-01" }));
      writeNode(dir, delegationNode("delegation-c", { lastExercised: null }));
      // A non-delegation node in the same store must not be counted.
      writeNode(dir, strategyNode("strategy-ignored"));
      const expected =
        "exercised: 2/3 active records (0 declined-origin excluded); 1 null last_exercised; " +
        `review_trigger firing not recorded (sensor read ${FIXED_READ_DATE})`;

      // loadNodes is irrelevant to this branch, but still supplied per the
      // factory's signature — an empty node list proves the branch does NOT
      // depend on it, reading `recordsDir` off disk instead.
      const sensor = makeDelegationRecordsSensor(() => [], dir, FIXED_NOW);
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
      expect(reading).toBe(expected);
      // The gate token itself, asserted explicitly: without a parseable date
      // the router drops this strategy from align selection.
      expect(reading).toMatch(/\(sensor read \d{4}-\d{2}-\d{2}\)$/);
      rmSync(dir, { recursive: true, force: true });
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
      expect(reading).toBe(
        "high-divergence: 1 records; 1 covered by recovers; " +
          `uncovered: none (sensor read ${FIXED_READ_DATE})`,
      );
      // The gate token itself, asserted explicitly: without a parseable date
      // the router drops this strategy from align selection.
      expect(reading).toMatch(/\(sensor read \d{4}-\d{2}-\d{2}\)$/);
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
        "high-divergence: 2 records; 0 covered by recovers; " +
          `uncovered: delegation-a-high, delegation-z-high (sensor read ${FIXED_READ_DATE})`,
      );
      rmSync(dir, { recursive: true, force: true });
    });

    it("reads compound levels by token: 'low-moderate' is not high, 'moderate-high' is", () => {
      // The live corpus authors this field as compound free prose around the
      // declared low|moderate|high vocabulary (`low-moderate`,
      // `moderate — would-be`), so classification tokenizes rather than
      // comparing the whole string, and over-includes: a value naming `high`
      // at all belongs in the uncovered list.
      const dir = tempStore();
      writeNode(dir, delegationWithDivergence("delegation-compound-high", "moderate-high"));
      writeNode(dir, delegationWithDivergence("delegation-very-high", "very high"));
      writeNode(dir, delegationWithDivergence("delegation-low-moderate", "low-moderate"));
      writeNode(dir, delegationWithDivergence("delegation-prose", "moderate — would-be"));
      const node = readNode(dir, "delegation-low-moderate");
      const sensor = makeDelegationRecordsSensorForDir(dir);

      const reading = sensor.read({ ...node, id: "strategy-realign-attachments" });
      expect(reading).toBe(
        "high-divergence: 2 records; 0 covered by recovers; " +
          `uncovered: delegation-compound-high, delegation-very-high (sensor read ${FIXED_READ_DATE})`,
      );
      rmSync(dir, { recursive: true, force: true });
    });

    it("HALTS naming the record when divergence.level names no declared level", () => {
      // Fail-loud, not fail-open: silently reading an unrecognized level as
      // "not high" would drop the record from both numerator and denominator,
      // making a one-word edit in a data file a silent all-clear on the exact
      // condition this strategy exists to detect.
      const dir = tempStore();
      writeNode(dir, delegationWithDivergence("delegation-unknown-level", "critical"));
      const node = readNode(dir, "delegation-unknown-level");
      const sensor = makeDelegationRecordsSensorForDir(dir);

      const read = () => sensor.read({ ...node, id: "strategy-realign-attachments" });
      expect(read).toThrow(IntentionSchemaError);
      expect(read).toThrow(/delegation-unknown-level.*critical/s);
      rmSync(dir, { recursive: true, force: true });
    });

    it("HALTS naming the record when divergence is missing or not an object", () => {
      const missingDir = tempStore();
      writeNode(missingDir, delegationWithDivergence("delegation-no-divergence", undefined));
      const missingNode = readNode(missingDir, "delegation-no-divergence");
      const readMissing = () =>
        makeDelegationRecordsSensorForDir(missingDir).read({
          ...missingNode,
          id: "strategy-realign-attachments",
        });
      expect(readMissing).toThrow(IntentionSchemaError);
      expect(readMissing).toThrow(/delegation-no-divergence.*divergence/s);
      rmSync(missingDir, { recursive: true, force: true });

      const malformedDir = tempStore();
      writeNode(
        malformedDir,
        delegationWithDivergence("delegation-malformed", "high", { divergence: "not-an-object" }),
      );
      const malformedNode = readNode(malformedDir, "delegation-malformed");
      const readMalformed = () =>
        makeDelegationRecordsSensorForDir(malformedDir).read({
          ...malformedNode,
          id: "strategy-realign-attachments",
        });
      expect(readMalformed).toThrow(/delegation-malformed.*divergence/s);
      rmSync(malformedDir, { recursive: true, force: true });
    });

    it("HALTS naming the record when divergence.level is not a string", () => {
      const dir = tempStore();
      writeNode(
        dir,
        delegationWithDivergence("delegation-list-level", undefined, {
          divergence: { level: ["high", "moderate"] },
        }),
      );
      const node = readNode(dir, "delegation-list-level");
      const sensor = makeDelegationRecordsSensorForDir(dir);

      const read = () => sensor.read({ ...node, id: "strategy-realign-attachments" });
      expect(read).toThrow(/delegation-list-level.*level must be a string/s);
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

/**
 * Build a `makeDelegationRecordsSensor` reading the given fixture dir through
 * every injection point — `loadNodes`, `recordsDir`, and the pinned clock.
 */
function makeDelegationRecordsSensorForDir(dir: string) {
  return makeDelegationRecordsSensor(() => listNodes(dir), dir, FIXED_NOW);
}

describe("readStoreSensors end-to-end", () => {
  it("writes reading (from which deriveGap derives a non-null gap) onto a strategy naming this sensor (exercise-recovery-paths format)", () => {
    const dir = tempStore();
    writeNode(dir, strategyNode("strategy-exercise-recovery-paths"));
    // Fixture records the sensor counts: 1 of 2 exercised, 1 null.
    writeNode(dir, delegationNode("delegation-a", { lastExercised: "2026-06-30" }));
    writeNode(dir, delegationNode("delegation-b", { lastExercised: null }));

    // Register the real per-id-dispatching sensor factory (not a hand-rolled
    // stand-in), with the fixture strategy's id set to
    // "strategy-exercise-recovery-paths" so the sensor's matching branch
    // fires. Both injection points — `loadNodes` and `recordsDir` — point at
    // this fixture store, so the reading below is a hardcoded fixture
    // expectation and the run never touches the live intentions/ dir.
    const registry = new SensorRegistry();
    registry.register(makeDelegationRecordsSensor(() => listNodes(dir), dir, FIXED_NOW));

    const summary = readStoreSensors(dir, registry);
    expect(summary.read).toBe(1);
    expect(summary.written).toBe(1);
    expect(summary.unregistered).toHaveLength(0);

    const strategy = readNode(dir, "strategy-exercise-recovery-paths");
    expect(strategy.reading).toBe(
      "exercised: 1/2 active records (0 declined-origin excluded); 1 null last_exercised; " +
        `review_trigger firing not recorded (sensor read ${FIXED_READ_DATE})`,
    );
    // The persisted reading carries the date the router's fresh-reading gate
    // parses — the whole point of the clause.
    expect(readingDate(strategy.reading ?? "")).toBe(FIXED_READ_DATE);
    expect(deriveGap(strategy)).not.toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });
});
