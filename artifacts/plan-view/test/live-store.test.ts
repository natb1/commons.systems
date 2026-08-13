import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listNodesStrict, selectGraphTargets } from "@commons-systems/intentionsutil";
import { hotLineage } from "../src/hot-lineage.js";
import { buildRows, tacticPositions } from "../src/rows.js";
import { delegationIndex, progressIndex } from "../src/build-payload.js";
import type { Velocity } from "../src/model.js";

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
 */
const INTENTIONS = resolve(import.meta.dirname, "../../../intentions");
const VELOCITY: Velocity = { perDay: 2, windowDays: 28, closures: 56, created: 60 };
const TODAY = new Date("2026-08-13T00:00:00Z");

const nodes = listNodesStrict(INTENTIONS);
const rows = buildRows({ nodes, velocity: VELOCITY, today: TODAY });

describe("live store", () => {
  it("has rows to check", () => {
    expect(rows.length).toBeGreaterThan(0);
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
    expect(positions[0]).toBe(1);
    expect(positions[positions.length - 1]).toBe(positions.length);
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

  it("finds at least one multi-parent row lighting a gutter lane", () => {
    // If this ever reads zero, the lane gutter is rendering nothing and the
    // off-spine ancestors have silently stopped being computed.
    expect(rows.filter((row) => row.lanes.length > 0).length).toBeGreaterThan(0);
  });
});
