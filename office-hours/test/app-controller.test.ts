import { describe, it, expect, vi, afterEach } from "vitest";
import { createAppController } from "../src/app-controller.js";
import * as appView from "../src/app-view.js";
import type { AppView, ViewState } from "../src/app-view.js";
import type { UsageSample } from "../src/usage-samples.js";
import type { Reminder } from "../src/reminders.js";

// The history-band chart modules read --fg via getThemeFg; happy-dom has no
// stylesheet, so set it on the document root (mirrors app-view.test.ts).
function withThemeFg<T>(fn: () => T): T {
  document.documentElement.style.setProperty("--fg", "#e8eaed");
  try {
    return fn();
  } finally {
    document.documentElement.style.removeProperty("--fg");
  }
}

const START = new Date("2026-06-11T12:00:00Z");

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

const reminders: Reminder[] = [
  {
    jitKey: "jit-weekly-review",
    title: "weekly-review",
    repo: "natb1/office-hours-test",
    issueNumber: 1,
    dueAt: new Date(START.getTime() + 30 * 60_000),
  },
];

const ownerState: ViewState = {
  tier: "owner",
  samples: [baseSample],
  reminders,
  queueMetrics: queueMetricsFixture,
  issueSamples: [],
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createAppController", () => {
  it("paint then advance one interval re-renders the time-sensitive panel against the advanced time (tick fired)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);

    const container = document.createElement("div");
    // Default now: () => new Date(), so the interval callback reads the
    // fake system time that vi.advanceTimersByTime advances.
    const controller = createAppController(container);

    withThemeFg(() => controller.paint(ownerState, new Date()));

    // The SECOND .capacity-reset-countdown is the weekly reset (2026-06-14T00:00),
    // which counts down and crosses to "now" once time passes the boundary.
    const before = container.querySelectorAll(".capacity-reset-countdown")[1]!.textContent;

    // Advance system time past the weekly reset boundary, then fire the 60s tick.
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    withThemeFg(() => vi.advanceTimersByTime(60_000));

    const after = container.querySelectorAll(".capacity-reset-countdown")[1]!.textContent;
    expect(after).not.toBe(before);

    controller.stop();
  });

  it("single-interval invariant: painting twice then advancing fires tick exactly once (prior interval cleared)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);

    const ticks: AppView[] = [];
    const renderSpy = vi.spyOn(appView, "renderApp").mockImplementation(() => {
      const view: AppView = { tick: vi.fn() };
      ticks.push(view);
      return view;
    });

    const container = document.createElement("div");
    const controller = createAppController(container, { intervalMs: 1_000 });

    controller.paint(ownerState, new Date());
    controller.paint(ownerState, new Date());
    expect(renderSpy).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1_000);

    // The first paint's interval was cleared by the second paint, so only the
    // second view's tick fires — exactly once total, no leaked first timer.
    expect(ticks[0]!.tick).not.toHaveBeenCalled();
    expect(ticks[1]!.tick).toHaveBeenCalledTimes(1);

    controller.stop();
  });

  it("stop() clears the interval: no further tick after teardown", () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);

    let view: AppView | null = null;
    vi.spyOn(appView, "renderApp").mockImplementation(() => {
      view = { tick: vi.fn() };
      return view;
    });

    const container = document.createElement("div");
    const controller = createAppController(container, { intervalMs: 1_000 });

    controller.paint(ownerState, new Date());
    controller.stop();

    vi.advanceTimersByTime(5_000);

    expect(view!.tick).not.toHaveBeenCalled();
  });
});
