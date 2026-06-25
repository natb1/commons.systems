import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import type { User } from "firebase/auth";

import type { UsageSample } from "../src/usage-samples.js";
import type { Reminder } from "../src/reminders.js";

// Dashboard.tsx imports db/NAMESPACE from firebase.js, whose createAppContext
// requires VITE_FIREBASE_* env at module load. A trivial stub keeps the render
// unit isolated from Firebase config (mirrors Dashboard.test.tsx).
vi.mock("../src/firebase.js", () => ({
  db: {},
  NAMESPACE: { project: "office-hours", env: "test" },
}));

// The owner tier calls the five getOwner* loaders. Mock the four data modules
// so the loaders are controllable per test, keeping the real getDemo* getters
// via importOriginal (mirrors Dashboard.test.tsx).
const getOwnerSamples = vi.fn();
const getOwnerReminders = vi.fn();
const getOwnerQueueMetrics = vi.fn();
const getOwnerIssueSamples = vi.fn();
const getOwnerAuditAggregates = vi.fn();

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
vi.mock("../src/audit-data.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/audit-data.js")>()),
  getOwnerAuditAggregates: (...args: unknown[]) => getOwnerAuditAggregates(...args),
}));

// Render-count spy stand-ins for the two time-sensitive panels. Each is a
// vi.fn() that bumps a counter on every render and returns a trivial section.
// The pure capacityBandKey / remindersPanelKey helpers live in the untouched
// ../src/capacity-band.js and ../src/reminders.js modules, so Dashboard's memo
// keys are computed from the real signatures even with these mocks in place.
const capacitySpy = vi.fn();
const remindersSpy = vi.fn();

vi.mock("../src/components/CapacityBand.js", () => ({
  CapacityBand: (props: unknown) => {
    capacitySpy(props);
    return <section className="capacity-spy" />;
  },
}));
vi.mock("../src/components/RemindersPanel.js", () => ({
  RemindersPanel: (props: unknown) => {
    remindersSpy(props);
    return <section className="reminders-spy" />;
  },
}));

import { Dashboard } from "../src/Dashboard.js";

// The history-band chart modules read --fg via getThemeFg; happy-dom has no
// stylesheet, so set it on the document root for the duration of each test.
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
// A clean fixed instant. All fixture reset/due times are derived from this so
// the "stable across a 60s tick" reasoning holds exactly.
const BASE = new Date("2026-06-20T12:00:00.000Z").getTime();

// Resets ~5.5d out (5d 12h 30m): the day component is far from any boundary and
// the hour component sits mid-hour (30m in), so a 60s advance does not roll the
// "Xd Yh" countdown nor the wall-clock reset label. dueAt ~3d out, mid-hour, so
// the reminders "due in 3d" label and overdue flag are likewise unchanged by a
// 60s tick.
const farSample: UsageSample = {
  sampledAt: new Date(BASE - DAY),
  fiveHourUsedPct: 42.5,
  weeklyUsedPct: 18.3,
  fiveHourResetsAt: new Date(BASE + 5 * DAY + 12 * HOUR + 30 * 60_000),
  weeklyResetsAt: new Date(BASE + 5 * DAY + 12 * HOUR + 30 * 60_000),
  activeWorkers: 3,
  targetWorkers: 4,
  groupId: "group-abc",
};

const farReminder: Reminder = {
  jitKey: "jit-far",
  title: "far-task",
  repo: "natb1/office-hours-test",
  issueNumber: 1,
  dueAt: new Date(BASE + 3 * DAY + 6 * HOUR + 30 * 60_000),
};

const queueMetricsFixture = {
  openHelpWanted: 12,
  closedPerDay: 3.2,
  createdPerDay: 1.7,
  netDrainPerDay: 1.5,
  runwayDays: 8,
  windowDays: 14,
  computedAt: new Date(BASE - DAY),
  groupId: "group-abc",
  memberEmails: ["owner@example.com"],
};

// Flush the mocked Promise.all load + effect-driven setState. Microtasks are
// not faked, so awaiting an empty act() settles the owner tier deterministically
// without RTL waitFor (which is flaky against vitest fake timers).
async function flushOwnerLoad() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("Dashboard tick: time-sensitive panels skip re-render on an unchanged tick", () => {
  beforeEach(() => {
    getOwnerSamples.mockResolvedValue([farSample]);
    getOwnerReminders.mockResolvedValue([farReminder]);
    getOwnerQueueMetrics.mockResolvedValue(queueMetricsFixture);
    getOwnerIssueSamples.mockResolvedValue([]);
    getOwnerAuditAggregates.mockResolvedValue([]);
  });

  it("does not re-render capacity/reminders when a 60s tick changes no displayed output", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));

    render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    // Owner tier is now painted; both spies have rendered at least once.
    expect(capacitySpy.mock.calls.length).toBeGreaterThan(0);
    expect(remindersSpy.mock.calls.length).toBeGreaterThan(0);

    const capacityBefore = capacitySpy.mock.calls.length;
    const remindersBefore = remindersSpy.mock.calls.length;

    // A 60s tick at a far-from-boundary instant changes none of the now-derived
    // strings → the *Key is identical → the memoized element is reused → the
    // panel does not re-render.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(capacitySpy.mock.calls.length).toBe(capacityBefore);
    expect(remindersSpy.mock.calls.length).toBe(remindersBefore);
  });

  it("re-renders capacity/reminders when a tick crosses a reset/deadline boundary", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));

    render(<Dashboard user={fakeUser} />);
    await flushOwnerLoad();

    const capacityBefore = capacitySpy.mock.calls.length;
    const remindersBefore = remindersSpy.mock.calls.length;

    // Jump the wall clock well past both the reset (~5.5d) and the reminder due
    // time (~3.5d), then fire a tick. Every now-derived string changes (the
    // countdowns collapse to "now", the due label flips to overdue) → the *Keys
    // change → both elements rebuild → both panels re-render.
    vi.setSystemTime(new Date(BASE + 7 * DAY));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(capacitySpy.mock.calls.length).toBeGreaterThan(capacityBefore);
    expect(remindersSpy.mock.calls.length).toBeGreaterThan(remindersBefore);
  });
});
