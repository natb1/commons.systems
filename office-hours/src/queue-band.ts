import type { QueueMetricsSnapshot } from "./queue-metrics.js";

function buildCard(label: string, value: string): HTMLElement {
  const card = document.createElement("div");
  card.className = "queue-card";

  const labelSpan = document.createElement("span");
  labelSpan.className = "queue-card-label";
  labelSpan.textContent = label;

  const valueSpan = document.createElement("span");
  valueSpan.className = "queue-card-value";
  valueSpan.textContent = value;

  card.appendChild(labelSpan);
  card.appendChild(valueSpan);

  return card;
}

function runwayReadout(metrics: QueueMetricsSnapshot): { text: string; state: string } {
  // A parked-only capture fabricates the depth/rate/runway fields — reading them
  // as "empty"/"stable" would be a false measurement. Say so explicitly.
  if (metrics.scope === "parked-only") {
    return { text: "queue not measured (parked-only capture)", state: "unmeasured" };
  }
  if (metrics.openHelpWanted === 0) {
    return { text: "queue empty", state: "empty" };
  }
  if (metrics.runwayDays !== null && metrics.runwayDays >= 0) {
    const days = Math.ceil(metrics.runwayDays);
    const unit = days === 1 ? "day" : "days";
    return {
      text: `~${days} ${unit} until the queue empties`,
      state: "draining",
    };
  }
  if (metrics.netDrainPerDay === 0) {
    return { text: "queue stable", state: "stable" };
  }
  return { text: "queue growing", state: "growing" };
}

/**
 * Renders the queue status band from the latest dispatch-queue metrics snapshot.
 */
export function renderQueueBand(metrics: QueueMetricsSnapshot | null): HTMLElement {
  const section = document.createElement("section");

  const heading = document.createElement("h2");
  heading.className = "queue-heading";
  heading.textContent = "QUEUE";
  section.appendChild(heading);

  if (metrics === null) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No queue data.";
    section.appendChild(empty);
    return section;
  }

  // Cards. A parked-only capture fabricates backlog/closed/created (only
  // `parked` is real), so render them as "—" (unmeasured) rather than real zeros.
  const unmeasured = metrics.scope === "parked-only";
  const cards = document.createElement("div");
  cards.className = "queue-cards";
  cards.appendChild(buildCard("backlog", unmeasured ? "—" : String(metrics.openHelpWanted)));
  cards.appendChild(buildCard("closed/day", unmeasured ? "—" : metrics.closedPerDay.toFixed(1)));
  cards.appendChild(buildCard("created/day", unmeasured ? "—" : metrics.createdPerDay.toFixed(1)));
  section.appendChild(cards);

  // Runway verdict
  const runway = document.createElement("p");
  runway.className = "queue-runway";
  const { text, state } = runwayReadout(metrics);
  const stateSpan = document.createElement("span");
  stateSpan.className = "queue-runway-state";
  stateSpan.classList.add(state);
  stateSpan.textContent = text;
  runway.appendChild(stateSpan);
  section.appendChild(runway);

  return section;
}
