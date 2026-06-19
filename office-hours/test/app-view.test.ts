import { describe, it, expect } from "vitest";
import { renderApp, type AppView, type ViewState } from "../src/app-view.js";
import type { UsageSample } from "../src/usage-samples.js";
import type { Reminder } from "../src/reminders.js";
import type { IssueSample } from "../src/issue-samples.js";
import type { AuditAggregate } from "../src/audit-aggregates.js";

const now = new Date("2026-06-11T12:00:00Z");

// The history-band chart modules read --fg via getThemeFg; happy-dom has no
// stylesheet, so set it on the document root (mirrors history-band.test.ts).
function withThemeFg<T>(fn: () => T): T {
  document.documentElement.style.setProperty("--fg", "#e8eaed");
  try {
    return fn();
  } finally {
    document.documentElement.style.removeProperty("--fg");
  }
}

const baseSample: UsageSample = {
  sampledAt: new Date("2026-06-07T10:00:00Z"),
  fiveHourUsedPct: 42.5,
  weeklyUsedPct: 18.3,
  fiveHourResetsAt: new Date("2026-06-07T15:00:00Z"),
  weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
  activeWorkers: 3,
  targetWorkers: 4,
  groupId: "group-abc",
};

const makeSample = (o: Partial<UsageSample> = {}): UsageSample => ({ ...baseSample, ...o });

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function makeReminder(title: string, offsetMs: number): Reminder {
  return {
    jitKey: `jit-${title}`,
    title,
    repo: "natb1/office-hours-test",
    issueNumber: 1,
    dueAt: new Date(now.getTime() + offsetMs),
  };
}

const queueMetricsFixture = {
  openHelpWanted: 12,
  closedPerDay: 3.2,
  createdPerDay: 1.7,
  netDrainPerDay: 1.5,
  runwayDays: 8,
  windowDays: 14,
  computedAt: new Date("2026-06-10T00:00:00Z"),
  groupId: "group-abc",
  memberEmails: ["owner@example.com"],
};

describe("renderApp — demo tier", () => {
  it("renders a .demo-banner with the correct text", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    const banner = container.querySelector(".demo-banner");
    expect(banner).not.toBeNull();
    expect(banner!.textContent).toBe("Demo data — sign in to see your queue.");
    expect(banner!.getAttribute("role")).toBe("status");
  });

  it("renders the capacity heading", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    const heading = container.querySelector(".capacity-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("CAPACITY");
  });

  it("renders chart layouts from the demo samples", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    // getDemoSamples() returns non-empty data so both chart layouts render
    const layouts = container.querySelectorAll(".chart-layout");
    expect(layouts.length).toBeGreaterThan(0);
  });

  it("does not render an .error element", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    expect(container.querySelector(".error")).toBeNull();
  });

  it("renders the queue heading", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    const heading = container.querySelector(".queue-metrics-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("QUEUE");
  });

  it("renders 3 queue cards from the demo seed", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    // The capacity panel also emits .capacity-card, so scope the count to the
    // queue panel's unique value cells (depth, drain, runway).
    const cards = container.querySelectorAll(
      ".queue-depth-value, .queue-drain-value, .queue-runway-value",
    );
    expect(cards.length).toBe(3);
  });
});

describe("renderApp — owner tier with data", () => {
  const samples = [
    makeSample({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
    makeSample({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  ];
  const reminders = [
    makeReminder("weekly-review", 30 * MINUTE),
    makeReminder("overdue-task", -4 * HOUR),
  ];

  it("does not render a .demo-banner", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples: [], auditAggregates: [] }, now));

    expect(container.querySelector(".demo-banner")).toBeNull();
  });

  it("renders a reminder list item for each reminder", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples: [], auditAggregates: [] }, now));

    const items = container.querySelectorAll("li.reminder");
    expect(items.length).toBe(2);
  });

  it("does not render an .error element", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples: [], auditAggregates: [] }, now));

    expect(container.querySelector(".error")).toBeNull();
  });

  it("renders 3 queue cards when queueMetrics is provided", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples: [], auditAggregates: [] }, now));

    // The capacity panel also emits .capacity-card, so scope the count to the
    // queue panel's unique value cells (depth, drain, runway).
    const cards = container.querySelectorAll(
      ".queue-depth-value, .queue-drain-value, .queue-runway-value",
    );
    expect(cards.length).toBe(3);
  });
});

describe("renderApp — owner tier empty", () => {
  it("does not render a .demo-banner", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [], queueMetrics: null, issueSamples: [], auditAggregates: [] }, now),
    );

    expect(container.querySelector(".demo-banner")).toBeNull();
  });

  it('renders the reminder-list empty state "No reminders."', () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [], queueMetrics: null, issueSamples: [], auditAggregates: [] }, now),
    );

    const list = container.querySelector("#reminder-list");
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll("li").length).toBe(0);

    // The empty placeholder lives alongside the list in the same section
    const empties = Array.from(container.querySelectorAll(".empty"));
    const reminderEmpty = empties.find((el) => el.textContent === "No reminders.");
    expect(reminderEmpty).not.toBeUndefined();
  });

  it('renders the capacity empty state "No capacity data."', () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [], queueMetrics: null, issueSamples: [], auditAggregates: [] }, now),
    );

    const empties = Array.from(container.querySelectorAll(".empty"));
    const capacityEmpty = empties.find((el) => el.textContent === "No capacity data.");
    expect(capacityEmpty).not.toBeUndefined();
  });

  it("renders the history-band empty states", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [], queueMetrics: null, issueSamples: [], auditAggregates: [] }, now),
    );

    const empties = Array.from(container.querySelectorAll(".empty"));
    const usageEmpty = empties.find(
      (el) => el.textContent === "No usage history to chart.",
    );
    expect(usageEmpty).not.toBeUndefined();

    const workerEmpty = empties.find(
      (el) => el.textContent === "No worker history to chart.",
    );
    expect(workerEmpty).not.toBeUndefined();
  });

  it('renders the queue band empty state "No queue metrics yet." when queueMetrics is null', () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [], queueMetrics: null, issueSamples: [], auditAggregates: [] }, now),
    );

    const empties = Array.from(container.querySelectorAll(".empty"));
    const queueEmpty = empties.find((el) => el.textContent === "No queue metrics yet.");
    expect(queueEmpty).not.toBeUndefined();
  });

  it("does not render an .error element", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples: [], reminders: [], queueMetrics: null, issueSamples: [], auditAggregates: [] }, now),
    );

    expect(container.querySelector(".error")).toBeNull();
  });
});

describe("renderApp — error tier", () => {
  it("renders a .error with the correct text", () => {
    const container = document.createElement("div");
    renderApp(container, { tier: "error" }, now);

    const error = container.querySelector(".error");
    expect(error).not.toBeNull();
    expect(error!.textContent).toBe("Couldn't load your queue. Please try again.");
    expect(error!.getAttribute("role")).toBe("alert");
  });

  it("does not render a .demo-banner", () => {
    const container = document.createElement("div");
    renderApp(container, { tier: "error" }, now);

    expect(container.querySelector(".demo-banner")).toBeNull();
  });

  it("does not render the capacity heading", () => {
    const container = document.createElement("div");
    renderApp(container, { tier: "error" }, now);

    expect(container.querySelector(".capacity-heading")).toBeNull();
  });

  it("does not render the queue heading", () => {
    const container = document.createElement("div");
    renderApp(container, { tier: "error" }, now);

    expect(container.querySelector(".queue-metrics-heading")).toBeNull();
  });
});

describe("renderApp — replaceChildren between calls", () => {
  it("removes the demo banner when re-rendered as error", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    // Demo banner is present after first render
    expect(container.querySelector(".demo-banner")).not.toBeNull();

    // Second render: error tier
    renderApp(container, { tier: "error" }, now);

    // Demo banner must be gone
    expect(container.querySelector(".demo-banner")).toBeNull();
    // Error element must be present
    expect(container.querySelector(".error")).not.toBeNull();
  });
});

// ── Panel-registry integration tests ──────────────────────────────────────────
//
// These tests verify the registry composition: that the right panels appear in
// the right tiers, that the grid container is present (or absent for error),
// and that no panel heading is duplicated (the title-doubling guard below).

describe("renderApp — panel-registry: grid container", () => {
  const samples = [
    makeSample({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
    makeSample({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  ];
  const reminders = [
    makeReminder("weekly-review", 30 * MINUTE),
    makeReminder("overdue-task", -4 * HOUR),
  ];

  it("demo render: .panel-grid is present", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));
    expect(container.querySelector(".panel-grid")).not.toBeNull();
  });

  it("owner-with-data render: .panel-grid is present", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples: [], auditAggregates: [] }, now),
    );
    expect(container.querySelector(".panel-grid")).not.toBeNull();
  });

  it("error render: .panel-grid is absent", () => {
    const container = document.createElement("div");
    renderApp(container, { tier: "error" }, now);
    expect(container.querySelector(".panel-grid")).toBeNull();
  });
});

describe("renderApp — panel-registry: all panels present per tier", () => {
  const samples = [
    makeSample({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
    makeSample({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  ];
  const reminders = [
    makeReminder("weekly-review", 30 * MINUTE),
    makeReminder("overdue-task", -4 * HOUR),
  ];
  const issueSamples: IssueSample[] = [
    { sampledAt: new Date("2026-06-07T00:00:00Z"), openHelpWanted: 18, openOther: 5, groupId: "g" },
    { sampledAt: new Date("2026-06-08T00:00:00Z"), openHelpWanted: 12, openOther: 4, groupId: "g" },
    { sampledAt: new Date("2026-06-09T00:00:00Z"), openHelpWanted: 6, openOther: 3, groupId: "g" },
  ];

  it("demo: all seven panels are present", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));
    expect(container.querySelector(".capacity-heading")).not.toBeNull();
    expect(container.querySelector(".capacity-pace")).not.toBeNull();
    expect(container.querySelector(".capacity-history")).not.toBeNull();
    expect(container.querySelector("#reminder-list")).not.toBeNull();
    expect(container.querySelector(".queue-metrics-heading")).not.toBeNull();
    expect(container.querySelector(".backlog-history")).not.toBeNull();
    expect(container.querySelector(".audit-aggregate-chart")).not.toBeNull();
  });

  it("owner-with-data: all seven panels are present", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples, auditAggregates: [] }, now),
    );
    expect(container.querySelector(".capacity-heading")).not.toBeNull();
    expect(container.querySelector(".capacity-pace")).not.toBeNull();
    expect(container.querySelector(".capacity-history")).not.toBeNull();
    expect(container.querySelector("#reminder-list")).not.toBeNull();
    expect(container.querySelector(".queue-metrics-heading")).not.toBeNull();
    expect(container.querySelector(".backlog-history")).not.toBeNull();
    expect(container.querySelector(".audit-aggregate-chart")).not.toBeNull();
  });
});

describe("renderApp — panel-registry: title-doubling guard", () => {
  // querySelector finds only the FIRST match — a registry bug that duplicates a
  // panel heading (e.g. renders <h2>CAPACITY</h2> twice) would pass querySelector
  // but fail querySelectorAll(...).length === 1. Count is the correct check.
  const samples = [
    makeSample({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
    makeSample({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  ];
  const reminders = [
    makeReminder("weekly-review", 30 * MINUTE),
    makeReminder("overdue-task", -4 * HOUR),
  ];

  it("demo: each panel heading appears exactly once", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));
    expect(container.querySelectorAll(".capacity-heading").length).toBe(1);
    expect(container.querySelectorAll(".capacity-pace-heading").length).toBe(1);
    expect(container.querySelectorAll(".capacity-history-heading").length).toBe(1);
    expect(container.querySelectorAll(".queue-metrics-heading").length).toBe(1);
  });

  it("owner-with-data: each panel heading appears exactly once", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples: [], auditAggregates: [] }, now),
    );
    expect(container.querySelectorAll(".capacity-heading").length).toBe(1);
    expect(container.querySelectorAll(".capacity-pace-heading").length).toBe(1);
    expect(container.querySelectorAll(".capacity-history-heading").length).toBe(1);
    expect(container.querySelectorAll(".queue-metrics-heading").length).toBe(1);
  });
});

describe("renderApp — panel-registry: history panel is full-width", () => {
  it("demo: .capacity-history has the panel-grid-full class", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));
    const history = container.querySelector(".capacity-history");
    expect(history).not.toBeNull();
    expect(history!.classList.contains("panel-grid-full")).toBe(true);
    // The history section IS the full-width element
    expect(container.querySelector(".panel-grid-full")).toBe(history);
  });
});

describe("renderApp — panel-registry: backlog-history panel is full-width", () => {
  it("demo: .backlog-history has the panel-grid-full class", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));
    const backlog = container.querySelector(".backlog-history");
    expect(backlog).not.toBeNull();
    expect(backlog!.classList.contains("panel-grid-full")).toBe(true);
  });
});

describe("renderApp — panel-registry: audit panel", () => {
  const samples = [
    makeSample({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
    makeSample({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  ];
  const reminders = [
    makeReminder("weekly-review", 30 * MINUTE),
    makeReminder("overdue-task", -4 * HOUR),
  ];
  const auditAggregates: AuditAggregate[] = [
    {
      computedAt: new Date("2026-06-07T00:00:00Z"),
      windowDays: 14,
      groupId: "g",
      phaseSpend: { plan: 0.5, implement: 1.2 },
      cacheRead: 800,
      cacheCreation: 200,
    },
  ];

  it("demo: .audit-aggregate-chart is present and carries panel-grid-full", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));
    const audit = container.querySelector(".audit-aggregate-chart");
    expect(audit).not.toBeNull();
    expect(audit!.classList.contains("panel-grid-full")).toBe(true);
  });

  it("demo: .audit-aggregate-chart appears exactly once", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));
    expect(container.querySelectorAll(".audit-aggregate-chart").length).toBe(1);
  });

  it("owner: .audit-aggregate-chart is present and carries panel-grid-full", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples: [], auditAggregates }, now),
    );
    const audit = container.querySelector(".audit-aggregate-chart");
    expect(audit).not.toBeNull();
    expect(audit!.classList.contains("panel-grid-full")).toBe(true);
  });

  it("owner: .audit-aggregate-chart appears exactly once", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples: [], auditAggregates }, now),
    );
    expect(container.querySelectorAll(".audit-aggregate-chart").length).toBe(1);
  });
});

describe("renderApp — panel-registry: queue-metrics in both tiers", () => {
  const samples = [
    makeSample({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
    makeSample({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  ];
  const reminders = [
    makeReminder("weekly-review", 30 * MINUTE),
    makeReminder("overdue-task", -4 * HOUR),
  ];

  it("demo: queue-metrics heading present, populated value element present (not empty placeholder)", () => {
    const container = document.createElement("div");
    withThemeFg(() => renderApp(container, { tier: "demo" }, now));
    const heading = container.querySelector(".queue-metrics-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("QUEUE");
    // getDemoQueueMetrics() returns non-null data, so the depth value renders
    expect(container.querySelector(".queue-depth-value")).not.toBeNull();
  });

  it("owner with queueMetrics: queue-metrics heading and populated value element present", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples, reminders, queueMetrics: queueMetricsFixture, issueSamples: [], auditAggregates: [] }, now),
    );
    const heading = container.querySelector(".queue-metrics-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("QUEUE");
    expect(container.querySelector(".queue-depth-value")).not.toBeNull();
  });

  it("owner with queueMetrics: null — heading present, empty placeholder with exact text", () => {
    const container = document.createElement("div");
    withThemeFg(() =>
      renderApp(container, { tier: "owner", samples, reminders, queueMetrics: null, issueSamples: [], auditAggregates: [] }, now),
    );
    const heading = container.querySelector(".queue-metrics-heading");
    expect(heading).not.toBeNull();
    // Find the queue-metrics empty placeholder specifically (other panels also emit .empty)
    const empties = Array.from(container.querySelectorAll(".empty"));
    const queueEmpty = empties.find((el) => el.textContent === "No queue metrics yet.");
    expect(queueEmpty).not.toBeUndefined();
  });
});

// ── AppView.tick: in-place refresh of time-sensitive panels ───────────────────

describe("renderApp — AppView.tick refreshes time-sensitive panels", () => {
  const samples = [
    makeSample({ sampledAt: new Date("2026-06-07T10:00:00Z") }),
    makeSample({ sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 }),
  ];
  const reminders = [
    makeReminder("weekly-review", 30 * MINUTE),
    makeReminder("overdue-task", -4 * HOUR),
  ];

  // The first .capacity-reset-countdown is the 5-hour reset, already in the past
  // for this fixture (formatCountdown stays "now"). The SECOND is the weekly
  // reset at 2026-06-14T00:00, which counts down and crosses to "now" once
  // laterNow advances past it — that's the value the tick must refresh.
  const ownerState: ViewState = {
    tier: "owner",
    samples,
    reminders,
    queueMetrics: queueMetricsFixture,
    issueSamples: [],
    auditAggregates: [],
  };

  it("owner: weekly countdown text changes after tick(laterNow)", () => {
    const container = document.createElement("div");
    const view = withThemeFg(() => renderApp(container, ownerState, now));

    const weeklyCountdownBefore =
      container.querySelectorAll(".capacity-reset-countdown")[1]!.textContent;

    // 2026-06-15 is past the weekly reset boundary (2026-06-14T00:00)
    const laterNow = new Date("2026-06-15T12:00:00Z");
    withThemeFg(() => view.tick(laterNow));

    const weeklyCountdownAfter =
      container.querySelectorAll(".capacity-reset-countdown")[1]!.textContent;
    expect(weeklyCountdownAfter).not.toBe(weeklyCountdownBefore);
  });

  it("owner: reminder-due text changes after tick(laterNow)", () => {
    const container = document.createElement("div");
    const view = withThemeFg(() => renderApp(container, ownerState, now));

    const dueBefore = container.querySelector(".reminder-due")!.textContent;

    const laterNow = new Date("2026-06-15T12:00:00Z");
    withThemeFg(() => view.tick(laterNow));

    const dueAfter = container.querySelector(".reminder-due")!.textContent;
    expect(dueAfter).not.toBe(dueBefore);
  });

  it("demo: weekly countdown text changes after tick(laterNow)", () => {
    const container = document.createElement("div");
    const view = withThemeFg(() => renderApp(container, { tier: "demo" }, now));

    const countdownBefore =
      container.querySelectorAll(".capacity-reset-countdown")[1]!.textContent;

    // The demo seed computes its weekly reset relative to actual wall time
    // (Date.now() + ~2.5 days), so a fixed laterNow can fall before the reset
    // boundary and leave the countdown unchanged. Advance past it from wall
    // time with a margin that always clears the seed's offset.
    const laterNow = new Date(Date.now() + 4 * DAY);
    withThemeFg(() => view.tick(laterNow));

    const countdownAfter =
      container.querySelectorAll(".capacity-reset-countdown")[1]!.textContent;
    expect(countdownAfter).not.toBe(countdownBefore);
  });

  it("chart panels' DOM nodes are identity-stable across a tick", () => {
    const container = document.createElement("div");
    const view = withThemeFg(() => renderApp(container, ownerState, now));

    const historyBefore = container.querySelector(".capacity-history");
    const backlogBefore = container.querySelector(".backlog-history");
    const auditBefore = container.querySelector(".audit-aggregate-chart");
    expect(historyBefore).not.toBeNull();
    expect(backlogBefore).not.toBeNull();
    expect(auditBefore).not.toBeNull();

    withThemeFg(() => view.tick(new Date("2026-06-15T12:00:00Z")));

    // Charts are NOT re-rendered: the same DOM nodes remain in place.
    expect(container.querySelector(".capacity-history")).toBe(historyBefore);
    expect(container.querySelector(".backlog-history")).toBe(backlogBefore);
    expect(container.querySelector(".audit-aggregate-chart")).toBe(auditBefore);
  });

  it("error-tier AppView.tick is a harmless no-op", () => {
    const container = document.createElement("div");
    const view: AppView = renderApp(container, { tier: "error" }, now);
    expect(() => view.tick(new Date("2026-06-15T12:00:00Z"))).not.toThrow();
  });
});
