import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, act, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";

// Dashboard.tsx imports db/NAMESPACE from firebase.js, whose createAppContext
// requires VITE_FIREBASE_* env at module load. The demo tier (user=null) never
// touches them, so a trivial stub keeps the render unit isolated from Firebase
// config (mirrors audio's home test mocking the firebase-pulling module).
vi.mock("../src/firebase.js", () => ({
  db: {},
  NAMESPACE: { project: "office-hours", env: "test" },
}));

// The owner / error tiers call the five getOwner* loaders. Mock the four data
// modules so the loaders are controllable per test, while keeping the real
// getDemo* seed getters (the demo tier and the owner-empty chart fallbacks rely
// on them) via importActual. These mock fns are reset and configured per test.
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
import type { UsageSample } from "../src/usage-samples.js";
import type { Reminder } from "../src/reminders.js";
import type { QueueMetricsSnapshot } from "../src/queue-metrics.js";

// The history-band chart modules read --fg via getThemeFg; happy-dom has no
// stylesheet, so set it on the document root for the duration of each test
// (mirrors the vanilla app-view.test.ts withThemeFg helper).
beforeEach(() => {
  document.documentElement.style.setProperty("--fg", "#e8eaed");
});
afterEach(() => {
  document.documentElement.style.removeProperty("--fg");
  cleanup();
  vi.clearAllMocks();
});

const fakeUser = { uid: "owner-1", email: "owner@example.com" } as User;

// The demo tier renders with no Firebase user, so it needs no Firestore mock:
// it reads from the synchronous getDemo* seed getters.
describe("Dashboard demo tier (user=null)", () => {
  it("renders the demo banner with the exact copy", () => {
    const { container } = render(<Dashboard user={null} />);
    const banner = container.querySelector(".demo-banner");
    expect(banner).not.toBeNull();
    expect(banner!.getAttribute("role")).toBe("status");
    expect(banner!.textContent).toBe("Demo data — sign in to see your queue.");
  });

  it("renders the panel grid with all ten panels", () => {
    const { container } = render(<Dashboard user={null} />);
    const grid = container.querySelector(".panel-grid");
    expect(grid).not.toBeNull();
    // capacity, pace, history, backlog, topic-usage, reminders, queue-metrics, parked, intention-tree, project-signals
    expect(grid?.children).toHaveLength(10);
  });

  it("marks the five full-width panels (history, backlog, topic-usage, intention-tree, project-signals) as panel-grid-full", () => {
    const { container } = render(<Dashboard user={null} />);
    const full = container.querySelectorAll(".panel-grid > .panel-grid-full");
    expect(full).toHaveLength(5);
  });

  it("renders the intention-tree panel full-width with INTENTION TREE heading", () => {
    const { container } = render(<Dashboard user={null} />);
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
    const { container } = render(<Dashboard user={null} />);
    expect(container.querySelectorAll(".chart-layout").length).toBeGreaterThan(0);
  });

  it("does not render the error state", () => {
    const { container } = render(<Dashboard user={null} />);
    expect(container.querySelector(".error")).toBeNull();
  });
});

// ── Owner tier ────────────────────────────────────────────────────────────────
// Ports app-view.test.ts's owner-with-data and owner-empty coverage onto the
// React load path: a non-null user triggers the five-collection parallel load.

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

describe("Dashboard owner tier with data", () => {
  beforeEach(() => {
    getOwnerSamples.mockResolvedValue([
      baseSample,
      { ...baseSample, sampledAt: new Date("2026-06-08T10:00:00Z"), activeWorkers: 2, targetWorkers: 3 },
    ]);
    getOwnerReminders.mockResolvedValue([
      makeReminder("weekly-review", 30 * 60_000),
      makeReminder("overdue-task", -4 * 3_600_000),
    ]);
    getOwnerQueueMetrics.mockResolvedValue(queueMetricsFixture);
    getOwnerIssueSamples.mockResolvedValue([]);
    getOwnerTopicUsage.mockResolvedValue([]);
    getOwnerProjectSignals.mockResolvedValue(null);
  });

  it("renders a reminder list item for each reminder and no demo banner", async () => {
    const { container } = render(<Dashboard user={fakeUser} />);
    await waitFor(() =>
      expect(container.querySelectorAll("li.reminder").length).toBe(2),
    );
    expect(container.querySelector(".demo-banner")).toBeNull();
    expect(container.querySelector(".error")).toBeNull();
  });

  it("renders a parked-issue list item for each parked issue and no empty state", async () => {
    const { container } = render(<Dashboard user={fakeUser} />);
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
});

describe("Dashboard owner tier — empty", () => {
  beforeEach(() => {
    getOwnerSamples.mockResolvedValue([]);
    getOwnerReminders.mockResolvedValue([]);
    getOwnerQueueMetrics.mockResolvedValue(null);
    getOwnerIssueSamples.mockResolvedValue([]);
    getOwnerTopicUsage.mockResolvedValue([]);
    getOwnerProjectSignals.mockResolvedValue(null);
  });

  it("renders the exact empty-state strings for each panel", async () => {
    const { container } = render(<Dashboard user={fakeUser} />);
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
    // One loader rejecting drives the whole load into the error tier (ports
    // main.ts's catch). Silence the expected logError noise.
    getOwnerSamples.mockResolvedValue([]);
    getOwnerReminders.mockRejectedValue(new Error("permission-denied"));
    getOwnerQueueMetrics.mockResolvedValue(null);
    getOwnerIssueSamples.mockResolvedValue([]);
    getOwnerTopicUsage.mockResolvedValue([]);
    getOwnerProjectSignals.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders the error state with exact copy and role, hiding demo/panels", async () => {
    const { container } = render(<Dashboard user={fakeUser} />);
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
    const { container } = render(<Dashboard user={null} />);

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
