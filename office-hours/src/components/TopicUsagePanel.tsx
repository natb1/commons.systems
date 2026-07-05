// React port of the topic-usage dashboard panel. The chart is the imperative
// Observable Plot core renderTopicUsageChart (topic-usage-chart.ts), which
// builds a detached .topic-usage-chart element — one trailing-7-day moving-
// average line per bucket on the chosen axis, plus its legend — from a
// TopicUsageDoc array and an axis ("topic" | "type"). The core stays untouched.
//
// This component adds the axis toggle the core can't carry: a two-button group
// (Topic / Type) whose active button is reflected via aria-pressed. The selected
// axis is local state, defaulting to "topic". The chart is mounted as an island —
// an effect appends the core's element into a ref'd <div> and tears it down
// before re-running — keyed on BOTH docs and axis, so toggling the axis swaps the
// chart in place. Empty-state is delegated to the core ("No topic usage to
// chart.").
import { useEffect, useRef, useState } from "react";
import { type TopicUsageDoc } from "../topic-usage.js";
import {
  renderTopicUsageChart,
  type TopicUsageAxis,
} from "../topic-usage-chart.js";

export interface TopicUsagePanelProps {
  docs: TopicUsageDoc[];
  /** Extra class(es) for the panel root (Dashboard threads "panel-grid-full"). */
  className?: string;
}

/** Mounts the imperative topic-usage core, re-running whenever docs or axis change. */
function ChartIsland({ docs, axis }: { docs: TopicUsageDoc[]; axis: TopicUsageAxis }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.appendChild(renderTopicUsageChart(docs, axis));
    // React runs this teardown before re-running the effect (docs OR axis change)
    // or on unmount, so the prior chart never accumulates — the new axis swaps in.
    return () => {
      host.replaceChildren();
    };
  }, [docs, axis]);

  return <div ref={ref} />;
}

/**
 * The topic-usage band: the trailing-7-day moving average of token price-proxy
 * spend, charted per bucket on a toggleable axis (the nine topics, or the three
 * issue types). The axis defaults to "topic". Empty-state is delegated to the core.
 */
export function TopicUsagePanel({ docs, className }: TopicUsagePanelProps) {
  const [axis, setAxis] = useState<TopicUsageAxis>("topic");

  return (
    <section
      className={className ? `topic-usage-section ${className}` : "topic-usage-section"}
    >
      <h2 className="topic-usage-heading">TOKEN COST</h2>
      <div className="topic-usage-toggle" role="group" aria-label="Chart axis">
        <button
          type="button"
          className="topic-usage-toggle-button"
          aria-pressed={axis === "topic"}
          onClick={() => setAxis("topic")}
        >
          Topic
        </button>
        <button
          type="button"
          className="topic-usage-toggle-button"
          aria-pressed={axis === "type"}
          onClick={() => setAxis("type")}
        >
          Type
        </button>
      </div>
      <ChartIsland docs={docs} axis={axis} />
    </section>
  );
}
