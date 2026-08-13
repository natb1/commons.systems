import type { Lane, LaneKind, PlanRow } from "./model.js";

/**
 * Lane track width. Beyond this the gutter stops being a gutter — and the
 * identity of a 13th ancestor is better read from the row's own spine cell.
 */
export const LANE_SLOTS = 12;

export interface LaneSlot {
  id: string;
  kind: LaneKind;
  slot: number;
}

/**
 * Assign each off-spine ancestor a FIXED column slot across the rendered rows,
 * so a lane reads as a broken vertical band down the table rather than as an
 * unrelated tick per row.
 *
 * Slots are ordered by how many rows the ancestor touches (descending, id
 * ascending on ties), which keeps the busiest lanes leftmost and stable. An
 * ancestor past `LANE_SLOTS` shares the final overflow slot: it still lights,
 * so a multi-parent row never looks single-parent, but it stops claiming a
 * column of its own.
 */
export function assignLaneSlots(rows: PlanRow[], slots = LANE_SLOTS): Map<string, LaneSlot> {
  const counts = new Map<string, { kind: LaneKind; rows: number }>();
  for (const row of rows) {
    for (const lane of row.lanes) {
      const entry = counts.get(lane.id);
      if (entry === undefined) counts.set(lane.id, { kind: lane.kind, rows: 1 });
      else entry.rows += 1;
    }
  }

  const ordered = [...counts].sort((a, b) => {
    if (b[1].rows !== a[1].rows) return b[1].rows - a[1].rows;
    return a[0].localeCompare(b[0]);
  });

  const assigned = new Map<string, LaneSlot>();
  ordered.forEach(([id, entry], index) => {
    assigned.set(id, { id, kind: entry.kind, slot: Math.min(index, slots - 1) });
  });
  return assigned;
}

/** The slots a single row lights, as a fixed-width boolean track. */
export function laneTrack(
  lanes: Lane[],
  assigned: Map<string, LaneSlot>,
  slots = LANE_SLOTS,
): (LaneKind | null)[] {
  const track: (LaneKind | null)[] = new Array(slots).fill(null);
  for (const lane of lanes) {
    const slot = assigned.get(lane.id);
    if (slot === undefined) continue;
    // First writer wins per slot: in the shared overflow slot the busiest
    // ancestor's kind is the one already there, and overwriting it would make
    // the overflow column's hue flicker row to row.
    if (track[slot.slot] === null) track[slot.slot] = lane.kind;
  }
  return track;
}
