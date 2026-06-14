import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Firestore } from "firebase-admin/firestore";

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => {
  const TimestampImpl = {
    fromDate: (d: Date) => ({ toDate: () => d, _seconds: d.getTime() / 1000 }),
  };
  return {
    getFirestore: vi.fn(),
    Timestamp: TimestampImpl,
    FieldValue: { serverTimestamp: () => "__server_timestamp__" },
  };
});

vi.mock("firebase-functions/v2/scheduler", () => ({
  onSchedule: vi.fn((_opts, _fn) => ({})),
}));

vi.mock("firebase-functions/params", () => ({
  defineSecret: () => ({ value: () => "test-token" }),
  defineString: (_name: string, opts?: { default?: string }) => ({
    value: () => opts?.default ?? "test-value",
  }),
}));

import {
  buildQueueSearchQueries,
  computeQueueMetrics,
  searchIssueCountLive,
  sampleDispatchQueueCore,
} from "../src/dispatch-queue-metrics";

interface InMemoryDocRef {
  path: string;
  set: (data: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
}

function createInMemoryFirestore() {
  const docs = new Map<string, Record<string, unknown>>();

  const doc = (path: string): InMemoryDocRef => ({
    path,
    set: (data: Record<string, unknown>) => {
      docs.set(path, data);
      return Promise.resolve();
    },
    delete: () => {
      docs.delete(path);
      return Promise.resolve();
    },
  });

  const collection = (path: string) => ({
    get: async () => ({
      docs: [...docs.entries()]
        .filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"))
        .map(([key, data]) => ({
          id: key.slice(path.length + 1),
          ref: doc(key),
          data: () => data,
        })),
    }),
    doc: (id: string) => doc(`${path}/${id}`),
  });

  return { doc, collection, _docs: docs };
}

describe("buildQueueSearchQueries", () => {
  it("builds the three queries with a 14-day cutoff date for a fixed now", () => {
    const now = new Date("2026-06-07T08:30:00Z");
    const q = buildQueueSearchQueries("natb1/commons.systems", now);

    // 2026-06-07 minus 14 days = 2026-05-24
    expect(q.open).toBe('repo:natb1/commons.systems is:issue is:open label:"help wanted"');
    expect(q.closed).toBe(
      'repo:natb1/commons.systems is:issue is:closed reason:completed label:"help wanted" closed:>=2026-05-24',
    );
    expect(q.created).toBe(
      'repo:natb1/commons.systems is:issue label:"help wanted" created:>=2026-05-24',
    );
  });
});

describe("computeQueueMetrics", () => {
  it("averages closed/created counts over the window", () => {
    const m = computeQueueMetrics({
      openHelpWanted: 28,
      closedCount: 28,
      createdCount: 14,
      windowDays: 14,
    });
    expect(m.closedPerDay).toBe(2);
    expect(m.createdPerDay).toBe(1);
    expect(m.netDrainPerDay).toBe(1);
  });

  it("computes a finite runway when net drain is positive", () => {
    const m = computeQueueMetrics({
      openHelpWanted: 28,
      closedCount: 28,
      createdCount: 14,
      windowDays: 14,
    });
    // 28 open / 1 per day = 28 days
    expect(m.runwayDays).toBe(28);
    expect(Number.isFinite(m.runwayDays as number)).toBe(true);
  });

  it("returns null runway when net drain is zero (queue flat)", () => {
    const m = computeQueueMetrics({
      openHelpWanted: 10,
      closedCount: 14,
      createdCount: 14,
      windowDays: 14,
    });
    expect(m.netDrainPerDay).toBe(0);
    expect(m.runwayDays).toBeNull();
  });

  it("returns null runway when net drain is negative (queue growing), never negative or infinite", () => {
    const m = computeQueueMetrics({
      openHelpWanted: 10,
      closedCount: 7,
      createdCount: 28,
      windowDays: 14,
    });
    expect(m.netDrainPerDay).toBeLessThan(0);
    expect(m.runwayDays).toBeNull();
  });

  it("never yields a negative or infinite runway across cases", () => {
    const cases = [
      { openHelpWanted: 0, closedCount: 0, createdCount: 0, windowDays: 14 },
      { openHelpWanted: 50, closedCount: 0, createdCount: 0, windowDays: 14 },
      { openHelpWanted: 50, closedCount: 100, createdCount: 0, windowDays: 14 },
    ];
    for (const c of cases) {
      const { runwayDays } = computeQueueMetrics(c);
      if (runwayDays !== null) {
        expect(runwayDays).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(runwayDays)).toBe(true);
      }
    }
  });
});

describe("searchIssueCountLive", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the search/issueCount GraphQL query and returns the count", async () => {
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      const parsed = JSON.parse(init.body) as { query: string; variables: { query: string } };
      expect(parsed.query).toContain("search(query: $query, type: ISSUE)");
      expect(parsed.query).toContain("issueCount");
      expect(parsed.variables.query).toBe("repo:x/y is:issue is:open");
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { search: { issueCount: 42 } } }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const count = await searchIssueCountLive("tok", "repo:x/y is:issue is:open");
    expect(count).toBe(42);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/graphql",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws on a non-OK HTTP response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
        text: async () => "service unavailable",
      })),
    );
    await expect(searchIssueCountLive("tok", "q")).rejects.toThrow(/503/);
  });

  it("throws when GraphQL returns errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ errors: [{ message: "bad query" }] }),
      })),
    );
    await expect(searchIssueCountLive("tok", "q")).rejects.toThrow(/bad query/);
  });
});

describe("sampleDispatchQueueCore", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("writes the snapshot field map to office-hours/prod/metrics/dispatch-queue", async () => {
    const store = createInMemoryFirestore();
    const now = new Date("2026-06-07T08:30:00Z");

    // open=28, closed=28, created=14 -> closedPerDay=2, createdPerDay=1, net=1, runway=28
    const counts: Record<string, number> = {};
    const q = buildQueueSearchQueries("natb1/commons.systems", now);
    counts[q.open] = 28;
    counts[q.closed] = 28;
    counts[q.created] = 14;

    await sampleDispatchQueueCore({
      searchIssueCount: async (query: string) => counts[query],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      queueRepo: "natb1/commons.systems",
      groupId: "group-1",
      memberEmails: ["owner@example.com"],
      now,
    });

    const written = store._docs.get("office-hours/prod/metrics/dispatch-queue") as Record<
      string,
      unknown
    >;
    expect(written).toBeDefined();
    expect(written.openHelpWanted).toBe(28);
    expect(written.closedPerDay).toBe(2);
    expect(written.createdPerDay).toBe(1);
    expect(written.netDrainPerDay).toBe(1);
    expect(written.runwayDays).toBe(28);
    expect(written.windowDays).toBe(14);
    expect(written.computedAt).toBe(now);
    expect(written.groupId).toBe("group-1");
    expect(written.memberEmails).toEqual(["owner@example.com"]);
  });

  it("writes runwayDays null when the queue is flat or growing", async () => {
    const store = createInMemoryFirestore();
    const now = new Date("2026-06-07T08:30:00Z");

    const counts: Record<string, number> = {};
    const q = buildQueueSearchQueries("natb1/commons.systems", now);
    counts[q.open] = 10;
    counts[q.closed] = 7;
    counts[q.created] = 28; // created outpaces closed -> queue growing

    await sampleDispatchQueueCore({
      searchIssueCount: async (query: string) => counts[query],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      queueRepo: "natb1/commons.systems",
      groupId: "group-1",
      memberEmails: ["owner@example.com"],
      now,
    });

    const written = store._docs.get("office-hours/prod/metrics/dispatch-queue") as Record<
      string,
      unknown
    >;
    expect(written.runwayDays).toBeNull();
    expect(written.netDrainPerDay).toBeLessThan(0);
  });
});
