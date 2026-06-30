import { describe, it, expect } from "vitest";

import {
  toIso,
  serializeSnapshot,
  type SnapshotInput,
} from "./snapshot.js";
import type { UsageSample } from "../../office-hours/src/usage-samples.js";
import type { IssueSample } from "../../office-hours/src/issue-samples.js";
import type { Reminder } from "../../office-hours/src/reminders.js";
import type { QueueMetricsSnapshot } from "../../office-hours/src/queue-metrics.js";
import type { ProjectSignalsSnapshot } from "../../office-hours/src/project-signals.js";
import type { TopicUsageDoc } from "../../office-hours/src/topic-usage.js";

const NOW_ISO = "2026-06-30T12:00:00.000Z";

/** A firebase Timestamp stub — the only contract `toIso` relies on is `.toDate()`. */
function timestampStub(date: Date): { toDate: () => Date } {
  return { toDate: () => date };
}

/** A FieldValue.serverTimestamp() sentinel — no concrete time, no `.toDate()`. */
const serverTimestampSentinel = { _methodName: "serverTimestamp" };

/** Recursively asserts no `Date` instance and no Timestamp-like `.toDate` survives. */
function assertNoTimestamps(value: unknown, path = "$"): void {
  expect(value, `${path} is not a Date`).not.toBeInstanceOf(Date);
  if (value && typeof value === "object") {
    expect(
      typeof (value as { toDate?: unknown }).toDate,
      `${path} has no .toDate (not a Timestamp)`,
    ).not.toBe("function");
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      assertNoTimestamps(v, `${path}.${k}`);
    }
  }
}

describe("toIso", () => {
  it("converts a firebase Timestamp via .toDate()", () => {
    const d = new Date("2026-01-02T03:04:05.000Z");
    expect(toIso(timestampStub(d), NOW_ISO)).toBe("2026-01-02T03:04:05.000Z");
  });

  it("converts a plain Date", () => {
    const d = new Date("2025-12-25T00:00:00.000Z");
    expect(toIso(d, NOW_ISO)).toBe("2025-12-25T00:00:00.000Z");
  });

  it("falls back to `now` for a serverTimestamp sentinel", () => {
    expect(toIso(serverTimestampSentinel, NOW_ISO)).toBe(NOW_ISO);
  });

  it("falls back to `now` for null/undefined", () => {
    expect(toIso(null, NOW_ISO)).toBe(NOW_ISO);
    expect(toIso(undefined, NOW_ISO)).toBe(NOW_ISO);
  });

  it("passes an already-ISO string through unchanged", () => {
    const iso = "2026-03-03T03:03:03.000Z";
    expect(toIso(iso, NOW_ISO)).toBe(iso);
  });
});

describe("serializeSnapshot", () => {
  function buildInput(): SnapshotInput {
    const usage: UsageSample = {
      // exercise the Timestamp.toDate() path on one field
      sampledAt: timestampStub(new Date("2026-06-30T11:00:00.000Z")) as unknown as Date,
      fiveHourUsedPct: 12,
      weeklyUsedPct: 34,
      fiveHourResetsAt: new Date("2026-06-30T16:00:00.000Z"),
      weeklyResetsAt: new Date("2026-07-05T00:00:00.000Z"),
      activeWorkers: 3,
      targetWorkers: 8,
      groupId: "g1",
    };

    const issue: IssueSample = {
      sampledAt: new Date("2026-06-30T10:00:00.000Z"),
      openSecurity: 1,
      openBug: 2,
      openEnhancement: 3,
      openOther: 4,
      groupId: "g1",
    };

    const reminder: Reminder = {
      // exercise the serverTimestamp sentinel fallback → now
      jitKey: "digest",
      title: "Weekly digest",
      repo: "natb1/commons.systems",
      issueNumber: 42,
      dueAt: serverTimestampSentinel as unknown as Date,
    };

    const queueMetrics: QueueMetricsSnapshot = {
      openHelpWanted: 7,
      closedPerDay: 3,
      createdPerDay: 2,
      netDrainPerDay: 1,
      runwayDays: 7,
      windowDays: 14,
      computedAt: new Date("2026-06-30T09:00:00.000Z"),
      groupId: "g1",
      memberEmails: ["nathan@natb1.com"],
      parked: [
        {
          number: 100,
          title: "Parked thing",
          url: "https://github.com/natb1/commons.systems/issues/100",
          createdAt: new Date("2026-06-20T00:00:00.000Z"),
          repo: "natb1/commons.systems",
          phase: "dispatch:review",
        },
      ],
    };

    const projectSignals: ProjectSignalsSnapshot = {
      computedAt: new Date("2026-06-30T08:00:00.000Z"),
      groupId: "g1",
      memberEmails: ["nathan@natb1.com"],
      github: {
        repo: "natb1/commons.systems",
        stars: 5,
        forks: 1,
        watchers: 2,
        traffic: {
          clonesCount: 10,
          clonesUniques: 4,
          viewsCount: 100,
          viewsUniques: 40,
          topReferrers: [{ referrer: "google.com", count: 9, uniques: 3 }],
        },
      },
    };

    const topicUsage: TopicUsageDoc[] = [
      {
        date: "2026-06-30",
        byTopic: {
          dispatch: { priceProxyUsd: 1.5, input: 10, cacheRead: 100, cacheCreation: 5, output: 2 },
        },
        byType: {},
      },
    ];

    return {
      samples: [usage],
      reminders: [reminder],
      queueMetrics,
      issueSamples: [issue],
      topicUsage,
      projectSignals,
      computedAt: new Date(NOW_ISO),
      chainHealth: { liveSessions: 2, lastTickAgeSeconds: 30 },
      scope: "full",
      window: { samples: 500, issueSamples: 500 },
    };
  }

  it("produces all six dashboard fields plus metadata", () => {
    const snap = serializeSnapshot(buildInput());

    // Six PanelData fields
    expect(snap).toHaveProperty("samples");
    expect(snap).toHaveProperty("reminders");
    expect(snap).toHaveProperty("queueMetrics");
    expect(snap).toHaveProperty("issueSamples");
    expect(snap).toHaveProperty("topicUsage");
    expect(snap).toHaveProperty("projectSignals");
    // Metadata
    expect(snap.computedAt).toBe(NOW_ISO);
    expect(snap.scope).toBe("full");
    expect(snap.chainHealth).toEqual({ liveSessions: 2, lastTickAgeSeconds: 30 });
    expect(snap.window).toEqual({ samples: 500, issueSamples: 500 });
  });

  it("normalizes every timestamp to an ISO string (no Date/Timestamp survives)", () => {
    const snap = serializeSnapshot(buildInput());

    // Spot-check the three toIso forms landed correctly
    expect(snap.samples[0].sampledAt).toBe("2026-06-30T11:00:00.000Z"); // Timestamp.toDate()
    expect(snap.samples[0].fiveHourResetsAt).toBe("2026-06-30T16:00:00.000Z"); // Date
    expect(snap.reminders[0].dueAt).toBe(NOW_ISO); // serverTimestamp sentinel → now
    expect(snap.queueMetrics?.computedAt).toBe("2026-06-30T09:00:00.000Z");
    expect(snap.queueMetrics?.parked[0].createdAt).toBe("2026-06-20T00:00:00.000Z");
    expect(snap.queueMetrics?.parked[0].phase).toBe("dispatch:review");
    expect(snap.projectSignals?.computedAt).toBe("2026-06-30T08:00:00.000Z");

    assertNoTimestamps(snap);
  });

  it("is JSON-round-trippable (deep-equals through stringify/parse)", () => {
    const snap = serializeSnapshot(buildInput());
    const roundTripped = JSON.parse(JSON.stringify(snap));
    expect(roundTripped).toEqual(snap);
  });

  it("carries null queueMetrics / projectSignals through unchanged", () => {
    const input = buildInput();
    input.queueMetrics = null;
    input.projectSignals = null;
    const snap = serializeSnapshot(input);
    expect(snap.queueMetrics).toBeNull();
    expect(snap.projectSignals).toBeNull();
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
  });

  it("omits an absent window rather than emitting undefined", () => {
    const input = buildInput();
    delete input.window;
    const snap = serializeSnapshot(input);
    expect("window" in snap).toBe(false);
    // undefined would be dropped by stringify and break round-trip equality
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
  });
});
