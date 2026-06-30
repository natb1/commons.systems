import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import type { User } from "firebase/auth";

import type { UsageSample } from "../src/usage-samples.js";
import type { Reminder } from "../src/reminders.js";
import type { QueueMetricsSnapshot } from "../src/queue-metrics.js";
import type { IssueSample } from "../src/issue-samples.js";
import type { TopicUsageDoc } from "../src/topic-usage.js";

// Dashboard.tsx imports db/NAMESPACE from firebase.js, whose createAppContext
// requires VITE_FIREBASE_* env at module load. A trivial stub keeps the render
// unit isolated from Firebase config (mirrors Dashboard.test.tsx).
vi.mock("../src/firebase.js", () => ({
  db: {},
  NAMESPACE: { project: "office-hours", env: "test" },
}));

// The owner tier calls the six getOwner* loaders. Mock all five data modules
// so the loaders are controllable per test, keeping the real getDemo* getters
// via importOriginal (mirrors Dashboard.test.tsx).
const getOwnerSamples = vi.fn();
const getOwnerReminders = vi.fn();
const getOwnerQueueMetrics = vi.fn();
const getOwnerIssueSamples = vi.fn();
const getOwnerTopicUsage = vi.fn();
const getOwnerProjectSignals = vi.fn();

vi.mock("../src/usage-data.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/usage-data.js")>()),
  getOwnerSamples: (...args: unknown[]) => getOwnerSamples(...args),
}));
vi.mock("../src/data.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/data.js")>()),
  getOwnerReminders: (...args: unknown[]) => getOwnerReminders(...args),
  getOwnerQueueMetrics: (...args: unknown[]) => getOwnerQueueMetrics(...args),
}));
vi.mock("../src/issue-data.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/issue-data.js")>()),
  getOwnerIssueSamples: (...args: unknown[]) => getOwnerIssueSamples(...args),
}));
vi.mock("../src/topic-usage-data.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/topic-usage-data.js")>()),
  getOwnerTopicUsage: (...args: unknown[]) => getOwnerTopicUsage(...args),
}));
vi.mock("../src/project-signals-data.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/project-signals-data.js")>()),
  getOwnerProjectSignals: (...args: unknown[]) => getOwnerProjectSignals(...args),
}));

import { Dashboard } from "../src/Dashboard.js";

// Mirrors the un-exported REFRESH_INTERVAL_MS in src/Dashboard.tsx (5 min). The
// src const is a plain `const` (not exported), and exporting it would be an
// out-of-scope src change, so we re-declare the same value here.
const REFRESH_INTERVAL_MS = 5 * 60_000;

// The history-band chart modules read --fg via getThemeFg; happy-dom has no
// stylesheet, so set it on the document root for the duration of each test
// (mirrors Dashboard.test.tsx).
beforeEach(() => {
  document.documentElement.style.setProperty("--fg", "#e8eaed");
});
afterEach(() => {
  document.documentElement.style.removeProperty("--fg");
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

const fakeUser = { uid: "owner-1", email: "owner@example.com" } as User; // type-safety-ok: test fixture; all getOwner* calls are vi-mocked so the full User shape is never accessed

const DAY = 86_400_000;
const HOUR = 3_600_000;
// A fixed instant. Using fake timers with a frozen system time keeps the
// now-derived panels (capacity countdowns, reminder due labels, parked ages)
// stable across the five 60s `now`-ticks that fire inside a single 5-min
// REFRESH_INTERVAL_MS advance, so a refresh's effect is the only thing that can
// change the rendered output.
const BASE = new Date("2026-06-20T12:00:00.000Z").getTime();

const baseSample: UsageSample = {
  sampledAt: new Date(BASE - DAY),
  fiveHourUsedPct: 42.5,
  weeklyUsedPct: 18.3,
  // Far-from-boundary resets so the 60s `now`-ticks within a 5-min advance do
  // not roll any countdown/clock label.
  fiveHourResetsAt: new Date(BASE + 30 * DAY),
  weeklyResetsAt: new Date(BASE + 30 * DAY),
  activeWorkers: 3,
  targetWorkers: 4,
  groupId: "group-abc",
};

const baseReminder: Reminder = {
  jitKey: "jit-1",
  title: "first-title",
  repo: "natb1/office-hours-test",
  issueNumber: 1,
  // Far-from-boundary due time so the due label is stable across the 60s ticks.
  dueAt: new Date(BASE + 30 * DAY),
};

const baseQueue: QueueMetricsSnapshot = {
  openHelpWanted: 12,
  closedPerDay: 3.2,
  createdPerDay: 1.7,
  netDrainPerDay: 1.5,
  runwayDays: 8,
  windowDays: 14,
  computedAt: new Date(BASE - DAY),
  groupId: "group-abc",
  memberEmails: ["owner@example.com"],
  parked: [],
};

// Two valid issue samples (distinct timestamps) clear the <2-sample / dup-
// timestamp guard so renderIssueHistoryChart paints a chart instead of the
// "No backlog history to chart." empty placeholder.
const issueSamplesPopulated: IssueSample[] = [
  { sampledAt: new Date(BASE - 2 * DAY), openSecurity: 1, openBug: 2, openEnhancement: 3, openOther: 4, groupId: "group-abc" },
  { sampledAt: new Date(BASE - DAY), openSecurity: 1, openBug: 2, openEnhancement: 3, openOther: 5, groupId: "group-abc" },
];

// Two valid topic-usage docs (distinct dates) give renderTopicUsageChart real
// data to paint instead of the "No topic usage to chart." empty placeholder.
const topicUsagePopulated: TopicUsageDoc[] = [
  {
    date: "2026-06-18",
    byTopic: { dispatch: { priceProxyUsd: 1.5, input: 1000, cacheRead: 100, cacheCreation: 10, output: 200 } },
    byType: { bug: { priceProxyUsd: 0.5, input: 400, cacheRead: 40, cacheCreation: 4, output: 80 } },
  },
  {
    date: "2026-06-19",
    byTopic: { dispatch: { priceProxyUsd: 2.5, input: 1200, cacheRead: 120, cacheCreation: 12, output: 240 } },
    byType: { bug: { priceProxyUsd: 1.0, input: 500, cacheRead: 50, cacheCreation: 5, output: 100 } },
  },
];

// Flush the mounted Promise.all load + effect-driven setState. Microtasks are
// not faked, so awaiting an empty act() settles the owner tier deterministically
// (mirrors Dashboard.rerender.test.tsx's flushOwnerLoad).
async function flushOwnerLoad() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

// Drive one refresh cycle: advancing past REFRESH_INTERVAL_MS fires the
// interval, and advanceTimersByTimeAsync flushes the getter microtasks the
// callback awaits, so the merge + setState settles before we assert.
async function advanceOneRefresh() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS);
  });
}

// Configure the five non-varying getters to a stable populated baseline for the
// propagation tests, leaving the one under test free to use mockResolvedValueOnce.
function setStableBaseline() {
  getOwnerSamples.mockResolvedValue([baseSample]);
  getOwnerReminders.mockResolvedValue([baseReminder]);
  getOwnerQueueMetrics.mockResolvedValue(baseQueue);
  getOwnerIssueSamples.mockResolvedValue([]);
  getOwnerTopicUsage.mockResolvedValue([]);
  getOwnerProjectSignals.mockResolvedValue(null);
}

describe("Dashboard refresh: per-collection refresh→panel propagation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));
  });

  it("usage-samples refresh propagates to the Capacity panel (AC #1)", async () => {
    setStableBaseline();
    getOwnerSamples
      .mockResolvedValueOnce([baseSample])
      .mockResolvedValueOnce([{ ...baseSample, fiveHourUsedPct: 90 }]);

    const { container } = render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    // First cycle: 5-hour card rounds 42.5 → "43%".
    expect(container.querySelector(".capacity-heading")).not.toBeNull();
    expect(container.textContent).toContain("43%");
    expect(container.textContent).not.toContain("90%");

    await advanceOneRefresh();

    // Second cycle: the new sample's 90 propagates to the card.
    expect(container.textContent).toContain("90%");
  });

  it("issue-samples refresh propagates to the Backlog panel (AC #4)", async () => {
    setStableBaseline();
    getOwnerIssueSamples
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(issueSamplesPopulated);

    const { container } = render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    // First cycle: empty issue samples → backlog empty placeholder present.
    const backlogEmpty = () =>
      Array.from(container.querySelectorAll(".backlog-history .empty")).map((el) => el.textContent);
    expect(backlogEmpty()).toContain("No backlog history to chart.");

    await advanceOneRefresh();

    // Second cycle: populated samples → the chart paints, placeholder is gone.
    expect(backlogEmpty()).not.toContain("No backlog history to chart.");
  });

  it("topic-usage refresh propagates to the TopicUsage panel (AC #5)", async () => {
    setStableBaseline();
    getOwnerTopicUsage
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(topicUsagePopulated);

    const { container } = render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    const topicUsageEmpty = () =>
      Array.from(container.querySelectorAll(".topic-usage-chart .empty")).map((el) => el.textContent);
    expect(topicUsageEmpty()).toContain("No topic usage to chart.");

    await advanceOneRefresh();

    expect(topicUsageEmpty()).not.toContain("No topic usage to chart.");
  });

  it("reminders refresh propagates to the Reminders panel (AC #3)", async () => {
    setStableBaseline();
    getOwnerReminders
      .mockResolvedValueOnce([baseReminder])
      .mockResolvedValueOnce([{ ...baseReminder, title: "second-title" }]);

    const { container } = render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    const reminderTitles = () =>
      Array.from(container.querySelectorAll(".reminder-title")).map((el) => el.textContent);
    expect(reminderTitles()).toContain("first-title");
    expect(reminderTitles()).not.toContain("second-title");

    await advanceOneRefresh();

    expect(reminderTitles()).toContain("second-title");
  });

  it("queue-metrics refresh propagates to the QueueMetrics + Parked panels (AC #2)", async () => {
    setStableBaseline();
    const parkedIssue = {
      number: 1466,
      title: "freshly-parked-issue",
      url: "https://github.com/natb1/commons.systems/issues/1466",
      createdAt: new Date(BASE - 2 * DAY),
      repo: "natb1/commons.systems",
      phase: "dispatch:office-hours",
    };
    getOwnerQueueMetrics
      .mockResolvedValueOnce(baseQueue)
      .mockResolvedValueOnce({ ...baseQueue, openHelpWanted: 99, parked: [parkedIssue] });

    const { container } = render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    // The DS Metric renders label + value as bare spans (no value class), so
    // assert on the card's textContent ("queue depth" + the openHelpWanted value).
    const depthValue = () =>
      container.querySelector(".queue-depth-card")?.textContent ?? "";
    const parkedTitles = () =>
      Array.from(container.querySelectorAll("li.parked-issue")).map((el) => el.textContent ?? "");
    expect(depthValue()).toContain("12");
    expect(depthValue()).not.toContain("99");
    expect(parkedTitles().join(" ")).not.toContain("freshly-parked-issue");

    await advanceOneRefresh();

    // Both the depth metric and the newly-parked issue propagate.
    expect(depthValue()).toContain("99");
    expect(parkedTitles().join(" ")).toContain("freshly-parked-issue");
  });
});

describe("Dashboard refresh: transient failure retains last-good data", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));
    // The refresh error path logs via logError → console.error; silence it.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("keeps last-good owner data and does not flip to the error tier on a refresh rejection (AC #6)", async () => {
    setStableBaseline();
    getOwnerSamples.mockResolvedValue([baseSample]);

    const { container } = render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    expect(container.textContent).toContain("43%");
    expect(container.querySelector(".error")).toBeNull();

    // Next refresh: one getter rejects. The catch retains last-good and does
    // NOT flip to error.
    getOwnerSamples.mockRejectedValueOnce(new Error("permission-denied"));
    await advanceOneRefresh();

    // Last-good capacity still shows; the error placeholder is absent.
    expect(container.textContent).toContain("43%");
    expect(container.querySelector(".error")).toBeNull();
    expect(container.textContent).not.toContain("Couldn't load your queue");
  });
});

describe("Dashboard refresh: graceful null persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));
  });

  it("persists the queue-metrics empty placeholder across a null→null refresh (AC #8)", async () => {
    getOwnerSamples.mockResolvedValue([baseSample]);
    getOwnerReminders.mockResolvedValue([baseReminder]);
    getOwnerQueueMetrics.mockResolvedValue(null);
    getOwnerIssueSamples.mockResolvedValue([]);
    getOwnerTopicUsage.mockResolvedValue([]);
    getOwnerProjectSignals.mockResolvedValue(null);

    const { container } = render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    const queueEmpty = () =>
      Array.from(container.querySelectorAll(".empty")).map((el) => el.textContent);
    expect(queueEmpty()).toContain("No queue metrics yet.");
    expect(container.querySelector(".error")).toBeNull();

    await advanceOneRefresh();

    // No crash, placeholder persists, no error tier.
    expect(queueEmpty()).toContain("No queue metrics yet.");
    expect(container.querySelector(".error")).toBeNull();
  });
});

describe("Dashboard refresh: unmount / user-change guard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));
  });

  it("does not setState (no console error) when unmounted before a pending refresh resolves", async () => {
    // NOTE: React 18 removed the setState-after-unmount warning and a setState on
    // an unmounted fiber is a silent no-op, so this is a SMOKE test (no crash /
    // no console noise on the unmount-mid-fetch path), NOT a verification of the
    // `cancelled` guard. The user-change test below is the one that actually
    // distinguishes guard-present from guard-absent.
    setStableBaseline();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    // Make the next refresh getter hang so the interval callback is mid-fetch
    // when we unmount; the `cancelled` cleanup must suppress the setState.
    let resolveHang: (v: UsageSample[]) => void = () => {};
    getOwnerSamples.mockImplementationOnce(
      () => new Promise<UsageSample[]>((resolve) => { resolveHang = resolve; }),
    );

    // Fire the interval (synchronously starts the in-flight fetch).
    act(() => {
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    });

    // Unmount while the fetch is still pending → effect cleanup sets cancelled.
    unmount();

    // Now resolve the pending fetch and flush; nothing should crash or warn.
    await act(async () => {
      resolveHang([baseSample]);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does not clobber the new user's data when a prior user's in-flight refresh resolves late", async () => {
    // The meaningful guard test: an in-flight refresh for user A must NOT
    // setState after the user switches to B. Without the `cancelled` guard
    // (Dashboard.tsx:141), A's late resolution runs
    // setState((prev=Bdata) => mergePanelData(Bdata, Adata)) — prev.tier is still
    // "owner" so the tier early-return does not save it — clobbering B back to A.
    const userA = { uid: "owner-A", email: "a@example.com" } as User; // type-safety-ok: vi-mocked getters never read the User
    const userB = { uid: "owner-B", email: "b@example.com" } as User; // type-safety-ok: vi-mocked getters never read the User

    const sampleA: UsageSample = { ...baseSample, fiveHourUsedPct: 43 }; // renders "43%"
    const sampleB: UsageSample = { ...baseSample, fiveHourUsedPct: 77 }; // renders "77%"

    // User A's mount load.
    getOwnerSamples.mockResolvedValueOnce([sampleA]);
    getOwnerReminders.mockResolvedValue([baseReminder]);
    getOwnerQueueMetrics.mockResolvedValue(baseQueue);
    getOwnerIssueSamples.mockResolvedValue([]);
    getOwnerTopicUsage.mockResolvedValue([]);
    getOwnerProjectSignals.mockResolvedValue(null);

    const { container, rerender } = render(<Dashboard user={userA} />);
    await flushOwnerLoad();
    expect(container.textContent).toContain("43%");

    // A's refresh getter hangs → A-refresh is in-flight when the user switches.
    let resolveHangA: (v: UsageSample[]) => void = () => {};
    getOwnerSamples.mockImplementationOnce(
      () => new Promise<UsageSample[]>((resolve) => { resolveHangA = resolve; }),
    );
    act(() => {
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    });

    // Switch to user B; B's mount load returns 77%.
    getOwnerSamples.mockResolvedValueOnce([sampleB]);
    rerender(<Dashboard user={userB} />);
    await flushOwnerLoad();
    expect(container.textContent).toContain("77%");

    // A's stale refresh finally resolves with A's data. The `cancelled` guard
    // (set by the refresh-effect cleanup on the A→B user change) must drop it.
    await act(async () => {
      resolveHangA([sampleA]);
      await Promise.resolve();
      await Promise.resolve();
    });

    // B's data survives; A's stale data did not clobber it.
    expect(container.textContent).toContain("77%");
    expect(container.textContent).not.toContain("43%");
  });
});
