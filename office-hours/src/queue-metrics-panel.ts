import { type QueueMetricsSnapshot } from "./queue-metrics.js";

/**
 * Renders the queue metrics panel: queue depth, net drain rate, and runway.
 *
 * Takes no `now`: the snapshot is rendered as-is, mirroring the `pace` and
 * `history` panels whose render fns also omit `now`. The panel-registry render
 * signature supplies `now` but a render fn is free to ignore it.
 */
export function renderQueueMetricsPanel(
  metrics: QueueMetricsSnapshot | null,
): HTMLElement {
  const section = document.createElement("section");

  const heading = document.createElement("h2");
  heading.className = "queue-metrics-heading";
  heading.textContent = "QUEUE";
  section.appendChild(heading);

  if (metrics === null) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No queue metrics yet.";
    section.appendChild(empty);
    return section;
  }

  const cards = document.createElement("div");
  cards.className = "capacity-cards";

  // Queue depth card
  const depthCard = document.createElement("div");
  depthCard.className = "capacity-card";
  const depthLabel = document.createElement("span");
  depthLabel.className = "capacity-card-label";
  depthLabel.textContent = "queue depth";
  const depthValue = document.createElement("span");
  depthValue.className = "capacity-card-value queue-depth-value";
  depthValue.textContent = String(metrics.openHelpWanted);
  depthCard.appendChild(depthLabel);
  depthCard.appendChild(depthValue);

  // Net drain/day card
  const drainCard = document.createElement("div");
  drainCard.className = "capacity-card";
  const drainLabel = document.createElement("span");
  drainLabel.className = "capacity-card-label";
  drainLabel.textContent = "net drain";
  const drainValue = document.createElement("span");
  drainValue.className = "capacity-card-value queue-drain-value";
  drainValue.textContent = `${metrics.netDrainPerDay.toFixed(1)}/day`;
  drainCard.appendChild(drainLabel);
  drainCard.appendChild(drainValue);

  // Runway card
  const runwayCard = document.createElement("div");
  runwayCard.className = "capacity-card";
  const runwayLabel = document.createElement("span");
  runwayLabel.className = "capacity-card-label";
  runwayLabel.textContent = "runway";
  const runwayValue = document.createElement("span");
  runwayValue.className = "capacity-card-value queue-runway-value";
  runwayValue.textContent =
    metrics.runwayDays !== null ? `${metrics.runwayDays} days` : "growing";
  runwayCard.appendChild(runwayLabel);
  runwayCard.appendChild(runwayValue);

  cards.appendChild(depthCard);
  cards.appendChild(drainCard);
  cards.appendChild(runwayCard);
  section.appendChild(cards);

  return section;
}
