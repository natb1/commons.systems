import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { strategyFingerprint } from "../src/router.js";
import { readNode, writeNode } from "../src/store.js";
import { computeFreshness } from "../scripts/compute-freshness.js";
import type { Execution, IntentionNodeInput } from "../src/schema.js";

// tactic-strategy-fingerprint-stamp-coverage Unit 2 — compute-freshness now
// SURFACES the per-strategy current hashes it already computed rather than
// discarding them, so `transition-node` can seed/refresh the tactic's
// `execution.strategy_fingerprint` map on a forward transition.
//
// The fixture is a real temp intentions dir built with `writeNode` (same
// construction pattern as strategy-stamp-census.test.ts / restamp-scope-
// fingerprint.test.ts) because `computeFreshness` reads a store directory.

const STRATEGY_A = "strategy-freshness-a";
const STRATEGY_B = "strategy-freshness-b";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-compute-freshness-"));
}

function execution(strategy_fingerprint: Execution["strategy_fingerprint"]): Execution {
  return { branch: "b", pr: null, attempts: {}, markers: [], strategy_fingerprint };
}

function tactic(id: string, extra: Partial<IntentionNodeInput> = {}): IntentionNodeInput {
  return {
    id,
    kind: "tactic",
    statement: `t ${id}`,
    owner: "ai",
    status: "codified",
    parent: null,
    serves: [],
    phase: "implement",
    ...extra,
  };
}

function strategy(id: string, statement: string): IntentionNodeInput {
  return {
    id,
    kind: "strategy",
    statement,
    owner: "ai",
    status: "codified",
    parent: null,
    serves: [],
  };
}

/**
 * Fixture: two strategies, plus
 *  - `tactic-multi`     — serves BOTH directly, stamped fresh for both.
 *  - `tactic-inherited`  — serves nothing directly; inherits STRATEGY_B via its
 *                          parent (the `servingStrategyIds` parent-chain walk).
 *  - `tactic-one-stale`  — serves both, stamped STALE for the FIRST serving
 *                          strategy and fresh for the second. The first-stale
 *                          ordering is deliberate: a loop that stopped at the
 *                          first stale strategy would drop the second hash.
 */
function fixture(): { dir: string; hashA: string; hashB: string } {
  const dir = tempDir();

  writeNode(dir, strategy(STRATEGY_A, "freshness fixture strategy A"));
  writeNode(dir, strategy(STRATEGY_B, "freshness fixture strategy B"));

  // Read back through the store so the hashes are computed over the validated
  // nodes `computeFreshness` itself will see.
  const hashA = strategyFingerprint(readNode(dir, STRATEGY_A));
  const hashB = strategyFingerprint(readNode(dir, STRATEGY_B));

  writeNode(
    dir,
    tactic("tactic-multi", {
      serves: [STRATEGY_A, STRATEGY_B],
      execution: execution({
        [STRATEGY_A]: { hash: hashA, sha: "deadbeef" },
        [STRATEGY_B]: { hash: hashB, sha: "deadbeef" },
      }),
    }),
  );

  writeNode(dir, tactic("tactic-parent", { serves: [STRATEGY_B] }));
  writeNode(
    dir,
    tactic("tactic-inherited", {
      parent: "tactic-parent",
      serves: [],
      execution: execution({ [STRATEGY_B]: { hash: hashB, sha: "deadbeef" } }),
    }),
  );

  writeNode(
    dir,
    tactic("tactic-one-stale", {
      serves: [STRATEGY_A, STRATEGY_B],
      execution: execution({
        [STRATEGY_A]: { hash: "0".repeat(64), sha: "deadbeef" },
        [STRATEGY_B]: { hash: hashB, sha: "deadbeef" },
      }),
    }),
  );

  return { dir, hashA, hashB };
}

function freshness(dir: string, id: string) {
  return computeFreshness({ id, snapshot: dir, stamp: null });
}

describe("computeFreshness strategyFingerprints", () => {
  it("carries an entry for every DIRECTLY served strategy, each the strategy's current hash", () => {
    const { dir, hashA, hashB } = fixture();
    const result = freshness(dir, "tactic-multi");

    expect(result.strategyFingerprints).toEqual({ [STRATEGY_A]: hashA, [STRATEGY_B]: hashB });
    expect(result.strategyStale).toBe(false);
  });

  it("carries strategies INHERITED through the parent chain, not just direct `serves`", () => {
    const { dir, hashB } = fixture();
    const result = freshness(dir, "tactic-inherited");

    // tactic-inherited's own `serves` is empty; STRATEGY_B reaches it only via
    // servingStrategyIds' parent walk.
    expect(result.strategyFingerprints).toEqual({ [STRATEGY_B]: hashB });
    expect(result.strategyStale).toBe(false);
  });

  it("still reports strategyStale when ANY ONE serving strategy is stale, and keeps EVERY hash", () => {
    const { dir, hashA, hashB } = fixture();
    const result = freshness(dir, "tactic-one-stale");

    expect(result.strategyStale).toBe(true);
    // The hashes are the strategies' CURRENT substance — including for the
    // strategy whose stamp is stale. The map is a report of current state, not
    // of staleness, and the stale entry does not truncate the collection.
    expect(result.strategyFingerprints).toEqual({ [STRATEGY_A]: hashA, [STRATEGY_B]: hashB });
  });

  it("returns an empty map for a node absent from the origin/main snapshot", () => {
    const { dir } = fixture();
    const result = freshness(dir, "tactic-not-on-main");

    expect(result.nodeOnMain).toBe(false);
    expect(result.strategyFingerprints).toEqual({});
    expect(result.strategyStale).toBe(false);
    expect(result.scopeStale).toBe(false);
    expect(result.stampMissing).toBe(true);
  });
});
