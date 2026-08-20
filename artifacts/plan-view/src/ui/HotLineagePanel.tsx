import { useState } from "react";
import { hotLineage, ZERO_NOTE } from "../hot-lineage.js";
import type { LineageHeat } from "../hot-lineage.js";
import type { PlanRow } from "../model.js";

export interface HotLineagePanelProps {
  rows: PlanRow[];
  titles: Record<string, string>;
  progress: Record<string, { done: number; total: number }>;
  delegations: Record<string, string[]>;
  filtered: boolean;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function HeatRow(props: { entry: LineageHeat; max: number; titles: Record<string, string> }) {
  const { entry, max, titles } = props;
  const heat = entry.undecomposed + entry.inFlight;
  const scale = max > 0 ? 100 / max : 0;
  const undecomposedWidth = entry.undecomposed * scale;
  const inFlightWidth = entry.inFlight * scale;
  const title = titles[entry.id];

  return (
    <div className="pv-heat-row">
      <span className="pv-heat-name" title={title ?? entry.id}>
        {entry.id}
      </span>
      <span className="pv-heat-track">
        <span
          className="pv-heat-bar pv-heat-inflight"
          style={{ left: 0, width: `${inFlightWidth}%` }}
        />
        <span
          className="pv-heat-bar pv-heat-undecomposed"
          style={{
            /* 2px surface gap between the two fills so they never read as one
             * block — the segment spacer /dataviz requires on stacked marks. */
            left: `calc(${inFlightWidth}% + 2px)`,
            width: `max(0px, calc(${undecomposedWidth}% - 2px))`,
          }}
        />
      </span>
      <span className="pv-heat-value">
        {entry.delegation && heat === 0 ? (
          <span className="pv-heat-zero">{ZERO_NOTE}</span>
        ) : (
          <>
            {heat.toFixed(1)} · {pct(entry.share)} · {entry.done}/{entry.total} done
          </>
        )}
      </span>
    </div>
  );
}

export function HotLineagePanel(props: HotLineagePanelProps) {
  const { rows, titles, progress, delegations, filtered } = props;
  const [showTable, setShowTable] = useState(false);
  const { entries, others, total } = hotLineage(rows, progress, delegations);
  const all = others === null ? entries : [...entries, others];
  const max = all.reduce((m, e) => Math.max(m, e.undecomposed + e.inFlight), 0);

  return (
    <section className="pv-panel">
      <div className="pv-panel-head">
        <h2 className="pv-panel-title">
          Hot lineage — score contribution{filtered ? " (filtered)" : ""}
        </h2>
        <div className="pv-legend">
          <span className="pv-legend-item">
            <span className="pv-swatch" style={{ background: "var(--heat-strong)" }} />
            in-flight
          </span>
          <span className="pv-legend-item">
            <span className="pv-swatch" style={{ background: "var(--heat-soft)" }} />
            undecomposed
          </span>
          <button
            type="button"
            className="pv-toggle"
            aria-pressed={showTable}
            onClick={() => setShowTable((v) => !v)}
          >
            table view
          </button>
        </div>
      </div>

      {all.length === 0 ? (
        <p className="pv-empty">No lineage in scope.</p>
      ) : showTable ? (
        <div className="pv-table-scroll">
          <table className="pv-table">
            <thead>
              <tr>
                <th>ancestor</th>
                <th>undecomposed</th>
                <th>in-flight</th>
                <th>share</th>
                <th>progress</th>
              </tr>
            </thead>
            <tbody>
              {all.map((entry) => (
                <tr key={entry.id}>
                  <td className="pv-id" title={titles[entry.id] ?? entry.id}>
                    {entry.id}
                  </td>
                  <td>{entry.undecomposed.toFixed(1)}</td>
                  <td>{entry.inFlight.toFixed(1)}</td>
                  <td>{entry.delegation && entry.share === 0 ? ZERO_NOTE : pct(entry.share)}</td>
                  <td>
                    {entry.done}/{entry.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        all.map((entry) => (
          <HeatRow key={entry.id} entry={entry} max={max} titles={titles} />
        ))
      )}

      <p className="pv-note">
        Share is an exact decomposition of the ranking, not a proxy: a row&rsquo;s rank is the
        deduplicated sum of its distinct ancestors&rsquo; authored injections, so summing each
        ancestor across the rows it reaches partitions the window total ({total.toFixed(1)})
        exactly. The gap between the two populations is the signal — heavy undecomposed and light
        in-flight means a lineage is accumulating intent faster than it is being delivered.
        Progress counts are global, not filtered. Delegation lanes read{" "}
        <span className="pv-heat-zero">{ZERO_NOTE}</span> — the resolver distributes authored value
        along parent/serves only, so a <code>recovers</code> ancestor has no decomposed share yet;
        that is structurally unavailable, not cold.
      </p>
    </section>
  );
}
