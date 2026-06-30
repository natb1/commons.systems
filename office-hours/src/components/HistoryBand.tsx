// React port of the capacity history band (history-band.ts). The worker-history
// chart is an imperative Observable Plot core (renderWorkerHistoryChart) that
// builds a detached element from a samples array. It stays untouched — this
// component wraps it as a chart island: an effect appends the core's returned
// element into a ref'd <div> and returns a teardown that empties it, so React
// removes the prior render before re-running on a data change or on unmount
// (mirrors budget's CategorySankey island).
//
// The section structure and class names match renderHistoryBand verbatim:
// section.capacity-history > h2.capacity-history-heading ("HISTORY") + the
// chart island. The core renders its own empty-state element for an empty
// samples array, so empty-state is delegated exactly as in the vanilla band.
import { useEffect, useRef } from "react";
import { type UsageSample } from "../usage-samples.js";
import { renderWorkerHistoryChart } from "../worker-history-chart.js";

export interface HistoryBandProps {
  samples: UsageSample[];
  /**
   * Extra class(es) for the panel root. Dashboard threads "panel-grid-full"
   * here so the class lands on this section — the direct grid child — exactly
   * as the vanilla buildPanelElement did with `el.classList.add`. This keeps
   * the `.panel-grid > .capacity-history` margin-zeroing selector matching.
   */
  className?: string;
}

/** Mounts an imperative chart core (samples -> HTMLElement) into a ref'd div. */
function ChartIsland({
  samples,
  build,
}: {
  samples: UsageSample[];
  build: (samples: UsageSample[]) => HTMLElement;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const el = build(samples);
    host.appendChild(el);
    // React runs this teardown before re-running the effect (data change) or on
    // unmount, so a prior render's DOM never accumulates.
    return () => {
      host.replaceChildren();
    };
    // build is a stable module function; samples drives the rebuild.
  }, [samples, build]);

  return <div ref={ref} />;
}

/**
 * The capacity history band: the worker-history chart (active vs target
 * workers) over the full usage-samples time series. The chart is an imperative
 * Observable Plot island; empty-state is delegated to the core.
 */
export function HistoryBand({ samples, className }: HistoryBandProps) {
  return (
    <section className={className ? `capacity-history ${className}` : "capacity-history"}>
      <h2 className="capacity-history-heading">HISTORY</h2>
      <ChartIsland samples={samples} build={renderWorkerHistoryChart} />
    </section>
  );
}
