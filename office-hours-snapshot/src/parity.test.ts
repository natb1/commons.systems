import { describe, it, expect } from "vitest";

import { checkParity, type FirestoreReader, type ParityDivergence } from "./parity.js";
import { serializeSnapshot, type OfficeHoursSnapshot, type SnapshotInput } from "./snapshot.js";
import type { QueueMetricsSnapshot } from "../../office-hours/src/queue-metrics.js";
import type { ProjectSignalsSnapshot } from "../../office-hours/src/project-signals.js";
import type { UsageSample } from "../../office-hours/src/usage-samples.js";
import type { IssueSample } from "../../office-hours/src/issue-samples.js";
import type { Reminder } from "../../office-hours/src/reminders.js";
import type { TopicUsageDoc } from "../../office-hours/src/topic-usage.js";

const NS = "office-hours/test";

const NOW = new Date("2026-06-30T12:00:00.000Z");
const RESET5 = new Date("2026-06-30T17:00:00.000Z");
const RESETW = new Date("2026-07-07T00:00:00.000Z");
const PARKED_CREATED = new Date("2026-05-15T10:00:00.000Z");
const DUE = new Date("2026-07-01T12:00:00.000Z");
const MEMBERS = ["nathan@natb1.com"];

/** A structural Firestore-Timestamp stand-in (carries both `.toDate` and `_seconds`). */
function tsLike(d: Date): Record<string, unknown> {
  return { toDate: () => d, _seconds: Math.floor(d.getTime() / 1000), _nanoseconds: 0 };
}

const BUCKET = { priceProxyUsd: 1, input: 2, cacheRead: 3, cacheCreation: 4, output: 5 };

// ---------------------------------------------------------------------------
// Domain objects → serialized snapshot (Unit-5 serializer guarantees exact shape)
// ---------------------------------------------------------------------------

const QUEUE: QueueMetricsSnapshot = {
  openHelpWanted: 14,
  closedPerDay: 3,
  createdPerDay: 1,
  netDrainPerDay: 2,
  runwayDays: 7, // non-null ⇔ netDrainPerDay > 0 (parser invariant)
  windowDays: 14,
  computedAt: NOW,
  groupId: "g1",
  memberEmails: MEMBERS,
  parked: [
    {
      number: 1466,
      title: "parked item",
      url: "https://github.com/natb1/commons.systems/issues/1466",
      createdAt: PARKED_CREATED,
      repo: "natb1/commons.systems",
      phase: "dispatch:plan",
    },
  ],
};

const SIGNALS: ProjectSignalsSnapshot = {
  computedAt: NOW,
  groupId: "g1",
  memberEmails: MEMBERS,
  github: { repo: "natb1/commons.systems", stars: 12, forks: 3, watchers: 7 },
};

const REMINDER: Reminder = {
  jitKey: "weekly-review",
  title: "weekly review",
  repo: "natb1/commons.systems",
  issueNumber: 42,
  dueAt: DUE,
};

const ISSUE_SAMPLE: IssueSample = {
  sampledAt: NOW,
  openSecurity: 1,
  openBug: 2,
  openEnhancement: 3,
  openOther: 4,
  groupId: "g1",
};

const USAGE_SAMPLE: UsageSample = {
  sampledAt: NOW,
  fiveHourUsedPct: 10,
  weeklyUsedPct: 20,
  fiveHourResetsAt: RESET5,
  weeklyResetsAt: RESETW,
  activeWorkers: 4,
  targetWorkers: 8,
  groupId: "g1",
};

const TOPIC: TopicUsageDoc = {
  date: "2026-06-30",
  byTopic: { dispatch: { ...BUCKET } },
  byType: { bug: { ...BUCKET } },
};

function cleanSnapshot(): OfficeHoursSnapshot {
  const input: SnapshotInput = {
    samples: [USAGE_SAMPLE],
    reminders: [REMINDER],
    queueMetrics: QUEUE,
    issueSamples: [ISSUE_SAMPLE],
    topicUsage: [TOPIC],
    projectSignals: SIGNALS,
    computedAt: NOW,
    chainHealth: { liveSessions: 3 },
    scope: "full",
    window: { samples: 100, issueSamples: 100 },
  };
  return serializeSnapshot(input);
}

// ---------------------------------------------------------------------------
// Matching Firestore fixtures (raw docs with Timestamp-typed date fields)
// ---------------------------------------------------------------------------

interface Fixtures {
  docs: Record<string, Record<string, unknown> | null>;
  collections: Record<string, Record<string, unknown>[]>;
}

function cleanFixtures(): Fixtures {
  return {
    docs: {
      [`${NS}/metrics/dispatch-queue`]: {
        openHelpWanted: 14,
        closedPerDay: 3,
        createdPerDay: 1,
        netDrainPerDay: 2,
        runwayDays: 7,
        windowDays: 14,
        computedAt: tsLike(NOW),
        groupId: "g1",
        memberEmails: MEMBERS,
        parked: [
          {
            number: 1466,
            title: "parked item",
            url: "https://github.com/natb1/commons.systems/issues/1466",
            createdAt: tsLike(PARKED_CREATED),
            repo: "natb1/commons.systems",
            phase: "dispatch:plan",
          },
        ],
      },
      [`${NS}/metrics/project-signals`]: {
        computedAt: tsLike(NOW),
        groupId: "g1",
        memberEmails: MEMBERS,
        github: { repo: "natb1/commons.systems", stars: 12, forks: 3, watchers: 7 },
      },
    },
    collections: {
      [`${NS}/items`]: [
        {
          kind: "reminder",
          title: "weekly review",
          dueAt: tsLike(DUE),
          repo: "natb1/commons.systems",
          issueNumber: 42,
          jitKey: "weekly-review",
          memberEmails: MEMBERS,
          updatedAt: tsLike(NOW),
        },
      ],
      [`${NS}/issue-samples`]: [
        {
          sampledAt: tsLike(NOW),
          openSecurity: 1,
          openBug: 2,
          openEnhancement: 3,
          openOther: 4,
          groupId: "g1",
          memberEmails: MEMBERS,
        },
      ],
      [`${NS}/topic-usage`]: [
        { date: "2026-06-30", byTopic: { dispatch: { ...BUCKET } }, byType: { bug: { ...BUCKET } } },
      ],
      [`${NS}/usage-samples`]: [
        {
          sampledAt: tsLike(NOW),
          fiveHourUsedPct: 10,
          weeklyUsedPct: 20,
          fiveHourResetsAt: tsLike(RESET5),
          weeklyResetsAt: tsLike(RESETW),
          activeWorkers: 4,
          targetWorkers: 8,
          groupId: "g1",
          memberEmails: MEMBERS,
        },
      ],
    },
  };
}

function readerFor(fx: Fixtures): FirestoreReader {
  return {
    getDoc: (path) => Promise.resolve(fx.docs[path] ?? null),
    listCollection: (path) => Promise.resolve(fx.collections[path] ?? []),
  };
}

const has = (divs: ParityDivergence[], field: string, kind: ParityDivergence["kind"]): boolean =>
  divs.some((d) => d.field === field && d.kind === kind);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("checkParity — clean parity", () => {
  it("reports ok with no divergences when snapshot shape matches Firestore", async () => {
    const result = await checkParity(cleanSnapshot(), { reader: readerFor(cleanFixtures()), namespace: NS });
    expect(result.divergences).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("treats a Firestore Timestamp against the snapshot's ISO string as a match (no type-mismatch)", async () => {
    // computedAt is a Timestamp in the queue/signals docs and reset/sampledAt
    // timestamps fill every collection — all are ISO strings in the snapshot.
    const result = await checkParity(cleanSnapshot(), { reader: readerFor(cleanFixtures()), namespace: NS });
    expect(result.divergences.filter((d) => d.kind === "type-mismatch")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("does not report the snapshot-only forksDetail as an extra-key divergence", async () => {
    // The local snapshot's github carries forksDetail; the hosted Firestore
    // producer never emits it (fixture github has no forksDetail). Parity must
    // exclude it rather than flag an extra-key.
    const input: SnapshotInput = {
      samples: [USAGE_SAMPLE],
      reminders: [REMINDER],
      queueMetrics: QUEUE,
      issueSamples: [ISSUE_SAMPLE],
      topicUsage: [TOPIC],
      projectSignals: {
        ...SIGNALS,
        github: {
          ...SIGNALS.github!, // type-safety-ok: SIGNALS.github is a fixture literal, always defined
          forksDetail: [
            {
              owner: "forker",
              repoUrl: "https://github.com/forker/commons.systems",
              createdAt: "2026-01-01T00:00:00Z",
              pushedAt: "2026-06-01T00:00:00Z",
              stars: 2,
            },
          ],
        },
      },
      computedAt: NOW,
      chainHealth: { liveSessions: 3 },
      scope: "full",
      window: { samples: 100, issueSamples: 100 },
    };
    const result = await checkParity(serializeSnapshot(input), { reader: readerFor(cleanFixtures()), namespace: NS });
    expect(result.divergences.filter((d) => d.kind === "extra-key")).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

describe("checkParity — divergences", () => {
  it("reports a key the Firestore doc has but the snapshot lacks (missing-key)", async () => {
    const fx = cleanFixtures();
    (fx.docs[`${NS}/metrics/dispatch-queue`] as Record<string, unknown>).extraField = 99; // type-safety-ok: fixture mutation through opaque type to inject a field the parity check must detect
    const result = await checkParity(cleanSnapshot(), { reader: readerFor(fx), namespace: NS });
    expect(result.ok).toBe(false);
    expect(has(result.divergences, "queueMetrics", "missing-key")).toBe(true);
    expect(result.divergences.some((d) => d.detail.includes("extraField"))).toBe(true);
  });

  it("reports a non-timestamp type mismatch (number vs string)", async () => {
    const snap = cleanSnapshot();
    // Corrupt the SNAPSHOT side so the Firestore doc still parses cleanly.
    (snap.queueMetrics as Record<string, unknown>).openHelpWanted = "14"; // type-safety-ok: fixture mutation through opaque type to corrupt a field for the type-mismatch test
    const result = await checkParity(snap, { reader: readerFor(cleanFixtures()), namespace: NS });
    expect(result.ok).toBe(false);
    expect(has(result.divergences, "queueMetrics", "type-mismatch")).toBe(true);
    expect(result.divergences.some((d) => d.detail.includes("openHelpWanted"))).toBe(true);
  });

  it("reports a presence divergence when the snapshot collection is non-empty but Firestore is empty", async () => {
    const fx = cleanFixtures();
    fx.collections[`${NS}/usage-samples`] = [];
    const result = await checkParity(cleanSnapshot(), { reader: readerFor(fx), namespace: NS });
    expect(result.ok).toBe(false);
    expect(has(result.divergences, "samples", "presence")).toBe(true);
  });

  it("reports a parse-failure when an office-hours parser rejects a Firestore doc", async () => {
    const fx = cleanFixtures();
    // toIssueSample rejects a doc missing the required memberEmails auth field.
    const doc = fx.collections[`${NS}/issue-samples`][0];
    delete doc.memberEmails;
    const result = await checkParity(cleanSnapshot(), { reader: readerFor(fx), namespace: NS });
    expect(result.ok).toBe(false);
    expect(has(result.divergences, "issueSamples", "parse-failure")).toBe(true);
  });

  it("reports a nested-object type mismatch in the projectSignals github sub-object", async () => {
    const snap = cleanSnapshot();
    // Replace (not mutate) the github sub-object: serializeProjectSignals
    // shallow-spreads, so the snapshot's `github` aliases the shared SIGNALS
    // fixture — an in-place mutation would leak into other tests.
    const ps = snap.projectSignals as Record<string, unknown>; // type-safety-ok: fixture mutation through opaque type to replace the github sub-object
    ps.github = { ...(ps.github as Record<string, unknown>), stars: "12" }; // type-safety-ok: same fixture mutation — spread-replace nested field with a type-mismatch value
    const result = await checkParity(snap, { reader: readerFor(cleanFixtures()), namespace: NS });
    expect(result.ok).toBe(false);
    expect(has(result.divergences, "projectSignals", "type-mismatch")).toBe(true);
    expect(result.divergences.some((d) => d.detail.includes("github.stars"))).toBe(true);
  });

  it("reports a presence divergence when the snapshot single doc is null but Firestore has the doc", async () => {
    const snap = cleanSnapshot();
    snap.projectSignals = null;
    const result = await checkParity(snap, { reader: readerFor(cleanFixtures()), namespace: NS });
    expect(result.ok).toBe(false);
    expect(has(result.divergences, "projectSignals", "presence")).toBe(true);
  });
});
