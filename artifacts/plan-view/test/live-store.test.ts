import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listNodesStrict, selectGraphTargets } from "@commons-systems/intentionsutil";
import { hotLineage } from "../src/hot-lineage.js";
import { reverseBlockerIndex } from "../src/lineage.js";
import { buildRows, isOpenTactic, tacticPositions } from "../src/rows.js";
import { delegationIndex, progressIndex } from "../src/build-payload.js";
import { PHASE_LADDER } from "../src/model.js";
import type { LaneKind, Velocity } from "../src/model.js";

/**
 * Assertions against the LIVE store, not a fixture.
 *
 * `tactic-plan-view-table` requires the rendered order to equal the order
 * `selectGraphTargets` produces "asserted against the live store rather than a
 * fixture alone", and `tactic-plan-view-hot-lineage-panel` requires an
 * ancestor's reported share to equal its recomputed contribution on the same
 * terms. Both are build-time properties — the published page is a snapshot and
 * has no runtime graph read — so this is where they are checked.
 *
 * These read `intentions/` directly and are therefore sensitive to the store's
 * actual content. They assert INVARIANTS (order equality, exact decomposition),
 * never counts, so a routine graph change cannot make them fail spuriously.
 *
 * "Never counts" is meant literally, including the degenerate count: every
 * assertion here must hold on a store that legitimately yields zero rows. An
 * assertion that reads a positive row count is asserting something about the
 * graph's contents, not about this code, and it contradicts
 * `artifacts/plan-view/scripts/render-smoke.mjs`, which renders an emptied
 * store as a supported snapshot and requires the empty state instead. Shape,
 * field presence and round-tripping express the same intent and survive it.
 */
const INTENTIONS = resolve(import.meta.dirname, "../../../intentions");
const VELOCITY: Velocity = { perDay: 2, windowDays: 28, closures: 56, created: 60 };
const TODAY = new Date("2026-08-13T00:00:00Z");

const nodes = listNodesStrict(INTENTIONS);
const rows = buildRows({ nodes, velocity: VELOCITY, today: TODAY });

describe("live store", () => {
  it("emits exactly one row per open tactic, and nothing else", () => {
    // The round trip the old `rows.length > 0` canary was standing in for: the
    // row set IS the open-tactic set, recovered from the nodes independently of
    // `buildRows`' own loop. Equality catches a dropped row, a duplicated row
    // and a row for a done/non-tactic node — none of which a count can see —
    // and it holds on a store with no open tactics, where both sides are empty.
    const open = nodes.filter(isOpenTactic).map((n) => n.id);
    expect([...rows.map((r) => r.id)].sort()).toEqual([...open].sort());
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it("gives every row the full payload shape", () => {
    for (const row of rows) {
      expect(typeof row.id, row.id).toBe("string");
      expect(row.id.length, "empty row id").toBeGreaterThan(0);
      expect(typeof row.statement, row.id).toBe("string");
      expect(Number.isFinite(row.tier), `${row.id} tier`).toBe(true);
      expect(Array.isArray(row.spine), `${row.id} spine`).toBe(true);
      expect(Array.isArray(row.lanes), `${row.id} lanes`).toBe(true);
      expect(Array.isArray(row.sources), `${row.id} sources`).toBe(true);
      expect(Array.isArray(row.labels), `${row.id} labels`).toBe(true);
      expect(typeof row.draft, `${row.id} draft`).toBe("boolean");
      // A draft is exactly a null phase; the pip index agrees with the ladder.
      expect(row.draft, `${row.id} draft disagrees with phase`).toBe(row.phase === null);
      expect(row.phaseIndex, `${row.id} phaseIndex`).toBe(
        row.phase === null ? -1 : PHASE_LADDER.indexOf(row.phase),
      );
      // Position and reason are exclusive: one or the other, never both, never
      // neither. This is what "no blank cell" means at the payload level.
      expect(row.position === null, `${row.id} position/reason are not exclusive`).toBe(
        row.reason !== null,
      );
    }
  });

  it("renders the router's order, not a comparator of its own", () => {
    const routerOrder = selectGraphTargets(nodes)
      .candidates.filter((c) => c.kind === "tactic")
      .map((c) => c.id);
    const rendered = rows.filter((r) => r.position !== null).map((r) => r.id);
    expect(rendered).toEqual(routerOrder);
  });

  it("gives every row a date or a typed reason, never a blank", () => {
    for (const row of rows) {
      if (row.position === null) {
        expect(row.reason, `${row.id} has no position and no reason`).not.toBeNull();
      } else {
        expect(row.eta, `${row.id} is scheduled with no date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("never gives a parked row a position", () => {
    for (const row of rows) {
      if (row.labels.includes("parked")) expect(row.position).toBeNull();
    }
  });

  it("keeps positions dense and 1-based", () => {
    const positions = rows
      .map((r) => r.position)
      .filter((p): p is number => p !== null)
      .sort((a, b) => a - b);
    // The whole sequence, not just its endpoints: `1..n` with no gap and no
    // repeat. Reading `positions[0]` would have been `undefined` on a store
    // with nothing scheduled, which is the same degenerate-count dependency the
    // header disclaims; comparing the whole array is both stronger and empty-safe.
    expect(positions).toEqual(positions.map((_, index) => index + 1));
  });

  it("decomposes the window total exactly", () => {
    const progress = progressIndex(nodes);
    const delegations = delegationIndex(nodes);
    const { entries, others, total } = hotLineage(rows, progress, delegations, 10_000);
    expect(others).toBeNull();
    const summed = entries.reduce((sum, e) => sum + e.undecomposed + e.inFlight, 0);
    expect(summed).toBeCloseTo(total, 6);

    // Independently recomputed from the rows, not from the panel's own maps.
    const recomputed = rows.reduce(
      (sum, row) => sum + row.sources.reduce((s, source) => s + source.amount, 0),
      0,
    );
    expect(total).toBeCloseTo(recomputed, 6);
  });

  it("agrees with tacticPositions on every scheduled row", () => {
    const positions = tacticPositions(nodes);
    for (const row of rows) {
      expect(row.position).toBe(positions.get(row.id) ?? null);
    }
  });

  it("lights a gutter lane for exactly the direct edges the spine drops", () => {
    // The invariant the old `> 0` count was proxying for. That count could only
    // notice off-spine ancestors having "silently stopped being computed" if
    // the store happened to contain such an edge; this recomputes the expected
    // lane set for EVERY row straight from the node relation — `parent`,
    // `serves`, `recovers`, and reverse `blocked_by` — minus self, minus the
    // spine, minus ids absent from the store, and demands equality. A lane that
    // stopped being computed fails here on the first row that has one, and a
    // store with no such edge has nothing to detect either way.
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const reverse = reverseBlockerIndex(nodes);
    const KINDS: LaneKind[] = ["strategy", "delegation", "blocker"];

    for (const row of rows) {
      const node = byId.get(row.id);
      expect(node, `${row.id} has a row but no node`).toBeDefined();
      if (node === undefined) continue;

      const onSpine = new Set(row.spine);
      // First-wins, in the documented precedence: `blocker` is the most
      // specific claim an edge can make and must not be overwritten by a later
      // `strategy` reading of the same id. Pinning the KIND and not just the id
      // is what makes that precedence testable at all.
      const expected = new Map<string, LaneKind>();
      const want = (id: string, kind: LaneKind): void => {
        if (id === row.id || onSpine.has(id) || !byId.has(id)) return;
        if (!expected.has(id)) expected.set(id, kind);
      };
      for (const blocked of reverse.get(row.id) ?? []) want(blocked, "blocker");
      for (const id of node.recovers) want(id, "delegation");
      if (node.parent !== null) want(node.parent, "strategy");
      for (const id of node.serves) want(id, "strategy");

      const pair = (id: string, kind: string): string => `${id}:${kind}`;
      expect(row.lanes.map((lane) => pair(lane.id, lane.kind)).sort(), `${row.id} lanes`).toEqual(
        [...expected].map(([id, kind]) => pair(id, kind)).sort(),
      );
      for (const lane of row.lanes) {
        expect(KINDS, `${row.id} lane ${lane.id} has an unknown kind`).toContain(lane.kind);
      }
    }
  });
});
