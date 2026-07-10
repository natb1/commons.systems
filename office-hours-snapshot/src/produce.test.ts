import { describe, it, expect } from "vitest";

import {
  produceSnapshot,
  produceProjectSignals,
  WINDOW_SIZE,
  type ProduceDeps,
  type ProduceSignalsDeps,
} from "./produce.js";
import { createCaptureFirestore } from "./capture-firestore.js";
import { serializeSnapshot } from "./snapshot.js";
import type { OfficeHoursItem } from "../../functions/src/office-hours-sync-core.js";
import type { ParkedIssue } from "../../functions/src/dispatch-queue-metrics-core.js";
import type { GithubSignals } from "./project-signals-core.js";
import type { UsageSample } from "../../office-hours/src/usage-samples.js";
import type { IssueSample } from "../../office-hours/src/issue-samples.js";

const NOW = new Date("2026-06-30T12:00:00.000Z");

/** Recursively asserts no `Date` and no Timestamp-like `.toDate` survives. */
function assertNoTimestamps(value: unknown, path = "$"): void {
  expect(value, `${path} is not a Date`).not.toBeInstanceOf(Date);
  if (value && typeof value === "object") {
    expect(
      typeof (value as { toDate?: unknown }).toDate,
      `${path} has no .toDate (not a Timestamp)`,
    ).not.toBe("function");
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) { // type-safety-ok: value is unknown in recursive helper; cast to iterate object entries
      assertNoTimestamps(v, `${path}.${k}`);
    }
  }
}

function makeUsageSample(overrides: Partial<UsageSample> = {}): UsageSample {
  return {
    sampledAt: NOW,
    fiveHourUsedPct: 10,
    weeklyUsedPct: 20,
    fiveHourResetsAt: new Date("2026-06-30T17:00:00.000Z"),
    weeklyResetsAt: new Date("2026-07-07T00:00:00.000Z"),
    activeWorkers: 4,
    targetWorkers: 8,
    groupId: "g1",
    ...overrides,
  };
}

function makeIssueSample(overrides: Partial<IssueSample> = {}): IssueSample {
  return {
    sampledAt: NOW,
    openSecurity: 1,
    openBug: 2,
    openEnhancement: 3,
    openOther: 4,
    groupId: "g1",
    ...overrides,
  };
}

const TOPIC_BUCKET = {
  priceProxyUsd: 1,
  input: 2,
  cacheRead: 3,
  cacheCreation: 4,
  output: 5,
};

function topicStdout(): string {
  return JSON.stringify([
    {
      id: "2026-06-30",
      doc: {
        date: "2026-06-30",
        byTopic: { dispatch: TOPIC_BUCKET },
        byType: { bug: TOPIC_BUCKET },
      },
    },
  ]);
}

const PARKED: ParkedIssue = {
  number: 1466,
  title: "parked item",
  url: "https://github.com/natb1/commons.systems/issues/1466",
  createdAt: new Date("2026-05-15T10:00:00.000Z"),
  repo: "natb1/commons.systems",
  phase: "dispatch:plan",
};

const JIT_ITEM: OfficeHoursItem = {
  kind: "reminder",
  number: 42,
  title: "weekly review",
  body: "<!-- jit-due: 2026-07-01T12:00:00Z -->",
  jitKey: "weekly-review",
  repo: "natb1/commons.systems",
  dueAt: new Date("2026-07-01T12:00:00.000Z"),
};

const GITHUB: GithubSignals = {
  repo: "natb1/commons.systems",
  stars: 12,
  forks: 3,
  watchers: 7,
};

/** A full set of deps with every external seam mocked. */
function fullDeps(overrides: Partial<ProduceDeps> = {}): ProduceDeps {
  return {
    namespace: "office-hours/test",
    groupId: "g1",
    memberEmails: ["nathan@natb1.com"],
    queueRepos: ["natb1/commons.systems"],
    searchIssueCount: async () => 14,
    searchIssueDetails: async () => [PARKED],
    fetchOpenJitIssues: async () => [JIT_ITEM],
    fetchGithub: async () => GITHUB,
    fetchGa4: null,
    fetchGsc: null,
    fetchPsi: null,
    now: () => NOW,
    runTopicUsage: async () => topicStdout(),
    sampleUsage: async () => makeUsageSample(),
    probeChainHealth: async () => ({ liveSessions: 3 }),
    readPriorHistory: async () => null,
    ...overrides,
  };
}

describe("produceSnapshot — scope=full", () => {
  it("assembles all six fields from the cores + injected seams", async () => {
    const snap = await produceSnapshot(fullDeps(), "full");

    // metadata
    expect(snap.scope).toBe("full");
    expect(snap.computedAt).toBe(NOW);
    expect(snap.chainHealth).toEqual({ liveSessions: 3 });
    expect(snap.window).toEqual({ samples: WINDOW_SIZE, issueSamples: WINDOW_SIZE });

    // reminders — from captured items bulk-set, mapped inline
    expect(snap.reminders).toHaveLength(1);
    expect(snap.reminders[0]).toMatchObject({
      jitKey: "weekly-review",
      title: "weekly review",
      repo: "natb1/commons.systems",
      issueNumber: 42,
    });
    expect(snap.reminders[0].dueAt).toBeInstanceOf(Date);
    expect(snap.reminders[0].dueAt.toISOString()).toBe("2026-07-01T12:00:00.000Z");

    // queueMetrics — parsed via parseQueueMetrics, carries parked
    expect(snap.queueMetrics).not.toBeNull();
    expect(snap.queueMetrics?.parked).toHaveLength(1);
    expect(snap.queueMetrics?.parked[0].number).toBe(1466);

    // issueSamples — new point parsed via toIssueSample; the four buckets are
    // the core's count math (searchIssueCount returns 14 for every query).
    expect(snap.issueSamples).toHaveLength(1);
    expect(snap.issueSamples[0]).toMatchObject({
      openSecurity: 14,
      openBug: 14,
      openEnhancement: 14,
      openOther: 14,
      groupId: "g1",
    });

    // projectSignals — parsed via parseProjectSignals, carries github sub-object
    expect(snap.projectSignals).not.toBeNull();
    expect(snap.projectSignals?.github).toEqual(GITHUB);

    // topicUsage — parsed via toTopicUsage
    expect(snap.topicUsage).toHaveLength(1);
    expect(snap.topicUsage[0].date).toBe("2026-06-30");
    expect(snap.topicUsage[0].byTopic.dispatch).toEqual(TOPIC_BUCKET);

    // samples — new point appended (fresh series)
    expect(snap.samples).toHaveLength(1);
    expect(snap.samples[0].activeWorkers).toBe(4);
  });

  it("produces a SnapshotInput that Unit 5's serializeSnapshot consumes cleanly", async () => {
    const out = serializeSnapshot(await produceSnapshot(fullDeps(), "full"));
    // No Date / Timestamp survives serialization — proves the two units compose.
    assertNoTimestamps(out);
    expect(typeof out.reminders[0].dueAt).toBe("string");
    expect(typeof out.issueSamples[0].sampledAt).toBe("string");
    expect(typeof out.queueMetrics?.computedAt).toBe("string");
    expect(typeof out.projectSignals?.computedAt).toBe("string");
  });

  it("drops a null usage sample (no new series point)", async () => {
    const snap = await produceSnapshot(fullDeps({ sampleUsage: async () => null }), "full");
    expect(snap.samples).toHaveLength(0);
  });

  it("throws when fetchOpenJitIssues is null on a full snapshot", async () => {
    await expect(
      produceSnapshot(fullDeps({ fetchOpenJitIssues: null }), "full"),
    ).rejects.toThrow(/fetchOpenJitIssues is required/);
  });
});

describe("produceSnapshot — bounded windows", () => {
  it("appends the new point to prior history and truncates to windowSize", async () => {
    const priorSamples = [
      makeUsageSample({ activeWorkers: 1 }),
      makeUsageSample({ activeWorkers: 2 }),
      makeUsageSample({ activeWorkers: 3 }),
    ];
    const priorIssue = [
      makeIssueSample({ openOther: 10 }),
      makeIssueSample({ openOther: 11 }),
      makeIssueSample({ openOther: 12 }),
    ];
    const snap = await produceSnapshot(
      fullDeps({
        windowSize: 3,
        sampleUsage: async () => makeUsageSample({ activeWorkers: 99 }),
        readPriorHistory: async () => ({ samples: priorSamples, issueSamples: priorIssue }),
      }),
      "full",
    );

    // samples: [1,2,3] + [99] → slice(-3) → [2,3,99]
    expect(snap.samples).toHaveLength(3);
    expect(snap.samples.map((s) => s.activeWorkers)).toEqual([2, 3, 99]);
    expect(snap.window).toEqual({ samples: 3, issueSamples: 3 });

    // issueSamples: 3 prior + 1 new → slice(-3) keeps newest. The new point's
    // openOther is the core's count (14), not a prior value.
    expect(snap.issueSamples).toHaveLength(3);
    expect(snap.issueSamples.at(-1)?.openOther).toBe(14);
    expect(snap.issueSamples.map((s) => s.openOther)).toEqual([11, 12, 14]);
  });
});

describe("produceSnapshot — scope=parked-only", () => {
  it("refreshes only parked + chainHealth; skips counts/topic/usage/signals", async () => {
    let countCalled = false;
    let topicCalled = false;
    let usageCalled = false;
    let detailsCalls = 0;

    const snap = await produceSnapshot(
      fullDeps({
        searchIssueCount: async () => {
          countCalled = true;
          return 14;
        },
        searchIssueDetails: async () => {
          detailsCalls += 1;
          return [PARKED];
        },
        runTopicUsage: async () => {
          topicCalled = true;
          return topicStdout();
        },
        sampleUsage: async () => {
          usageCalled = true;
          return makeUsageSample();
        },
        readPriorHistory: async () => ({
          samples: [makeUsageSample({ activeWorkers: 7 })],
          issueSamples: [makeIssueSample({ openOther: 5 })],
        }),
      }),
      "parked-only",
    );

    expect(countCalled).toBe(false);
    expect(topicCalled).toBe(false);
    expect(usageCalled).toBe(false);
    expect(detailsCalls).toBe(1);

    // parked refreshed
    expect(snap.queueMetrics?.parked).toHaveLength(1);
    expect(snap.queueMetrics?.parked[0].number).toBe(1466);

    // skipped fields
    expect(snap.reminders).toHaveLength(0);
    expect(snap.topicUsage).toHaveLength(0);
    expect(snap.projectSignals).toBeNull();

    // series carried from prior history
    expect(snap.samples.map((s) => s.activeWorkers)).toEqual([7]);
    expect(snap.issueSamples.map((s) => s.openOther)).toEqual([5]);

    // chainHealth present, scope set
    expect(snap.chainHealth).toEqual({ liveSessions: 3 });
    expect(snap.scope).toBe("parked-only");
  });
});

describe("produceProjectSignals — scope=analytics collector", () => {
  function signalsDeps(overrides: Partial<ProduceSignalsDeps> = {}): ProduceSignalsDeps {
    return {
      namespace: "office-hours/test",
      groupId: "g1",
      memberEmails: ["nathan@natb1.com"],
      fetchGithub: async () => GITHUB,
      fetchGa4: async () => [
        {
          app: "commons",
          pageViews: 100,
          sessions: 40,
          bounceRate: 0.5,
          topReferralSources: [{ source: "google", sessions: 30 }],
          topLandingPages: [{ page: "/", sessions: 30, views: 80 }],
          webVitals: [],
        },
      ],
      fetchGsc: async () => ({
        site: "sc-domain:commons.systems",
        topQueries: [{ query: "commons", clicks: 5, impressions: 50, ctr: 0.1, position: 3 }],
        topPages: [{ page: "https://commons.systems/", clicks: 5, impressions: 50, ctr: 0.1, position: 3 }],
        devices: [{ device: "MOBILE", clicks: 3, impressions: 30, ctr: 0.1, position: 3 }],
      }),
      fetchPsi: async () => [
        {
          url: "https://commons.systems",
          strategy: "mobile" as const,
          performance: 98,
          seo: 100,
          accessibility: 95,
          bestPractices: 100,
          lcp: "1.2 s",
          cls: "0.01",
          tbt: "10 ms",
          fcp: "0.9 s",
        },
      ],
      now: () => NOW,
      ...overrides,
    };
  }

  it("collects all four sources and parses them back through parseProjectSignals", async () => {
    const signals = await produceProjectSignals(signalsDeps());
    expect(signals.computedAt).toEqual(NOW);
    expect(signals.groupId).toBe("g1");
    expect(signals.memberEmails).toEqual(["nathan@natb1.com"]);
    expect(signals.github).toEqual(GITHUB);
    expect(signals.ga4?.[0].app).toBe("commons");
    expect(signals.gsc?.site).toBe("sc-domain:commons.systems");
    expect(signals.psi?.[0].performance).toBe(98);
  });

  it("keeps the core's omit-on-failure posture for a single failed source", async () => {
    const signals = await produceProjectSignals(
      signalsDeps({
        fetchGa4: async () => {
          throw new Error("GA4 down");
        },
      }),
    );
    expect(signals.ga4).toBeUndefined();
    expect(signals.github).toEqual(GITHUB); // other sources still collected
  });

  it("throws when EVERY source fails (never folds an empty section)", async () => {
    const fail = async (): Promise<never> => {
      throw new Error("down");
    };
    await expect(
      produceProjectSignals(
        signalsDeps({ fetchGithub: fail, fetchGa4: fail, fetchGsc: fail, fetchPsi: fail }),
      ),
    ).rejects.toThrow(/every analytics source failed/);
  });
});

describe("createCaptureFirestore", () => {
  it("records doc(path).set() retrievably", async () => {
    const { firestore, captured } = createCaptureFirestore();
    await firestore.doc("ns/metrics/dispatch-queue").set({ openHelpWanted: 5 });
    expect(captured.doc("ns/metrics/dispatch-queue")).toEqual({ openHelpWanted: 5 });
  });

  it("records collection(path).add() in insertion order", async () => {
    const { firestore, captured } = createCaptureFirestore();
    await firestore.collection("ns/issue-samples").add({ openBug: 1 });
    await firestore.collection("ns/issue-samples").add({ openBug: 2 });
    expect(captured.added("ns/issue-samples")).toEqual([{ openBug: 1 }, { openBug: 2 }]);
  });

  it("records collection(path).doc(id).set() under the full path", async () => {
    const { firestore, captured } = createCaptureFirestore();
    await firestore.collection("ns/items").doc("k1").set({ title: "t" });
    expect(captured.doc("ns/items/k1")).toEqual({ title: "t" });
  });

  it("records bulkWriter().set()/.delete() and resolves close()", async () => {
    const { firestore, captured } = createCaptureFirestore();
    const writer = firestore.bulkWriter();
    const itemsCollection = firestore.collection("ns/items");
    await writer.set(itemsCollection.doc("k1"), { title: "a" });
    await writer.delete(itemsCollection.doc("k2"));
    await expect(writer.close()).resolves.toBeUndefined();

    expect(captured.bulkSets("ns/items")).toEqual([{ id: "k1", payload: { title: "a" } }]);
    expect(captured.bulkDeletes("ns/items")).toEqual(["k2"]);
  });

  it("returns an empty collection.get() so the sync core deletes nothing", async () => {
    const { firestore } = createCaptureFirestore();
    const result = await firestore.collection("ns/items").get();
    expect(result.docs).toEqual([]);
  });

  it("stores Timestamp and serverTimestamp sentinels verbatim", async () => {
    const { firestore, captured } = createCaptureFirestore();
    const timestampStub = { toDate: () => new Date("2026-07-01T12:00:00.000Z") };
    const serverSentinel = { _methodName: "serverTimestamp" };
    await firestore.doc("ns/items/k1").set({ dueAt: timestampStub, updatedAt: serverSentinel });
    const stored = captured.doc("ns/items/k1");
    // Same object identities — no unwrapping / resolution.
    expect(stored?.dueAt).toBe(timestampStub);
    expect(stored?.updatedAt).toBe(serverSentinel);
  });
});
