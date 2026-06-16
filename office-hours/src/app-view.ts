import { renderCapacityBand } from "./capacity-band.js";
import { renderPacePositionPanel } from "./pace-position-panel.js";
import { renderHistoryBand } from "./history-band.js";
import { renderReminderList } from "./office-hours.js";
import { renderQueueMetricsPanel } from "./queue-metrics-panel.js";
import { renderIssueHistoryChart } from "./issue-history-chart.js";
import { getDemoSamples } from "./usage-data.js";
import { getDemoReminders, getDemoQueueMetrics } from "./data.js";
import { getDemoIssueSamples } from "./issue-data.js";
import { selectLatestSample, type UsageSample } from "./usage-samples.js";
import type { Reminder } from "./reminders.js";
import type { QueueMetricsSnapshot } from "./queue-metrics.js";
import type { IssueSample } from "./issue-samples.js";

export type ViewState =
  | { tier: "demo" }                                                  // unauthenticated → labeled demo
  | { tier: "owner"; samples: UsageSample[]; reminders: Reminder[]; queueMetrics: QueueMetricsSnapshot | null; issueSamples: IssueSample[] }  // authenticated → real (possibly empty)
  | { tier: "error" };                                                // authenticated load failed

type PanelTier = "demo" | "owner";

interface PanelContext {
  samples: UsageSample[];
  reminders: Reminder[];
  queueMetrics: QueueMetricsSnapshot | null;
  issueSamples: IssueSample[];
  now: Date;
}

interface Panel {
  id: string;
  title: string;                    // reserved metadata; renderApp does NOT render it
  availableIn: readonly PanelTier[];
  fullWidth?: boolean;
  renderInto(ctx: PanelContext): HTMLElement;
}

function definePanel<T>(spec: {
  id: string;
  title: string;
  availableIn: readonly PanelTier[];
  fullWidth?: boolean;
  load(ctx: PanelContext): T;
  render(data: T, now: Date): HTMLElement;
}): Panel {
  return {
    id: spec.id,
    title: spec.title,
    availableIn: spec.availableIn,
    fullWidth: spec.fullWidth,
    renderInto: (ctx) => spec.render(spec.load(ctx), ctx.now),
  };
}

const PANELS: readonly Panel[] = [
  definePanel({
    id: "capacity",
    title: "Capacity",
    availableIn: ["demo", "owner"],
    load: (c) => selectLatestSample(c.samples),
    render: (s, now) => renderCapacityBand(s, now),
  }),
  definePanel({
    id: "pace",
    title: "Pace",
    availableIn: ["demo", "owner"],
    load: (c) => c.samples,
    render: (s) => renderPacePositionPanel(s),
  }),
  definePanel({
    id: "history",
    title: "History",
    availableIn: ["demo", "owner"],
    fullWidth: true,
    load: (c) => c.samples,
    render: (s) => renderHistoryBand(s),
  }),
  definePanel({
    id: "backlog-history",
    title: "Backlog",
    availableIn: ["demo", "owner"],
    fullWidth: true,
    load: (c) => c.issueSamples,
    render: (s) => renderIssueHistoryChart(s),
  }),
  definePanel({
    id: "reminders",
    title: "Reminders",
    availableIn: ["demo", "owner"],
    load: (c) => c.reminders,
    render: (r, now) => renderReminderList(r, now),
  }),
  definePanel({
    id: "queue-metrics",
    title: "Queue",
    availableIn: ["demo", "owner"],
    load: (c) => c.queueMetrics,
    render: (m) => renderQueueMetricsPanel(m),
  }),
];

function buildContext(
  state: Extract<ViewState, { tier: "demo" } | { tier: "owner" }>,
  now: Date,
): PanelContext {
  if (state.tier === "demo")
    return {
      samples: getDemoSamples(),
      reminders: getDemoReminders(),
      queueMetrics: getDemoQueueMetrics(),
      issueSamples: getDemoIssueSamples(),
      now,
    };
  return {
    samples: state.samples,
    reminders: state.reminders,
    queueMetrics: state.queueMetrics,
    issueSamples: state.issueSamples,
    now,
  };
}

export function renderApp(container: Element, state: ViewState, now: Date): void {
  container.replaceChildren();

  if (state.tier === "error") {
    const error = document.createElement("p");
    error.className = "error";
    error.setAttribute("role", "alert");
    error.textContent = "Couldn't load your queue. Please try again.";
    container.appendChild(error);
    return;
  }

  if (state.tier === "demo") {
    const banner = document.createElement("p");
    banner.className = "demo-banner";
    banner.setAttribute("role", "status");
    banner.textContent = "Demo data — sign in to see your queue.";
    container.appendChild(banner);
  }

  const ctx = buildContext(state, now);
  const grid = document.createElement("div");
  grid.className = "panel-grid";
  for (const panel of PANELS) {
    if (!panel.availableIn.includes(state.tier)) continue;
    const el = panel.renderInto(ctx);
    if (panel.fullWidth) el.classList.add("panel-grid-full");
    grid.appendChild(el);
  }
  container.appendChild(grid);
}
