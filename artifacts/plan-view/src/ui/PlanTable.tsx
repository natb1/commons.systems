import { Badge } from "@commons-systems/ds";
import { spanRuns } from "../filters.js";
import { assignLaneSlots, laneTrack, LANE_SLOTS } from "../lane-slots.js";
import { PHASE_LADDER } from "../model.js";
import type { PlanRow, UnavailableReason } from "../model.js";

const CHIP_VARIANT: Record<string, "neutral" | "accent" | "success" | "error"> = {
  bug: "error",
  security: "error",
  outage: "error",
  parked: "neutral",
  delegated: "accent",
  blocked: "neutral",
};

function reasonText(reason: UnavailableReason): string {
  switch (reason.kind) {
    case "parked":
      return "unavailable — parked";
    case "blocked":
      return `unavailable — blocked by ${reason.by.join(", ")}`;
    case "container":
      return "unavailable — container";
    case "frozen":
      return "unavailable — frozen";
  }
}

/** A compact 5-segment ladder carrying per-row progress. */
function PhasePip(props: { phase: string | null; phaseIndex: number }) {
  if (props.phase === null) {
    return <span className="pv-pip-draft">draft</span>;
  }
  return (
    <span className="pv-pip" title={props.phase} aria-label={`phase ${props.phase}`}>
      {PHASE_LADDER.map((rung, index) => (
        <span key={rung} className={index <= props.phaseIndex ? "pv-pip-seg on" : "pv-pip-seg"} />
      ))}
    </span>
  );
}

export interface PlanTableProps {
  rows: PlanRow[];
  titles: Record<string, string>;
  /**
   * Whether a filter is narrowing `rows`. Load-bearing for the empty state
   * ONLY: zero rows has two unrelated causes and one message cannot serve both.
   * A store window with no open tactics is a legitimate state of the graph —
   * `scripts/render-smoke.mjs` synthesizes it and asserts it renders — and
   * telling that reader their filter matched nothing names a filter they never
   * set.
   */
  filtered: boolean;
}

export function PlanTable({ rows, titles, filtered }: PlanTableProps) {
  const slots = assignLaneSlots(rows);

  // Span extents are computed over the FULL rendered row set, which is what
  // makes a literal rowSpan legal here (see `spanRuns`). Level 1 is nested
  // inside level 0 by construction: level 0's value is a prefix of the row's
  // spine, so a level-1 run can never straddle a level-0 boundary.
  //
  // Every row contributes a value — a row with no scoring ancestor gets the
  // `—` sentinel rather than being skipped. Skipping it would emit a row with
  // fewer cells than its neighbours and shear the whole table sideways from
  // that point down.
  const level0 = spanRuns(rows.map((row) => row.spine[0] ?? "—"));
  const level1 = spanRuns(rows.map((row) => (row.spine[0] ?? "—") + " ▸ " + (row.spine[1] ?? "—")));
  const startsSpan0 = new Map(level0.map((run) => [run.start, run]));
  const startsSpan1 = new Map(level1.map((run) => [run.start, run]));

  if (rows.length === 0) {
    return (
      <p className="pv-empty">
        {filtered ? "No rows match the active filter." : "No open tactics in this snapshot."}
      </p>
    );
  }

  return (
    <div className="pv-table-scroll">
      <table className="pv-table">
        <thead>
          <tr>
            <th title="Effective tier — the outer ranking axis">tier</th>
            <th title="Band spine — the ancestor that set this row's rank">lineage</th>
            <th title="Second spine level">·</th>
            <th title="Off-spine ancestors, painted as vertical lanes">lanes</th>
            <th>node</th>
            <th>labels</th>
            <th title="today + position / velocity — absolute, never recomputed under a filter">
              ETA
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const run0 = startsSpan0.get(index);
            const run1 = startsSpan1.get(index);
            const track = laneTrack(row.lanes, slots);
            return (
              <tr key={row.id}>
                <td className="pv-tier">{row.tier}</td>
                {run0 === undefined ? null : (
                  <td className="pv-span" rowSpan={run0.length} title={titles[run0.value] ?? run0.value}>
                    {run0.value}
                  </td>
                )}
                {run1 === undefined ? null : (
                  <td className="pv-span" rowSpan={run1.length} title={run1.value}>
                    {row.spine[1] ?? "—"}
                  </td>
                )}
                <td>
                  <span
                    className="pv-lanes"
                    title={row.lanes.map((lane) => `${lane.kind}: ${lane.id}`).join("\n")}
                  >
                    {track.slice(0, LANE_SLOTS).map((kind, slot) => (
                      <span
                        key={slot}
                        className={kind === null ? "pv-lane" : `pv-lane pv-lane-on-${kind}`}
                      />
                    ))}
                  </span>
                </td>
                <td className="pv-id">
                  {row.id}
                  <span className="pv-statement">{row.statement}</span>
                </td>
                <td>
                  <span className="pv-chips">
                    {row.labels.map((label) => (
                      <Badge key={label} variant={CHIP_VARIANT[label] ?? "neutral"}>
                        {label}
                      </Badge>
                    ))}
                    <PhasePip phase={row.phase} phaseIndex={row.phaseIndex} />
                  </span>
                </td>
                <td className={row.eta === null ? "pv-unavailable" : "pv-eta"}>
                  {row.eta === null
                    ? row.reason === null
                      ? "unavailable"
                      : reasonText(row.reason)
                    : `${row.eta} · #${row.position}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
