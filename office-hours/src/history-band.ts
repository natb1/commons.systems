import { type UsageSample } from "./usage-samples.js";
import { renderWorkerHistoryChart } from "./worker-history-chart.js";

/**
 * Renders the capacity history band: the worker-history chart (active vs
 * target workers) over the full usage-samples time series.
 *
 * Unlike renderCapacityBand, this takes no `now`: the chart's x-axis is
 * data-driven, so a `now` argument would be unused and rejected by lint
 * (no-unused-vars). Empty-state is delegated to the chart module — it
 * renders its own "No … history to chart." element.
 */
export function renderHistoryBand(samples: UsageSample[]): HTMLElement {
  const section = document.createElement("section");
  section.className = "capacity-history";

  const heading = document.createElement("h2");
  heading.className = "capacity-history-heading";
  heading.textContent = "HISTORY";
  section.appendChild(heading);

  section.appendChild(renderWorkerHistoryChart(samples));

  return section;
}
