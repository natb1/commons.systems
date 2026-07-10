// The no-mock round-trip test: the producer's serializeSnapshot output, fed
// straight through JSON.stringify into the reader's decodeSnapshot, with ZERO
// mocks or hand-built fixtures. This is the guard the whole wire-contract tactic
// hinges on — it exercises the SAME serialize/decode pair both packages import
// from the shared module, so a producer/reader shape drift fails it. It would
// have caught all three original breaks:
//   - a missing `version` → decodeSnapshot throws "Unsupported snapshot version".
//   - samples missing `memberEmails` → toUsageSample/toIssueSample reject them
//     and the series decode to length 0.
//   - any field-shape drift between what the producer writes and what the reader
//     parses.
import { describe, it, expect } from "vitest";

import { serializeSnapshot, decodeSnapshot, type SnapshotInput } from "./snapshot.js";
import type { UsageSample } from "../../office-hours/src/usage-samples.js";
import type { IssueSample } from "../../office-hours/src/issue-samples.js";
import type { Reminder } from "../../office-hours/src/reminders.js";
import type { QueueMetricsSnapshot } from "../../office-hours/src/queue-metrics.js";
import type { ProjectSignalsSnapshot } from "../../office-hours/src/project-signals.js";
import type { TopicUsageDoc } from "../../office-hours/src/topic-usage.js";

const COMPUTED_AT = new Date("2026-06-30T12:00:00.000Z");

/** One valid element per collection, in the producer's in-memory (Date) form. */
function realInput(): SnapshotInput {
  const usage: UsageSample = {
    sampledAt: new Date("2026-06-30T11:00:00.000Z"),
    fiveHourUsedPct: 12,
    weeklyUsedPct: 34,
    fiveHourResetsAt: new Date("2026-06-30T16:00:00.000Z"),
    weeklyResetsAt: new Date("2026-07-05T00:00:00.000Z"),
    activeWorkers: 3,
    targetWorkers: 8,
    groupId: "natb1",
  };

  const issue: IssueSample = {
    sampledAt: new Date("2026-06-30T10:00:00.000Z"),
    openSecurity: 1,
    openBug: 2,
    openEnhancement: 3,
    openOther: 4,
    groupId: "natb1",
  };

  const reminder: Reminder = {
    jitKey: "digest",
    title: "Weekly digest",
    repo: "natb1/commons.systems",
    issueNumber: 42,
    dueAt: new Date("2026-07-01T09:00:00.000Z"),
  };

  const queueMetrics: QueueMetricsSnapshot = {
    openHelpWanted: 7,
    closedPerDay: 3,
    createdPerDay: 2,
    netDrainPerDay: 1, // > 0 ⇔ runwayDays non-null (parseQueueMetrics invariant)
    runwayDays: 7,
    windowDays: 14,
    computedAt: new Date("2026-06-30T09:00:00.000Z"),
    groupId: "natb1",
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
    groupId: "natb1",
    memberEmails: ["nathan@natb1.com"],
    github: { repo: "natb1/commons.systems", stars: 5, forks: 1, watchers: 2 },
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
    computedAt: COMPUTED_AT,
    chainHealth: { liveSessions: 2, lastTickAgeSeconds: 30 },
    scope: "full",
    memberEmails: ["nathan@natb1.com"],
    window: { samples: 500, issueSamples: 500 },
  };
}

describe("producer→reader round-trip (no mocks)", () => {
  it("every collection survives serialize → JSON → decode", () => {
    const snapshot = serializeSnapshot(realInput());
    const plaintext = JSON.stringify(snapshot);

    const { data, computedAt } = decodeSnapshot(plaintext);

    // Series survive — proves samples carried memberEmails (else the parsers
    // would have dropped every element to length 0).
    expect(data.samples).toHaveLength(1);
    expect(data.issueSamples).toHaveLength(1);
    expect(data.reminders).toHaveLength(1);
    expect(data.topicUsage).toHaveLength(1);
    expect(data.queueMetrics).not.toBeNull();
    expect(data.projectSignals).not.toBeNull();

    // A representative decoded value on each side of the wire.
    expect(data.samples[0].activeWorkers).toBe(3);
    expect(data.issueSamples[0].openEnhancement).toBe(3);
    expect(data.queueMetrics?.runwayDays).toBe(7);
    expect(data.reminders[0].jitKey).toBe("digest");

    // Timestamps revived to real Dates.
    expect(data.samples[0].sampledAt).toBeInstanceOf(Date);
    expect(computedAt.toISOString()).toBe(COMPUTED_AT.toISOString());
  });

  it("a snapshot missing `version` is rejected by the decoder", () => {
    const snapshot = serializeSnapshot(realInput());
    const withoutVersion = JSON.stringify({ ...snapshot, version: undefined });
    expect(() => decodeSnapshot(withoutVersion)).toThrow("Unsupported snapshot version");
  });

  it("a series sample missing `memberEmails` decodes to an empty series", () => {
    const snapshot = serializeSnapshot(realInput());
    const stripped = {
      ...snapshot,
      samples: snapshot.samples.map(({ memberEmails: _drop, ...rest }) => rest),
    };
    const { data } = decodeSnapshot(JSON.stringify(stripped));
    expect(data.samples).toHaveLength(0);
  });
});
