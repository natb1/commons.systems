import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, act, waitFor } from "@testing-library/react";

// Dashboard.tsx no longer imports firebase.js (owner Firestore reads are gone),
// but the demo-getter data modules are still imported for the demo tier. A
// trivial firebase stub keeps any transitive load isolated from Firebase config.
vi.mock("../src/firebase.js", () => ({
  db: {},
  NAMESPACE: { project: "office-hours", env: "test" },
}));

// The dashboard's only real data path is now the read-only local snapshot: the
// startup restore reads a persisted handle, reads its bytes, and decodes them
// into PanelData. The shared helper mocks the local-snapshot source + snapshot
// decoder + isEncrypted guard (importing it registers the vi.mock factories) so
// the whole load is controllable per test via `mocks`.
import { mocks, fakeHandle } from "./helpers/local-snapshot-mocks.js";

import { Dashboard } from "../src/Dashboard.js";
import type { PanelData } from "../src/panel-equality.js";
import type { UsageSample } from "../src/usage-samples.js";
import type { Reminder } from "../src/reminders.js";
import type { QueueMetricsSnapshot } from "../src/queue-metrics.js";

const emptyPanelData: PanelData = {
  samples: [],
  reminders: [],
  queueMetrics: null,
  issueSamples: [],
  topicUsage: [],
  projectSignals: null,
};

// The history-band chart modules read --fg via getThemeFg; happy-dom has no
// stylesheet, so set it on the document root for the duration of each test
// (mirrors the vanilla app-view.test.ts withThemeFg helper).
beforeEach(() => {
  document.documentElement.style.setProperty("--fg", "#e8eaed");
  // Demo is the natural baseline: no persisted handle → restore returns "none"
  // → no local activation → the component stays on the demo tier. Local-loading
  // describes override restore/decode below.
  mocks.isSnapshotSupported.mockReturnValue(true);
  mocks.getSnapshotState.mockReturnValue("none");
  mocks.restoreSnapshotHandle.mockResolvedValue("none");
  mocks.getCurrentSnapshotHandle.mockReturnValue(fakeHandle);
  mocks.readSnapshotBytes.mockResolvedValue(new TextEncoder().encode("{}").buffer);
  mocks.hasExternallyChanged.mockResolvedValue(false);
  mocks.isEncrypted.mockReturnValue(false);
  mocks.decodeSnapshot.mockReturnValue({ data: emptyPanelData, computedAt: new Date("2026-06-30T10:00:00Z") });
  mocks.loadSnapshotPanelData.mockResolvedValue({ data: emptyPanelData, computedAt: new Date("2026-06-30T10:00:00Z") });
});
afterEach(() => {
  document.documentElement.style.removeProperty("--fg");
  cleanup();
  vi.clearAllMocks();
});

// The demo tier renders with no persisted snapshot: it reads from the
// synchronous getDemo* seed getters (restore resolves "none").
describe("Dashboard demo tier (no snapshot)", () => {
  it("renders the demo banner with the exact copy", () => {
    const { container } = render(<Dashboard />);
    const banner = container.querySelector(".demo-banner");
    expect(banner).not.toBeNull();
    expect(banner!.getAttribute("role")).toBe("status");
    expect(banner!.textContent).toBe("Demo data — sign in to see your queue.");
  });

  it("renders the panel grid with all ten panels", () => {
    const { container } = render(<Dashboard />);
    const grid = container.querySelector(".panel-grid");
    expect(grid).not.toBeNull();
    // capacity, pace, history, backlog, topic-usage, reminders, queue-metrics, parked, intention-tree, project-signals
    expect(grid?.children).toHaveLength(10);
  });

  it("marks the five full-width panels (history, backlog, topic-usage, intention-tree, project-signals) as panel-grid-full", () => {
    const { container } = render(<Dashboard />);
    const full = container.querySelectorAll(".panel-grid > .panel-grid-full");
    expect(full).toHaveLength(5);
  });

  it("renders the intention-tree panel full-width with INTENTION TREE heading", () => {
    const { container } = render(<Dashboard />);
    const heading = container.querySelector(".intention-tree-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("INTENTION TREE"); // type-safety-ok: asserted not-null by the preceding expect()
    // The panel root carries panel-grid-full as a direct child of the grid
    const fullWidthWithHeading = container.querySelector(
      ".panel-grid > .panel-grid-full .intention-tree-heading",
    );
    expect(fullWidthWithHeading).not.toBeNull();
  });

  it("renders chart layouts from the demo samples (charts mount, no sign-in)", () => {
    // Directly verifies the DEMO-renders-every-chart invariant (ports the
    // deleted app-view.test.ts demo .chart-layout assertion).
    const { container } = render(<Dashboard />);
    expect(container.querySelectorAll(".chart-layout").length).toBeGreaterThan(0);
  });

  it("does not render the error state", () => {
    const { container } = render(<Dashboard />);
    expect(container.querySelector(".error")).toBeNull();
  });
});

// ── Snapshot-loaded (local) tier ────────────────────────────────────────────
// Ports app-view.test.ts's owner-with-data and owner-empty coverage onto the
// local-snapshot load path: a granted persisted handle restores and decodes a
// snapshot into PanelData on mount.

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

const now = new Date("2026-06-11T12:00:00Z");
const makeReminder = (title: string, offsetMs: number): Reminder => ({
  jitKey: `jit-${title}`,
  title,
  repo: "natb1/office-hours-test",
  issueNumber: 1,
  dueAt: new Date(now.getTime() + offsetMs),
});

const queueMetricsFixture: QueueMetricsSnapshot = {
  openHelpWanted: 12,
  closedPerDay: 3.2,
  createdPerDay: 1.7,
  netDrainPerDay: 1.5,
  runwayDays: 8,
  windowDays: 14,
  computedAt: new Date("2026-06-10T00:00:00Z"),
  groupId: "group-abc",
  memberEmails: ["owner@example.com"],
  parked: [
    {
      number: 1466,
      title: "office-hours: surface parked dispatch:office-hours work",
      url: "https://github.com/natb1/commons.systems/issues/1466",
      createdAt: new Date("2026-06-09T00:00:00Z"),
      repo: "natb1/commons.systems",
      phase: "dispatch:office-hours",
    },
  ],
};

// Configure the local-snapshot mocks to restore + decode a given PanelData.
function primeSnapshot(data: PanelData): void {
  mocks.getSnapshotState.mockReturnValue("granted");
  mocks.restoreSnapshotHandle.mockResolvedValue("granted");
  mocks.getCurrentSnapshotHandle.mockReturnValue(fakeHandle);
  mocks.decodeSnapshot.mockReturnValue({ data, computedAt: new Date("2026-06-30T10:00:00Z") });
}

describe("Dashboard snapshot tier with data", () => {
  beforeEach(() => {
    primeSnapshot({
      samples: [
        baseSample,
        { ...baseSample, sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 },
      ],
      reminders: [
        makeReminder("weekly-review", 30 * 60_000),
        makeReminder("overdue-task", -4 * 3_600_000),
      ],
      queueMetrics: queueMetricsFixture,
      issueSamples: [],
      topicUsage: [],
      projectSignals: null,
    });
  });

  it("renders a reminder list item for each reminder and no demo banner", async () => {
    const { container } = render(<Dashboard />);
    await waitFor(() =>
      expect(container.querySelectorAll("li.reminder").length).toBe(2),
    );
    expect(container.querySelector(".demo-banner")).toBeNull();
    expect(container.querySelector(".error")).toBeNull();
  });

  it("renders a parked-issue list item for each parked issue and no empty state", async () => {
    const { container } = render(<Dashboard />);
    await waitFor(() =>
      expect(container.querySelectorAll("li.parked-issue").length).toBe(
        queueMetricsFixture.parked.length,
      ),
    );
    const texts = Array.from(container.querySelectorAll(".empty")).map(
      (el) => el.textContent,
    );
    expect(texts).not.toContain("Nothing parked.");
  });

  it("renders the read-only snapshot banner (not the demo banner)", async () => {
    const { container } = render(<Dashboard />);
    await waitFor(() =>
      expect(container.querySelector(".local-snapshot-banner")).not.toBeNull(),
    );
    expect(container.querySelector(".demo-banner")).toBeNull();
  });
});

describe("Dashboard snapshot tier — empty", () => {
  beforeEach(() => {
    primeSnapshot(emptyPanelData);
  });

  it("renders the exact empty-state strings for each panel", async () => {
    const { container } = render(<Dashboard />);
    await waitFor(() =>
      expect(container.querySelector(".demo-banner")).toBeNull(),
    );
    const texts = () =>
      Array.from(container.querySelectorAll(".empty")).map((el) => el.textContent);
    await waitFor(() => {
      const t = texts();
      expect(t).toContain("No reminders.");
      expect(t).toContain("No capacity data.");
      expect(t).toContain("No worker history to chart.");
      expect(t).toContain("No queue metrics yet.");
      expect(t).toContain("Nothing parked.");
    });
  });
});

describe("Dashboard error tier", () => {
  beforeEach(() => {
    // A granted restore that fails to decode drives the local load into the
    // error tier (activateLocal catches the throw, flips to error, re-throws so
    // the restore effect still logs it). Silence the expected logError noise.
    mocks.getSnapshotState.mockReturnValue("granted");
    mocks.restoreSnapshotHandle.mockResolvedValue("granted");
    mocks.getCurrentSnapshotHandle.mockReturnValue(fakeHandle);
    mocks.decodeSnapshot.mockImplementation(() => {
      throw new Error("snapshot decode failed");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders the error state with exact copy and role, hiding demo/panels", async () => {
    const { container } = render(<Dashboard />);
    let error: Element | null = null;
    await waitFor(() => {
      error = container.querySelector(".error");
      expect(error).not.toBeNull();
    });
    expect(error!.getAttribute("role")).toBe("alert");
    expect(error!.textContent).toBe("Couldn't load your queue. Please try again.");
    expect(container.querySelector(".demo-banner")).toBeNull();
    expect(container.querySelector(".capacity-heading")).toBeNull();
    expect(container.querySelector(".queue-metrics-heading")).toBeNull();
  });
});

// ── Tick ──────────────────────────────────────────────────────────────────────
// Ports app-controller.test.ts's interval behavior: the single mount-once 60s
// interval refreshes the time-sensitive panels against the advanced wall clock.

describe("Dashboard tick refreshes time-sensitive panels", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("demo: weekly countdown text changes after advancing the 60s interval", () => {
    vi.useFakeTimers();
    const { container } = render(<Dashboard />);

    // The SECOND .capacity-reset-countdown is the weekly reset, which counts
    // down and crosses to "now" once wall time passes the boundary. The demo
    // seed computes its weekly reset relative to Date.now() (~2.5 days out), so
    // advance well past it from current fake time.
    const before =
      container.querySelectorAll(".capacity-reset-countdown")[1]!.textContent;

    vi.setSystemTime(new Date(Date.now() + 4 * 86_400_000));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    const after =
      container.querySelectorAll(".capacity-reset-countdown")[1]!.textContent;
    expect(after).not.toBe(before);
  });
});
