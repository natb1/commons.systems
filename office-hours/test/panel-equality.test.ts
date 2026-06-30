import { describe, it, expect } from "vitest";
import {
  usageSamplesEqual,
  remindersEqual,
  issueSamplesEqual,
  topicUsageEqual,
  queueMetricsEqual,
  projectSignalsEqual,
  mergePanelData,
  type PanelData,
} from "../src/panel-equality.js";
import type { UsageSample } from "../src/usage-samples.js";
import type { Reminder } from "../src/reminders.js";
import type { IssueSample } from "../src/issue-samples.js";
import type { TopicUsageDoc } from "../src/topic-usage.js";
import type { QueueMetricsSnapshot, ParkedIssue } from "../src/queue-metrics.js";
import type { ProjectSignalsSnapshot } from "../src/project-signals.js";

// ---------------------------------------------------------------------------
// Fixture builders — each call returns fresh object references so the
// "same content, different reference → true" cases are meaningful.
// ---------------------------------------------------------------------------

const BASE_MS = 1_700_000_000_000;

function makeUsageSample(overrides: Partial<UsageSample> = {}): UsageSample {
  return {
    sampledAt: new Date(BASE_MS),
    fiveHourUsedPct: 0.5,
    weeklyUsedPct: 0.3,
    fiveHourResetsAt: new Date(BASE_MS + 1000),
    weeklyResetsAt: new Date(BASE_MS + 2000),
    activeWorkers: 4,
    targetWorkers: 8,
    groupId: "grp-a",
    ...overrides,
  };
}

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    jitKey: "jit-1",
    title: "Some reminder",
    repo: "natb1/commons.systems",
    issueNumber: 42,
    dueAt: new Date(BASE_MS),
    ...overrides,
  };
}

function makeIssueSample(overrides: Partial<IssueSample> = {}): IssueSample {
  return {
    sampledAt: new Date(BASE_MS),
    openSecurity: 1,
    openBug: 2,
    openEnhancement: 3,
    openOther: 4,
    groupId: "grp-a",
    ...overrides,
  };
}

// A bucket carrying a given priceProxyUsd (the only charted field). The other
// fields are filled with arbitrary stable values so topicUsageEqual can be
// shown to ignore them.
function makeBucket(priceProxyUsd: number): TopicUsageDoc["byTopic"][string] {
  return { priceProxyUsd, input: 1000, cacheRead: 500, cacheCreation: 200, output: 300 };
}

function makeTopicUsageDoc(overrides: Partial<TopicUsageDoc> = {}): TopicUsageDoc {
  return {
    date: "2026-06-20",
    byTopic: { dispatch: makeBucket(1.5), security: makeBucket(2.0) },
    byType: { bug: makeBucket(0.5), enhancement: makeBucket(1.0) },
    ...overrides,
  };
}

function makeParkedIssue(overrides: Partial<ParkedIssue> = {}): ParkedIssue {
  return {
    number: 1,
    title: "Parked issue",
    url: "https://github.com/natb1/commons.systems/issues/1",
    createdAt: new Date(BASE_MS),
    repo: "natb1/commons.systems",
    phase: "dispatch:review",
    ...overrides,
  };
}

function makeQueueMetrics(overrides: Partial<QueueMetricsSnapshot> = {}): QueueMetricsSnapshot {
  return {
    openHelpWanted: 10,
    closedPerDay: 2.5,
    createdPerDay: 1.5,
    netDrainPerDay: 1.0,
    runwayDays: 5,
    windowDays: 14,
    computedAt: new Date(BASE_MS),
    groupId: "grp-a",
    memberEmails: ["alice@example.com", "bob@example.com"],
    parked: [makeParkedIssue()],
    ...overrides,
  };
}

function makeProjectSignals(overrides: Partial<ProjectSignalsSnapshot> = {}): ProjectSignalsSnapshot {
  return {
    computedAt: new Date(BASE_MS),
    groupId: "grp-a",
    memberEmails: ["alice@example.com"],
    github: { repo: "natb1/commons.systems", stars: 42, forks: 3, watchers: 5 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// usageSamplesEqual
// ---------------------------------------------------------------------------

describe("usageSamplesEqual", () => {
  it("returns true for identical content with different references", () => {
    expect(usageSamplesEqual([makeUsageSample()], [makeUsageSample()])).toBe(true);
  });

  it("returns false when fiveHourUsedPct differs", () => {
    expect(
      usageSamplesEqual([makeUsageSample()], [makeUsageSample({ fiveHourUsedPct: 0.9 })]),
    ).toBe(false);
  });

  it("returns false when weeklyUsedPct differs", () => {
    expect(
      usageSamplesEqual([makeUsageSample()], [makeUsageSample({ weeklyUsedPct: 0.9 })]),
    ).toBe(false);
  });

  it("returns false when activeWorkers differs", () => {
    expect(
      usageSamplesEqual([makeUsageSample()], [makeUsageSample({ activeWorkers: 99 })]),
    ).toBe(false);
  });

  it("returns false when targetWorkers differs", () => {
    expect(
      usageSamplesEqual([makeUsageSample()], [makeUsageSample({ targetWorkers: 99 })]),
    ).toBe(false);
  });

  it("returns false when groupId differs", () => {
    expect(
      usageSamplesEqual([makeUsageSample()], [makeUsageSample({ groupId: "grp-b" })]),
    ).toBe(false);
  });

  it("returns false when sampledAt differs by 1ms", () => {
    expect(
      usageSamplesEqual(
        [makeUsageSample({ sampledAt: new Date(BASE_MS) })],
        [makeUsageSample({ sampledAt: new Date(BASE_MS + 1) })],
      ),
    ).toBe(false);
  });

  it("returns false when fiveHourResetsAt differs by 1ms", () => {
    expect(
      usageSamplesEqual(
        [makeUsageSample({ fiveHourResetsAt: new Date(BASE_MS + 1000) })],
        [makeUsageSample({ fiveHourResetsAt: new Date(BASE_MS + 1001) })],
      ),
    ).toBe(false);
  });

  it("returns false when weeklyResetsAt differs by 1ms", () => {
    expect(
      usageSamplesEqual(
        [makeUsageSample({ weeklyResetsAt: new Date(BASE_MS + 2000) })],
        [makeUsageSample({ weeklyResetsAt: new Date(BASE_MS + 2001) })],
      ),
    ).toBe(false);
  });

  it("returns false when array lengths differ", () => {
    expect(usageSamplesEqual([makeUsageSample()], [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// remindersEqual
// ---------------------------------------------------------------------------

describe("remindersEqual", () => {
  it("returns true for identical content with different references", () => {
    expect(remindersEqual([makeReminder()], [makeReminder()])).toBe(true);
  });

  it("returns false when jitKey differs", () => {
    expect(remindersEqual([makeReminder()], [makeReminder({ jitKey: "jit-2" })])).toBe(false);
  });

  it("returns false when title differs", () => {
    expect(remindersEqual([makeReminder()], [makeReminder({ title: "Other" })])).toBe(false);
  });

  it("returns false when repo differs", () => {
    expect(remindersEqual([makeReminder()], [makeReminder({ repo: "natb1/other" })])).toBe(false);
  });

  it("returns false when issueNumber differs", () => {
    expect(remindersEqual([makeReminder()], [makeReminder({ issueNumber: 99 })])).toBe(false);
  });

  it("returns false when dueAt differs by 1ms", () => {
    expect(
      remindersEqual(
        [makeReminder({ dueAt: new Date(BASE_MS) })],
        [makeReminder({ dueAt: new Date(BASE_MS + 1) })],
      ),
    ).toBe(false);
  });

  it("returns false when array lengths differ", () => {
    expect(remindersEqual([makeReminder()], [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// issueSamplesEqual
// ---------------------------------------------------------------------------

describe("issueSamplesEqual", () => {
  it("returns true for identical content with different references", () => {
    expect(issueSamplesEqual([makeIssueSample()], [makeIssueSample()])).toBe(true);
  });

  it("returns false when openSecurity differs", () => {
    expect(issueSamplesEqual([makeIssueSample()], [makeIssueSample({ openSecurity: 99 })])).toBe(
      false,
    );
  });

  it("returns false when openBug differs", () => {
    expect(issueSamplesEqual([makeIssueSample()], [makeIssueSample({ openBug: 99 })])).toBe(false);
  });

  it("returns false when openEnhancement differs", () => {
    expect(
      issueSamplesEqual([makeIssueSample()], [makeIssueSample({ openEnhancement: 99 })]),
    ).toBe(false);
  });

  it("returns false when openOther differs", () => {
    expect(issueSamplesEqual([makeIssueSample()], [makeIssueSample({ openOther: 99 })])).toBe(
      false,
    );
  });

  it("returns false when groupId differs", () => {
    expect(issueSamplesEqual([makeIssueSample()], [makeIssueSample({ groupId: "grp-b" })])).toBe(
      false,
    );
  });

  it("returns false when sampledAt differs by 1ms", () => {
    expect(
      issueSamplesEqual(
        [makeIssueSample({ sampledAt: new Date(BASE_MS) })],
        [makeIssueSample({ sampledAt: new Date(BASE_MS + 1) })],
      ),
    ).toBe(false);
  });

  it("returns false when array lengths differ", () => {
    expect(issueSamplesEqual([makeIssueSample()], [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// topicUsageEqual
// ---------------------------------------------------------------------------

describe("topicUsageEqual", () => {
  it("returns true for identical content with different references", () => {
    expect(topicUsageEqual([makeTopicUsageDoc()], [makeTopicUsageDoc()])).toBe(true);
  });

  it("returns false when date differs", () => {
    expect(
      topicUsageEqual([makeTopicUsageDoc()], [makeTopicUsageDoc({ date: "2026-06-21" })]),
    ).toBe(false);
  });

  it("returns false when a byTopic priceProxyUsd changes", () => {
    expect(
      topicUsageEqual(
        [makeTopicUsageDoc({ byTopic: { dispatch: makeBucket(1.5), security: makeBucket(2.0) } })],
        [makeTopicUsageDoc({ byTopic: { dispatch: makeBucket(9.9), security: makeBucket(2.0) } })],
      ),
    ).toBe(false);
  });

  it("returns false when a byType priceProxyUsd changes", () => {
    expect(
      topicUsageEqual(
        [makeTopicUsageDoc({ byType: { bug: makeBucket(0.5), enhancement: makeBucket(1.0) } })],
        [makeTopicUsageDoc({ byType: { bug: makeBucket(0.5), enhancement: makeBucket(9.9) } })],
      ),
    ).toBe(false);
  });

  it("returns false when a byTopic key is added", () => {
    expect(
      topicUsageEqual(
        [makeTopicUsageDoc({ byTopic: { dispatch: makeBucket(1.5) } })],
        [makeTopicUsageDoc({ byTopic: { dispatch: makeBucket(1.5), security: makeBucket(2.0) } })],
      ),
    ).toBe(false);
  });

  it("returns false when a byTopic key is removed", () => {
    expect(
      topicUsageEqual(
        [makeTopicUsageDoc({ byTopic: { dispatch: makeBucket(1.5), security: makeBucket(2.0) } })],
        [makeTopicUsageDoc({ byTopic: { dispatch: makeBucket(1.5) } })],
      ),
    ).toBe(false);
  });

  it("returns true when only an uncharted bucket field changes", () => {
    // priceProxyUsd is the only charted field; input/output/cache* are ignored.
    const a = [makeTopicUsageDoc({ byTopic: { dispatch: { priceProxyUsd: 1.5, input: 100, cacheRead: 1, cacheCreation: 1, output: 1 } } })];
    const b = [makeTopicUsageDoc({ byTopic: { dispatch: { priceProxyUsd: 1.5, input: 999, cacheRead: 9, cacheCreation: 9, output: 9 } } })];
    expect(topicUsageEqual(a, b)).toBe(true);
  });

  it("returns false when array lengths differ", () => {
    expect(topicUsageEqual([makeTopicUsageDoc()], [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// queueMetricsEqual
// ---------------------------------------------------------------------------

describe("queueMetricsEqual", () => {
  it("returns true for (null, null)", () => {
    expect(queueMetricsEqual(null, null)).toBe(true);
  });

  it("returns false for (null, snapshot)", () => {
    expect(queueMetricsEqual(null, makeQueueMetrics())).toBe(false);
  });

  it("returns false for (snapshot, null)", () => {
    expect(queueMetricsEqual(makeQueueMetrics(), null)).toBe(false);
  });

  it("returns true for identical content with different references", () => {
    expect(queueMetricsEqual(makeQueueMetrics(), makeQueueMetrics())).toBe(true);
  });

  it("returns false when openHelpWanted differs", () => {
    expect(
      queueMetricsEqual(makeQueueMetrics(), makeQueueMetrics({ openHelpWanted: 99 })),
    ).toBe(false);
  });

  it("returns false when closedPerDay differs", () => {
    expect(
      queueMetricsEqual(makeQueueMetrics(), makeQueueMetrics({ closedPerDay: 9.9 })),
    ).toBe(false);
  });

  it("returns false when createdPerDay differs", () => {
    expect(
      queueMetricsEqual(makeQueueMetrics(), makeQueueMetrics({ createdPerDay: 9.9 })),
    ).toBe(false);
  });

  it("returns false when netDrainPerDay differs", () => {
    expect(
      queueMetricsEqual(makeQueueMetrics(), makeQueueMetrics({ netDrainPerDay: 9.9 })),
    ).toBe(false);
  });

  it("returns false when runwayDays null↔number", () => {
    expect(
      queueMetricsEqual(
        makeQueueMetrics({ runwayDays: null }),
        makeQueueMetrics({ runwayDays: 5 }),
      ),
    ).toBe(false);
  });

  it("returns false when windowDays differs", () => {
    expect(
      queueMetricsEqual(makeQueueMetrics(), makeQueueMetrics({ windowDays: 7 })),
    ).toBe(false);
  });

  it("returns false when computedAt differs by 1ms", () => {
    expect(
      queueMetricsEqual(
        makeQueueMetrics({ computedAt: new Date(BASE_MS) }),
        makeQueueMetrics({ computedAt: new Date(BASE_MS + 1) }),
      ),
    ).toBe(false);
  });

  it("returns false when groupId differs", () => {
    expect(
      queueMetricsEqual(makeQueueMetrics(), makeQueueMetrics({ groupId: "grp-b" })),
    ).toBe(false);
  });

  it("returns false when a memberEmails element differs", () => {
    expect(
      queueMetricsEqual(
        makeQueueMetrics({ memberEmails: ["alice@example.com"] }),
        makeQueueMetrics({ memberEmails: ["carol@example.com"] }),
      ),
    ).toBe(false);
  });

  it("returns false when memberEmails length differs", () => {
    expect(
      queueMetricsEqual(
        makeQueueMetrics({ memberEmails: ["alice@example.com"] }),
        makeQueueMetrics({ memberEmails: ["alice@example.com", "bob@example.com"] }),
      ),
    ).toBe(false);
  });

  it("returns false when parked length differs", () => {
    expect(
      queueMetricsEqual(
        makeQueueMetrics({ parked: [] }),
        makeQueueMetrics({ parked: [makeParkedIssue()] }),
      ),
    ).toBe(false);
  });

  it("returns false when parked[i].createdAt differs by 1ms", () => {
    expect(
      queueMetricsEqual(
        makeQueueMetrics({ parked: [makeParkedIssue({ createdAt: new Date(BASE_MS) })] }),
        makeQueueMetrics({ parked: [makeParkedIssue({ createdAt: new Date(BASE_MS + 1) })] }),
      ),
    ).toBe(false);
  });

  it("returns false when parked[i].phase changes from defined to undefined", () => {
    expect(
      queueMetricsEqual(
        makeQueueMetrics({ parked: [makeParkedIssue({ phase: "dispatch:review" })] }),
        makeQueueMetrics({ parked: [makeParkedIssue({ phase: undefined })] }),
      ),
    ).toBe(false);
  });

  it("returns false when parked[i].phase changes from undefined to defined", () => {
    expect(
      queueMetricsEqual(
        makeQueueMetrics({ parked: [makeParkedIssue({ phase: undefined })] }),
        makeQueueMetrics({ parked: [makeParkedIssue({ phase: "dispatch:plan" })] }),
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// projectSignalsEqual
// ---------------------------------------------------------------------------

describe("projectSignalsEqual", () => {
  it("returns true for (null, null)", () => {
    expect(projectSignalsEqual(null, null)).toBe(true);
  });

  it("returns false for (null, snapshot)", () => {
    expect(projectSignalsEqual(null, makeProjectSignals())).toBe(false);
  });

  it("returns false for (snapshot, null)", () => {
    expect(projectSignalsEqual(makeProjectSignals(), null)).toBe(false);
  });

  it("returns true for identical content with different references", () => {
    expect(projectSignalsEqual(makeProjectSignals(), makeProjectSignals())).toBe(true);
  });

  it("returns false when computedAt differs by 1ms", () => {
    expect(
      projectSignalsEqual(
        makeProjectSignals({ computedAt: new Date(BASE_MS) }),
        makeProjectSignals({ computedAt: new Date(BASE_MS + 1) }),
      ),
    ).toBe(false);
  });

  it("returns false when groupId differs", () => {
    expect(
      projectSignalsEqual(makeProjectSignals(), makeProjectSignals({ groupId: "grp-b" })),
    ).toBe(false);
  });

  it("returns false when memberEmails length differs", () => {
    expect(
      projectSignalsEqual(
        makeProjectSignals({ memberEmails: ["a@example.com"] }),
        makeProjectSignals({ memberEmails: ["a@example.com", "b@example.com"] }),
      ),
    ).toBe(false);
  });

  it("returns false when memberEmails element differs", () => {
    expect(
      projectSignalsEqual(
        makeProjectSignals({ memberEmails: ["a@example.com"] }),
        makeProjectSignals({ memberEmails: ["z@example.com"] }),
      ),
    ).toBe(false);
  });

  it("returns false when github.stars differs", () => {
    expect(
      projectSignalsEqual(
        makeProjectSignals({ github: { repo: "natb1/cs", stars: 10, forks: 1, watchers: 2 } }),
        makeProjectSignals({ github: { repo: "natb1/cs", stars: 99, forks: 1, watchers: 2 } }),
      ),
    ).toBe(false);
  });

  it("returns false when github present vs absent", () => {
    expect(
      projectSignalsEqual(
        makeProjectSignals({ github: undefined }),
        makeProjectSignals({ github: { repo: "natb1/cs", stars: 1, forks: 0, watchers: 0 } }),
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// mergePanelData
// ---------------------------------------------------------------------------

function makePanelData(overrides: Partial<PanelData> = {}): PanelData {
  return {
    samples: [makeUsageSample()],
    reminders: [makeReminder()],
    queueMetrics: makeQueueMetrics(),
    issueSamples: [makeIssueSample()],
    topicUsage: [makeTopicUsageDoc()],
    projectSignals: makeProjectSignals(),
    ...overrides,
  };
}

describe("mergePanelData", () => {
  it("returns prev itself when all six slices have equal content (no-churn keystone)", () => {
    const prev = makePanelData();
    // next has fresh references but same content in all six slices
    const next = makePanelData();
    const merged = mergePanelData(prev, next);
    expect(merged).toBe(prev);
  });

  it("returns a new object when samples changed, keeping other prev references", () => {
    const prev = makePanelData();
    const changedSamples = [makeUsageSample({ activeWorkers: 99 })];
    const next = makePanelData({ samples: changedSamples });

    const merged = mergePanelData(prev, next);

    expect(merged).not.toBe(prev);
    expect(merged.samples).toBe(next.samples);
    expect(merged.reminders).toBe(prev.reminders);
    expect(merged.queueMetrics).toBe(prev.queueMetrics);
    expect(merged.issueSamples).toBe(prev.issueSamples);
    expect(merged.topicUsage).toBe(prev.topicUsage);
    expect(merged.projectSignals).toBe(prev.projectSignals);
  });

  it("returns a new object when queueMetrics changed, keeping other prev references", () => {
    const prev = makePanelData();
    const changedMetrics = makeQueueMetrics({ openHelpWanted: 999 });
    const next = makePanelData({ queueMetrics: changedMetrics });

    const merged = mergePanelData(prev, next);

    expect(merged).not.toBe(prev);
    expect(merged.queueMetrics).toBe(next.queueMetrics);
    expect(merged.samples).toBe(prev.samples);
    expect(merged.reminders).toBe(prev.reminders);
    expect(merged.issueSamples).toBe(prev.issueSamples);
    expect(merged.topicUsage).toBe(prev.topicUsage);
    expect(merged.projectSignals).toBe(prev.projectSignals);
  });

  it("returns a new object when projectSignals changed, keeping other prev references", () => {
    const prev = makePanelData();
    const changedSignals = makeProjectSignals({ groupId: "grp-b" });
    const next = makePanelData({ projectSignals: changedSignals });

    const merged = mergePanelData(prev, next);

    expect(merged).not.toBe(prev);
    expect(merged.projectSignals).toBe(next.projectSignals);
    expect(merged.samples).toBe(prev.samples);
    expect(merged.reminders).toBe(prev.reminders);
    expect(merged.queueMetrics).toBe(prev.queueMetrics);
    expect(merged.issueSamples).toBe(prev.issueSamples);
    expect(merged.topicUsage).toBe(prev.topicUsage);
  });
});
