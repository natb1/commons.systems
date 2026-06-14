import { renderCapacityBand, selectLatestSample } from "./capacity-band.js";
import { renderPacePositionPanel } from "./pace-position-panel.js";
import { renderHistoryBand } from "./history-band.js";
import { renderReminderList } from "./office-hours.js";
import { renderQueueBand } from "./queue-band.js";
import { getDemoSamples } from "./usage-data.js";
import { getDemoReminders, getDemoQueueMetrics } from "./data.js";
import type { UsageSample } from "./usage-samples.js";
import type { Reminder } from "./reminders.js";
import type { QueueMetricsSnapshot } from "./queue-metrics.js";

export type ViewState =
  | { tier: "demo" }                                                  // unauthenticated → labeled demo
  | { tier: "owner"; samples: UsageSample[]; reminders: Reminder[]; queueMetrics: QueueMetricsSnapshot | null }  // authenticated → real (possibly empty)
  | { tier: "error" };                                                // authenticated load failed

export function renderApp(container: Element, state: ViewState, now: Date): void {
  container.replaceChildren();

  if (state.tier === "demo") {
    const banner = document.createElement("p");
    banner.className = "demo-banner";
    banner.setAttribute("role", "status");
    banner.textContent = "Demo data — sign in to see your queue.";
    container.appendChild(banner);

    const samples = getDemoSamples();
    container.appendChild(renderCapacityBand(selectLatestSample(samples), now));
    container.appendChild(renderQueueBand(getDemoQueueMetrics()));
    container.appendChild(renderPacePositionPanel(samples));
    container.appendChild(renderHistoryBand(samples));
    container.appendChild(renderReminderList(getDemoReminders(), now));
  } else if (state.tier === "owner") {
    container.appendChild(renderCapacityBand(selectLatestSample(state.samples), now));
    container.appendChild(renderQueueBand(state.queueMetrics));
    container.appendChild(renderPacePositionPanel(state.samples));
    container.appendChild(renderHistoryBand(state.samples));
    container.appendChild(renderReminderList(state.reminders, now));
  } else {
    const error = document.createElement("p");
    error.className = "error";
    error.setAttribute("role", "alert");
    error.textContent = "Couldn't load your queue. Please try again.";
    container.appendChild(error);
  }
}
