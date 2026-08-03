import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { strategyFingerprint } from "../src/router.js";
import { readNode, writeNode } from "../src/store.js";
import { strategyStampCensus } from "../scripts/strategy-stamp-census.js";
import type { Execution, IntentionNodeInput } from "../src/schema.js";

// tactic-strategy-fingerprint-stamp-coverage Unit 1 — the stamp census.
// `strategyStampCensus` reads a store directory, so the fixture is a real
// temp intentions dir built with `writeNode` (same construction pattern as
// restamp-scope-fingerprint.test.ts) rather than an in-memory node array.

const STRATEGY = "strategy-census-fixture";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-stamp-census-"));
}

function execution(strategy_fingerprint: Execution["strategy_fingerprint"]): Execution {
  return {
    branch: "b",
    pr: null,
    attempts: {},
    markers: [],
    strategy_fingerprint,
  };
}

function tactic(id: string, extra: Partial<IntentionNodeInput> = {}): IntentionNodeInput {
  return {
    id,
    kind: "tactic",
    statement: `t ${id}`,
    owner: "ai",
    status: "codified",
    parent: null,
    serves: [STRATEGY],
    phase: "implement",
    ...extra,
  };
}

/**
 * Build the fixture store: one strategy, five open tactics serving it — one
 * per bucket, plus a second `keyed` one whose stamped hash is wrong (the only
 * node the soft-freeze should currently freeze).
 */
function fixture(): { dir: string; currentHash: string } {
  const dir = tempDir();

  writeNode(dir, {
    id: STRATEGY,
    kind: "strategy",
    statement: "census fixture strategy",
    owner: "ai",
    status: "codified",
    parent: null,
    serves: [],
  });

  // Read the strategy back through the store so the fingerprint is computed
  // over the validated node the census itself will see.
  const currentHash = strategyFingerprint(readNode(dir, STRATEGY));

  writeNode(
    dir,
    tactic("tactic-keyed-fresh", {
      execution: execution({ [STRATEGY]: { hash: currentHash, sha: "deadbeef" } }),
    }),
  );
  writeNode(
    dir,
    tactic("tactic-keyed-stale", {
      execution: execution({ [STRATEGY]: { hash: "0".repeat(64), sha: "deadbeef" } }),
    }),
  );
  writeNode(
    dir,
    tactic("tactic-bare-string", {
      execution: execution(currentHash),
    }),
  );
  writeNode(dir, tactic("tactic-null-stamp", { execution: null }));
  // The malformed FLAT shape: a map keyed "hash"/"sha" instead of by strategy id.
  writeNode(
    dir,
    tactic("tactic-mis-keyed", {
      execution: execution({ hash: currentHash, sha: "deadbeef" }),
    }),
  );

  return { dir, currentHash };
}

describe("strategyStampCensus", () => {
  it("sorts each open serving tactic into exactly one shape bucket", () => {
    const { dir } = fixture();
    const { strategies } = strategyStampCensus(dir);

    expect(strategies).toHaveLength(1);
    const s = strategies[0];
    expect(s.id).toBe(STRATEGY);
    expect(s.openTactics).toBe(5);

    expect(s.keyed.ids.sort()).toEqual(["tactic-keyed-fresh", "tactic-keyed-stale"]);
    expect(s.bareString.ids).toEqual(["tactic-bare-string"]);
    expect(s.nullStamp.ids).toEqual(["tactic-null-stamp"]);
    expect(s.misKeyed.ids).toEqual(["tactic-mis-keyed"]);

    // Buckets partition the population: the four counts sum to the open count.
    expect(s.keyed.count + s.misKeyed.count + s.bareString.count + s.nullStamp.count).toBe(
      s.openTactics,
    );
  });

  it("counts ONLY the keyed tactic whose stamped hash misses as stale", () => {
    const { dir } = fixture();
    const s = strategyStampCensus(dir).strategies[0];
    expect(s.stale.ids).toEqual(["tactic-keyed-stale"]);
  });

  it("rolls up shape counts across the covered strategies", () => {
    const { dir } = fixture();
    const { rollup } = strategyStampCensus(dir);

    expect(rollup).toEqual({
      strategies: 1,
      openTactics: 5,
      keyed: 2,
      misKeyed: 1,
      bareString: 1,
      nullStamp: 1,
      anyStamp: 4, // keyed + misKeyed + bareString
      mapForm: 3, // keyed + misKeyed
      stale: 1,
    });
  });

  it("excludes draft and done tactics — the freeze only applies to open ones", () => {
    const { dir } = fixture();
    writeNode(dir, tactic("tactic-draft", { phase: null }));
    writeNode(dir, tactic("tactic-done", { phase: "done" }));

    const s = strategyStampCensus(dir).strategies[0];
    expect(s.openTactics).toBe(5);
    expect(s.nullStamp.ids).toEqual(["tactic-null-stamp"]);
  });

  it("counts a tactic serving the strategy through its parent chain", () => {
    const { dir } = fixture();
    writeNode(
      dir,
      tactic("tactic-child", { parent: "tactic-null-stamp", serves: [] }),
    );

    const s = strategyStampCensus(dir).strategies[0];
    expect(s.openTactics).toBe(6);
    expect(s.nullStamp.ids.sort()).toEqual(["tactic-child", "tactic-null-stamp"]);
  });

  it("narrows both sections when a strategy id is given", () => {
    const { dir } = fixture();
    writeNode(dir, {
      id: "strategy-other",
      kind: "strategy",
      statement: "other",
      owner: "ai",
      status: "codified",
      parent: null,
      serves: [],
    });

    const all = strategyStampCensus(dir);
    expect(all.strategies.map((s) => s.id).sort()).toEqual([STRATEGY, "strategy-other"]);
    expect(all.rollup.strategies).toBe(2);

    const narrowed = strategyStampCensus(dir, STRATEGY);
    expect(narrowed.strategies.map((s) => s.id)).toEqual([STRATEGY]);
    expect(narrowed.rollup.strategies).toBe(1);
    expect(narrowed.rollup.openTactics).toBe(5);
  });
});
