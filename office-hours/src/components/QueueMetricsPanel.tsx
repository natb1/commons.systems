import { Metric } from "@commons-systems/ds";
import { type QueueMetricsSnapshot } from "../queue-metrics.js";

export interface QueueMetricsPanelProps {
  metrics: QueueMetricsSnapshot | null;
}

/**
 * React port of the render half of `renderQueueMetricsPanel`
 * (queue-metrics-panel.ts): queue depth, net drain/growth rate, and runway.
 * The compute logic (growing relabel, negative-runway guard, null handling) is
 * preserved verbatim; only the DOM-building becomes JSX. The three cards use
 * the DS `Metric` component.
 *
 * Takes no `now`: the snapshot is rendered as-is, mirroring the vanilla render
 * fn.
 */
export function QueueMetricsPanel(props: QueueMetricsPanelProps) {
  const { metrics } = props;

  if (metrics === null) {
    return (
      <section>
        <h2 className="queue-metrics-heading">QUEUE</h2>
        <p className="empty">No queue metrics yet.</p>
      </section>
    );
  }

  // A parked-only capture fabricates depth/rate/runway; render them as "—"
  // (unmeasured) so they are not mistaken for real zeros. Only `parked` is real.
  const unmeasured = metrics.scope === "parked-only";

  // A negative net-drain means the queue is growing, not draining. Relabel the
  // card to "net growth" and show the magnitude so the displayed sign stays
  // consistent with the label's meaning (mirrors the runway card's "growing").
  const isGrowing = metrics.netDrainPerDay < 0;
  const drainLabel = isGrowing ? "net growth" : "net drain";
  const runwayValue =
    metrics.runwayDays !== null && metrics.runwayDays >= 0
      ? `${metrics.runwayDays} days`
      : "growing";

  return (
    <section>
      <h2 className="queue-metrics-heading">QUEUE</h2>
      <div className="capacity-cards">
        <Metric
          className="capacity-card queue-depth-card"
          label="queue depth"
          value={unmeasured ? "—" : String(metrics.openHelpWanted)}
        />
        <Metric
          className="capacity-card queue-drain-card"
          label={drainLabel}
          value={unmeasured ? "—" : `${Math.abs(metrics.netDrainPerDay).toFixed(1)}/day`}
        />
        <Metric
          className="capacity-card queue-runway-card"
          label="runway"
          value={unmeasured ? "—" : runwayValue}
        />
      </div>
    </section>
  );
}
