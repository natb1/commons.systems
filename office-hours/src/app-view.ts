import { renderCapacityBand } from "./capacity-band.js";
import { renderPacePositionPanel } from "./pace-position-panel.js";
import { renderHistoryBand } from "./history-band.js";
import { renderReminderList } from "./office-hours.js";
import { renderQueueMetricsPanel } from "./queue-metrics-panel.js";
import { renderIssueHistoryChart } from "./issue-history-chart.js";
import { getDemoSamples } from "./usage-data.js";
import { getDemoReminders, getDemoQueueMetrics } from "./data.js";
import { getDemoIssueSamples } from "./issue-data.js";
import { renderAuditAggregateChart } from "./audit-aggregate-chart.js";
import { getDemoAuditAggregates } from "./audit-data.js";
import { selectLatestSample, type UsageSample } from "./usage-samples.js";
import type { OfficeHoursItem, Reminder } from "./reminders.js";
import type { QueueMetricsSnapshot } from "./queue-metrics.js";
import type { IssueSample } from "./issue-samples.js";
import type { AuditAggregate } from "./audit-aggregates.js";

export type ViewState =
  | { tier: "demo" }                                                  // unauthenticated → labeled demo
  | { tier: "owner"; samples: UsageSample[]; reminders: OfficeHoursItem[]; queueMetrics: QueueMetricsSnapshot | null; issueSamples: IssueSample[]; auditAggregates: AuditAggregate[] }  // authenticated → real (possibly empty)
  | { tier: "error" };                                                // authenticated load failed

type PanelTier = "demo" | "owner";

interface PanelContext {
  samples: UsageSample[];
  reminders: OfficeHoursItem[];
  queueMetrics: QueueMetricsSnapshot | null;
  issueSamples: IssueSample[];
  auditAggregates: AuditAggregate[];
  now: Date;
}

interface Panel {
  id: string;
  title: string;                    // reserved metadata; renderApp does NOT render it
  availableIn: readonly PanelTier[];
  fullWidth?: boolean;
  timeSensitive?: boolean;          // re-rendered in place on each tick
  renderInto(ctx: PanelContext): HTMLElement;
}

function definePanel<T>(spec: {
  id: string;
  title: string;
  availableIn: readonly PanelTier[];
  fullWidth?: boolean;
  timeSensitive?: boolean;
  load(ctx: PanelContext): T;
  render(data: T, now: Date): HTMLElement;
}): Panel {
  return {
    id: spec.id,
    title: spec.title,
    availableIn: spec.availableIn,
    fullWidth: spec.fullWidth,
    timeSensitive: spec.timeSensitive,
    renderInto: (ctx) => spec.render(spec.load(ctx), ctx.now),
  };
}

const PANELS: readonly Panel[] = [
  definePanel({
    id: "capacity",
    title: "Capacity",
    availableIn: ["demo", "owner"],
    timeSensitive: true,
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
    id: "audit",
    title: "Audit",
    availableIn: ["demo", "owner"],
    fullWidth: true,
    load: (c) => c.auditAggregates,
    render: (a) => renderAuditAggregateChart(a),
  }),
  definePanel({
    id: "reminders",
    title: "Reminders",
    availableIn: ["demo", "owner"],
    timeSensitive: true,
    load: (c) => c.reminders.filter((r): r is Reminder => r.kind === "reminder"),
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
      auditAggregates: getDemoAuditAggregates(),
      now,
    };
  return {
    samples: state.samples,
    reminders: state.reminders,
    queueMetrics: state.queueMetrics,
    issueSamples: state.issueSamples,
    auditAggregates: state.auditAggregates,
    now,
  };
}

/**
 * Builds a panel's element for a given context, applying the full-width grid
 * class. Used both for the first paint and for the in-place tick re-render, so
 * a time-sensitive panel can never lose its full-width class on refresh.
 */
function buildPanelElement(panel: Panel, ctx: PanelContext): HTMLElement {
  const el = panel.renderInto(ctx);
  if (panel.fullWidth) el.classList.add("panel-grid-full");
  return el;
}

/**
 * Controller returned by renderApp. `tick(now)` re-renders only the
 * time-sensitive panels (capacity, reminders) in place against a fresh `now`,
 * leaving the history charts' DOM untouched so they don't re-scroll or flicker.
 */
export interface AppView {
  tick(now: Date): void;
}

export function renderApp(container: Element, state: ViewState, now: Date): AppView {
  container.replaceChildren();

  if (state.tier === "error") {
    const error = document.createElement("p");
    error.className = "error";
    error.setAttribute("role", "alert");
    error.textContent = "Couldn't load your queue. Please try again.";
    container.appendChild(error);
    return { tick: () => {} };
  }

  if (state.tier === "demo") {
    const banner = document.createElement("p");
    banner.className = "demo-banner";
    banner.setAttribute("role", "status");
    banner.textContent = "Demo data — sign in to see your queue.";
    container.appendChild(banner);
  } else if (state.tier !== "owner") {
    const _exhaustive: never = state;
    throw new Error("unhandled ViewState tier: " + String(_exhaustive));
  }

  const ctx = buildContext(state, now);

  const grid = document.createElement("div");
  grid.className = "panel-grid";
  const timeSensitive: { panel: Panel; element: HTMLElement }[] = [];
  for (const panel of PANELS) {
    if (!panel.availableIn.includes(state.tier)) continue;
    const el = buildPanelElement(panel, ctx);
    if (panel.timeSensitive) timeSensitive.push({ panel, element: el });
    grid.appendChild(el);
  }
  container.appendChild(grid);

  return {
    tick(nextNow: Date) {
      for (const entry of timeSensitive) {
        const fresh = buildPanelElement(entry.panel, { ...ctx, now: nextNow });
        grid.replaceChild(fresh, entry.element);
        entry.element = fresh;
      }
    },
  };
}
