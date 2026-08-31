import { useMemo, useState } from "react";
import { applyFilter, EMPTY_FILTER, toggle } from "../filters.js";
import { LABELS } from "../model.js";
import type { PageData } from "../model.js";
import { HotLineagePanel } from "./HotLineagePanel.js";
import { PlanTable } from "./PlanTable.js";

const TIERS = [3, 2, 1];

function Metric(props: { value: string | number; label: string }) {
  return (
    <div className="pv-metric">
      <span className="pv-metric-value">{props.value}</span>
      <span className="pv-metric-label">{props.label}</span>
    </div>
  );
}

export function App({ data }: { data: PageData }) {
  const { payload, progress, delegations } = data;
  const [filter, setFilter] = useState(EMPTY_FILTER);

  const rows = useMemo(() => applyFilter(payload.rows, filter), [payload.rows, filter]);
  const filtered =
    filter.tiers.length > 0 || filter.labels.length > 0 || filter.query.trim() !== "";

  const { provenance, velocity, counts } = payload;

  return (
    <div className="pv-root">
      <header className="pv-header">
        <h1 className="pv-title">Plan view</h1>
        <div className="pv-stamp">
          <span>
            snapshot of <b>{provenance.ref}</b> at <b>{provenance.shaShort}</b>
          </span>
          <span>
            built <b>{provenance.builtAt.replace("T", " ").slice(0, 16)} UTC</b>
          </span>
          {provenance.clean ? null : <span className="pv-dirty">built from a DIRTY tree</span>}
          <span>
            velocity <b>{velocity.perDay.toFixed(2)}/day</b> ({velocity.closures} closed /{" "}
            {velocity.created} created over {velocity.windowDays}d)
          </span>
        </div>
      </header>

      <div className="pv-metrics">
        <Metric value={counts.openTactics} label="open tactics" />
        <Metric value={counts.selectable} label="scheduled" />
        <Metric value={counts.drafts} label="— undecomposed" />
        <Metric value={counts.phaseSet} label="— in flight" />
        <Metric value={counts.parked} label="parked" />
        <Metric value={counts.blocked} label="blocked" />
        <Metric value={rows.length} label="shown" />
      </div>

      <HotLineagePanel
        rows={rows}
        titles={payload.titles}
        progress={progress}
        delegations={delegations}
        filtered={filtered}
      />

      <div className="pv-filters">
        <div className="pv-filter-group">
          <span className="pv-filter-label">tier</span>
          {TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              className="pv-toggle"
              aria-pressed={filter.tiers.includes(tier)}
              onClick={() => setFilter((f) => ({ ...f, tiers: toggle(f.tiers, tier) }))}
            >
              {tier}
            </button>
          ))}
        </div>
        <div className="pv-filter-group">
          <span className="pv-filter-label">label</span>
          {LABELS.map((label) => (
            <button
              key={label}
              type="button"
              className="pv-toggle"
              aria-pressed={filter.labels.includes(label)}
              onClick={() => setFilter((f) => ({ ...f, labels: toggle(f.labels, label) }))}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="pv-search"
          type="search"
          placeholder="filter by id or statement"
          value={filter.query}
          onChange={(event) => setFilter((f) => ({ ...f, query: event.target.value }))}
        />
        {filtered ? (
          <button type="button" className="pv-toggle" onClick={() => setFilter(EMPTY_FILTER)}>
            clear
          </button>
        ) : null}
      </div>

      <div className="pv-legend" style={{ marginBottom: "0.5rem" }}>
        <span className="pv-legend-item">
          <span className="pv-swatch" style={{ background: "var(--lane-strategy)" }} />
          lane: strategy
        </span>
        <span className="pv-legend-item">
          <span className="pv-swatch" style={{ background: "var(--lane-delegation)" }} />
          lane: delegation
        </span>
        <span className="pv-legend-item">
          <span className="pv-swatch" style={{ background: "var(--lane-blocker)" }} />
          lane: blocker
        </span>
      </div>

      <PlanTable rows={rows} titles={payload.titles} filtered={filtered} />

      <footer className="pv-footer">
        <p>
          <b>This page is a snapshot.</b> A published claude artifact cannot read the intention
          store at runtime by any route, so every number above was computed in Node against{" "}
          {provenance.shaShort} at build time. Nothing here refreshes. Rebuild and republish to
          move it.
        </p>
        <p>
          Order comes from <code>selectGraphTargets</code> and <code>resolveAttention</code> — the
          same resolver and selector the dispatch router uses — not from a comparator invented for
          this page. ETA is <b>absolute</b>: it is the row&rsquo;s position over the whole queue and
          does not recompute under a filter, because hiding rows does not make the router arrive
          sooner. The hot-lineage panel deliberately does the opposite.
        </p>
        <p>
          Not yet built: row virtualization and the sticky span headers it requires (
          <code>tactic-ds-plan-table-primitive</code>) — the table renders its full row set, which
          is what makes literal <code>rowSpan</code> legal here. The band spine is read from the
          resolver&rsquo;s contribution ordering; it switches to the band-defining parent when{" "}
          <code>tactic-attention-namespaced-rank</code> lands.
        </p>
      </footer>
    </div>
  );
}
