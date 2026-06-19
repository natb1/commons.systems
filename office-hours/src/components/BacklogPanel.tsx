// React port of the backlog-history panel. The chart is the imperative
// Observable Plot core renderIssueHistoryChart (issue-history-chart.ts), which
// builds a detached .backlog-history element (stacked help-wanted/other areas,
// dashed runway projection, runway caption, legend) from an IssueSample array.
// The core stays untouched — this component wraps it as a chart island: an
// effect appends the core's element into a ref'd <div> and returns a teardown
// that empties it, so React removes the prior render before re-running on a
// data change or on unmount. Empty-state (and the <2-sample / duplicate-
// timestamp guards) are delegated to the core.
import { useEffect, useRef } from "react";
import { type IssueSample } from "../issue-samples.js";
import { renderIssueHistoryChart } from "../issue-history-chart.js";

export interface BacklogPanelProps {
  samples: IssueSample[];
  /** Extra class(es) for the panel root (Dashboard threads "panel-grid-full"). */
  className?: string;
}

export function BacklogPanel({ samples, className }: BacklogPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.appendChild(renderIssueHistoryChart(samples));
    return () => {
      host.replaceChildren();
    };
  }, [samples]);

  return <div ref={ref} className={className} />;
}
