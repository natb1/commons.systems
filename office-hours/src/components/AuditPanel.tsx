// React port of the audit-aggregate panel. The chart is the imperative
// Observable Plot core renderAuditAggregateChart (audit-aggregate-chart.ts),
// which builds a detached .audit-aggregate-chart element holding BOTH sub-charts
// (per-phase spend on top, derived cache hit-rate below, sharing one x axis)
// plus the combined legend, from an AuditAggregate array. The core stays
// untouched — this component wraps it as a chart island: an effect appends the
// core's element into a ref'd <div> and returns a teardown that empties it, so
// React removes the prior render before re-running on a data change or on
// unmount. Empty-state (and the <2-window / duplicate-timestamp guards) are
// delegated to the core.
import { useEffect, useRef } from "react";
import { type AuditAggregate } from "../audit-aggregates.js";
import { renderAuditAggregateChart } from "../audit-aggregate-chart.js";

export interface AuditPanelProps {
  aggregates: AuditAggregate[];
}

export function AuditPanel({ aggregates }: AuditPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.appendChild(renderAuditAggregateChart(aggregates));
    return () => {
      host.replaceChildren();
    };
  }, [aggregates]);

  return <div ref={ref} />;
}
