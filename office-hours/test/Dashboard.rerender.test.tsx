import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";

import type { PanelData } from "../src/panel-equality.js";
import type { UsageSample } from "../src/usage-samples.js";
import type { Reminder } from "../src/reminders.js";
import type { QueueMetricsSnapshot } from "../src/queue-metrics.js";

// Owner data comes from a read-only on-disk snapshot: the startup restore
// decodes it into PanelData, and a window focus re-reads + merges it. The shared
// helper mocks the local-snapshot source + snapshot decoder + isEncrypted guard
// (importing it registers the vi.mock factories) so the load is controllable per
// test via `mocks`.
vi.mock("../src/firebase.js", () => ({
  db: {},
  NAMESPACE: { project: "office-hours", env: "test" },
}));

import { mocks, fakeHandle } from "./helpers/local-snapshot-mocks.js";

// Render-count spy stand-ins for the two time-sensitive panels. Each is a
// vi.fn() that bumps a counter on every render and returns a trivial section.
// The pure capacityBandKey / remindersPanelKey helpers live in the untouched
// ../src/capacity-band.js and ../src/reminders.js modules, so Dashboard's memo
// keys are computed from the real signatures even with these mocks in place.
const capacitySpy = vi.fn();
const remindersSpy = vi.fn();
// Render-count stand-ins for the remaining panels too, so the #2035 unchanged-
// refresh guard can assert ZERO additional renders of EVERY panel (not just the
// two time-sensitive ones).
const paceSpy = vi.fn();
const historySpy = vi.fn();
const backlogSpy = vi.fn();
const topicUsageSpy = vi.fn();
const queueSpy = vi.fn();
const parkedSpy = vi.fn();

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
vi.mock("../src/components/PacePanel.js", () => ({
  PacePanel: (props: unknown) => {
    paceSpy(props);
    return <section className="pace-spy" />;
  },
}));
vi.mock("../src/components/HistoryBand.js", () => ({
  HistoryBand: (props: unknown) => {
    historySpy(props);
    return <section className="history-spy" />;
  },
}));
vi.mock("../src/components/BacklogPanel.js", () => ({
  BacklogPanel: (props: unknown) => {
    backlogSpy(props);
    return <section className="backlog-spy" />;
  },
}));
vi.mock("../src/components/TopicUsagePanel.js", () => ({
  TopicUsagePanel: (props: unknown) => {
    topicUsageSpy(props);
    return <section className="topic-usage-spy" />;
  },
}));
vi.mock("../src/components/QueueMetricsPanel.js", () => ({
  QueueMetricsPanel: (props: unknown) => {
    queueSpy(props);
    return <section className="queue-spy" />;
  },
}));
vi.mock("../src/components/ParkedIssuesPanel.js", () => ({
  ParkedIssuesPanel: (props: unknown) => {
    parkedSpy(props);
    return <section className="parked-spy" />;
  },
}));

import { Dashboard } from "../src/Dashboard.js";

// The history-band chart modules read --fg via getThemeFg; happy-dom has no
// stylesheet, so set it on the document root for the duration of each test.
beforeEach(() => {
  document.documentElement.style.setProperty("--fg", "#e8eaed");
  mocks.isSnapshotSupported.mockReturnValue(true);
  mocks.getSnapshotState.mockReturnValue("granted");
  mocks.restoreSnapshotHandle.mockResolvedValue("granted");
  mocks.getCurrentSnapshotHandle.mockReturnValue(fakeHandle);
  mocks.readSnapshotBytes.mockResolvedValue(new TextEncoder().encode("{}").buffer);
  mocks.isEncrypted.mockReturnValue(false);
});
afterEach(() => {
  document.documentElement.style.removeProperty("--fg");
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

const DAY = 86_400_000;
const HOUR = 3_600_000;
// A clean fixed instant. All fixture reset/due times are derived from this so
// the "stable across a 60s tick" reasoning holds exactly.
const BASE = new Date("2026-06-20T12:00:00.000Z").getTime();
const COMPUTED_AT = new Date("2026-06-30T10:00:00Z");

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

const queueMetricsFixture: QueueMetricsSnapshot = {
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

const panelData = (): PanelData => ({
  samples: [farSample],
  reminders: [farReminder],
  queueMetrics: queueMetricsFixture,
  issueSamples: [],
  topicUsage: [],
  projectSignals: null,
});

// Content-equal-but-new-reference clones: same field values, fresh Date objects
// (equal getTime()), new array/object literals.
function cloneSample(s: UsageSample): UsageSample {
  return {
    sampledAt: new Date(s.sampledAt.getTime()),
    fiveHourUsedPct: s.fiveHourUsedPct,
    weeklyUsedPct: s.weeklyUsedPct,
    fiveHourResetsAt: new Date(s.fiveHourResetsAt.getTime()),
    weeklyResetsAt: new Date(s.weeklyResetsAt.getTime()),
    activeWorkers: s.activeWorkers,
    targetWorkers: s.targetWorkers,
    groupId: s.groupId,
  };
}
function cloneReminder(r: Reminder): Reminder {
  return {
    jitKey: r.jitKey,
    title: r.title,
    repo: r.repo,
    issueNumber: r.issueNumber,
    dueAt: new Date(r.dueAt.getTime()),
  };
}
function cloneQueue(q: QueueMetricsSnapshot): QueueMetricsSnapshot {
  return {
    ...q,
    computedAt: new Date(q.computedAt.getTime()),
    memberEmails: [...q.memberEmails],
    parked: [...q.parked],
  };
}

// Flush the local restore + decode + effect-driven setState. Microtasks are not
// faked, so awaiting a few empty act() microtask hops settles the local tier
// deterministically without RTL waitFor (which is flaky against fake timers).
async function flushLocalLoad() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("Dashboard tick: time-sensitive panels skip re-render on an unchanged tick", () => {
  beforeEach(() => {
    mocks.decodeSnapshot.mockReturnValue({ data: panelData(), computedAt: COMPUTED_AT });
  });

  it("does not re-render capacity/reminders when a 60s tick changes no displayed output", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));

    render(<Dashboard />);
    await flushLocalLoad();

    // Local tier is now painted; both spies have rendered at least once.
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

    render(<Dashboard />);
    await flushLocalLoad();

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

// ── Focus-reload: mergePanelData reference reuse (#2035) ────────────────────────
// A focus re-read yields fresh Date objects + fresh array/object references even
// when the CONTENT is unchanged. mergePanelData must compare by content and reuse
// prev's slices so the panel memo deps stay reference-identical and React bails —
// no panel re-renders. Returning the SAME computedAt keeps the ViewState object
// itself identical, so the component does not even re-run.

describe("Dashboard focus-reload: unchanged-content re-read re-renders no panel (#2035)", () => {
  it("renders zero additional panel renders when a focus re-read returns content-equal-but-new-reference data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));

    // Mount decode: baseline content.
    mocks.decodeSnapshot.mockReturnValueOnce({ data: panelData(), computedAt: COMPUTED_AT });

    render(<Dashboard />);
    await flushLocalLoad();

    const counts = {
      capacity: capacitySpy.mock.calls.length,
      reminders: remindersSpy.mock.calls.length,
      pace: paceSpy.mock.calls.length,
      history: historySpy.mock.calls.length,
      backlog: backlogSpy.mock.calls.length,
      topicUsage: topicUsageSpy.mock.calls.length,
      queue: queueSpy.mock.calls.length,
      parked: parkedSpy.mock.calls.length,
    };

    // Focus re-read: same content, all-new references, SAME computedAt.
    mocks.hasExternallyChanged.mockResolvedValueOnce(true);
    mocks.decodeSnapshot.mockReturnValueOnce({
      data: {
        samples: [cloneSample(farSample)],
        reminders: [cloneReminder(farReminder)],
        queueMetrics: cloneQueue(queueMetricsFixture),
        issueSamples: [],
        topicUsage: [],
        projectSignals: null,
      },
      computedAt: COMPUTED_AT,
    });

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // The merge produces a PanelData === prev (all slices reused) and an equal
    // computedAt, so setState returns prev, React bails, and no memoized element
    // rebuilds — even for the time-sensitive panels.
    expect(capacitySpy.mock.calls.length).toBe(counts.capacity);
    expect(remindersSpy.mock.calls.length).toBe(counts.reminders);
    expect(paceSpy.mock.calls.length).toBe(counts.pace);
    expect(historySpy.mock.calls.length).toBe(counts.history);
    expect(backlogSpy.mock.calls.length).toBe(counts.backlog);
    expect(topicUsageSpy.mock.calls.length).toBe(counts.topicUsage);
    expect(queueSpy.mock.calls.length).toBe(counts.queue);
    expect(parkedSpy.mock.calls.length).toBe(counts.parked);
  });
});

// ── Focus-reload: discriminating per-slice reuse (#2035) ────────────────────────
// The stronger regression guard: when a focus re-read changes exactly ONE slice
// (issue-samples) and leaves the other five content-equal (new references),
// mergePanelData must reuse the unchanged slices so ONLY the Backlog panel — the
// sole consumer of issueSamples via its own useMemo([issueSamples]) dep — rebuilds
// while the other seven panels bail. This exercises Dashboard's per-panel memo
// wiring: a regression that collapses the per-panel dep arrays into one shared
// array would re-render every panel here and be caught.

describe("Dashboard focus-reload: an issue-samples-only change re-renders only the Backlog panel (#2035)", () => {
  it("re-renders only Backlog when a focus re-read changes issue-samples and nothing else", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));

    // Mount decode: baseline content (issueSamples empty).
    mocks.decodeSnapshot.mockReturnValueOnce({ data: panelData(), computedAt: COMPUTED_AT });

    render(<Dashboard />);
    await flushLocalLoad();

    const counts = {
      capacity: capacitySpy.mock.calls.length,
      reminders: remindersSpy.mock.calls.length,
      pace: paceSpy.mock.calls.length,
      history: historySpy.mock.calls.length,
      backlog: backlogSpy.mock.calls.length,
      topicUsage: topicUsageSpy.mock.calls.length,
      queue: queueSpy.mock.calls.length,
      parked: parkedSpy.mock.calls.length,
    };

    // Focus re-read: every slice content-equal-but-new-reference EXCEPT
    // issueSamples, which gains a new sample. SAME computedAt, so only the
    // issue-samples slice difference drives the re-render.
    mocks.hasExternallyChanged.mockResolvedValueOnce(true);
    mocks.decodeSnapshot.mockReturnValueOnce({
      data: {
        samples: [cloneSample(farSample)],
        reminders: [cloneReminder(farReminder)],
        queueMetrics: cloneQueue(queueMetricsFixture),
        issueSamples: [
          {
            sampledAt: new Date(BASE - DAY),
            openSecurity: 0,
            openBug: 2,
            openEnhancement: 1,
            openOther: 0,
            groupId: "group-abc",
          },
        ],
        topicUsage: [],
        projectSignals: null,
      },
      computedAt: COMPUTED_AT,
    });

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Only backlogEl's dep ([issueSamples]) changed → only the Backlog panel
    // rebuilds. mergePanelData reused every other slice by reference, so those
    // panels' memo deps are identical and React bails.
    expect(backlogSpy.mock.calls.length).toBeGreaterThan(counts.backlog);
    expect(capacitySpy.mock.calls.length).toBe(counts.capacity);
    expect(remindersSpy.mock.calls.length).toBe(counts.reminders);
    expect(paceSpy.mock.calls.length).toBe(counts.pace);
    expect(historySpy.mock.calls.length).toBe(counts.history);
    expect(topicUsageSpy.mock.calls.length).toBe(counts.topicUsage);
    expect(queueSpy.mock.calls.length).toBe(counts.queue);
    expect(parkedSpy.mock.calls.length).toBe(counts.parked);
  });
});
