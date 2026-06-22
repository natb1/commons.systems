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
  buildOfficeHoursQuery,
  computeQueueMetrics,
  searchIssueCountLive,
  searchIssueDetailsLive,
  sampleDispatchQueueCore,
} from "../src/dispatch-queue-metrics";
import type { ParkedIssue } from "../src/dispatch-queue-metrics";

interface InMemoryDocRef {
  path: string;
  set: (data: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
}

function createInMemoryFirestore() {
  const docs = new Map<string, Record<string, unknown>>();
  let autoIdSeq = 0;

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
    add: (data: Record<string, unknown>) => {
      const id = `auto-${autoIdSeq++}`;
      docs.set(`${path}/${id}`, data);
      return Promise.resolve({ id });
    },
  });

  return { doc, collection, _docs: docs };
}

describe("buildQueueSearchQueries", () => {
  it("builds the seven queries with a 14-day cutoff date for a fixed now", () => {
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
    expect(q.security).toBe('repo:natb1/commons.systems is:issue is:open label:"security"');
    expect(q.bug).toBe(
      'repo:natb1/commons.systems is:issue is:open label:"bug" -label:"security"',
    );
    expect(q.enhancement).toBe(
      'repo:natb1/commons.systems is:issue is:open label:"enhancement" -label:"bug" -label:"security"',
    );
    expect(q.other).toBe(
      'repo:natb1/commons.systems is:issue is:open -label:"enhancement" -label:"bug" -label:"security"',
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

describe("buildOfficeHoursQuery", () => {
  it("builds the parked dispatch:office-hours query for a repo", () => {
    expect(buildOfficeHoursQuery("natb1/commons.systems")).toBe(
      'repo:natb1/commons.systems is:issue is:open label:"dispatch:office-hours"',
    );
  });
});

describe("searchIssueDetailsLive", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps issue nodes to ParkedIssue, with createdAt a real Date and best-effort phase", async () => {
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      const parsed = JSON.parse(init.body) as { query: string; variables: { query: string } };
      expect(parsed.query).toContain("search(query: $query, type: ISSUE, first: 100)");
      expect(parsed.query).toContain("nameWithOwner");
      expect(parsed.variables.query).toBe(
        'repo:natb1/commons.systems is:issue is:open label:"dispatch:office-hours"',
      );
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            search: {
              nodes: [
                {
                  number: 100,
                  title: "Parked plan item",
                  url: "https://github.com/natb1/commons.systems/issues/100",
                  createdAt: "2026-06-01T12:00:00Z",
                  labels: {
                    nodes: [
                      { name: "dispatch:office-hours" },
                      { name: "dispatch:plan" },
                      { name: "help wanted" },
                    ],
                  },
                  repository: { nameWithOwner: "natb1/commons.systems" },
                },
                {
                  number: 101,
                  title: "Parked with no phase",
                  url: "https://github.com/natb1/commons.systems/issues/101",
                  createdAt: "2026-06-02T09:30:00Z",
                  labels: { nodes: [{ name: "dispatch:office-hours" }] },
                  repository: { nameWithOwner: "natb1/commons.systems" },
                },
              ],
            },
          },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const parked = await searchIssueDetailsLive(
      "tok",
      buildOfficeHoursQuery("natb1/commons.systems"),
    );

    expect(parked).toHaveLength(2);
    const [a, b] = parked;
    expect(a.number).toBe(100);
    expect(a.title).toBe("Parked plan item");
    expect(a.url).toBe("https://github.com/natb1/commons.systems/issues/100");
    expect(a.repo).toBe("natb1/commons.systems");
    // createdAt MUST be a real Date, not the raw ISO string.
    expect(a.createdAt).toBeInstanceOf(Date);
    expect(a.createdAt.toISOString()).toBe("2026-06-01T12:00:00.000Z");
    // phase = first dispatch:* label other than dispatch:office-hours.
    expect(a.phase).toBe("dispatch:plan");
    // No dispatch:* phase label -> phase omitted entirely (Firestore-safe).
    expect(b.phase).toBeUndefined();
    expect("phase" in b).toBe(false);
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
    await expect(searchIssueDetailsLive("tok", "q")).rejects.toThrow(/503/);
  });

  it("declares $query as a non-null String! (GitHub search requires String!)", async () => {
    let capturedBody = "";
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      capturedBody = init.body;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            search: {
              nodes: [],
            },
          },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    await searchIssueDetailsLive("tok", "q");

    const parsed = JSON.parse(capturedBody) as { query: string };
    expect(parsed.query).toContain("query($query: String!)");
    // Must NOT declare $query as nullable String (without !) — GitHub rejects that
    expect(parsed.query).not.toContain("query($query: String)");
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
    counts[q.security] = 0;
    counts[q.bug] = 0;
    counts[q.enhancement] = 0;
    counts[q.other] = 0;

    await sampleDispatchQueueCore({
      searchIssueCount: async (query: string) => counts[query],
      searchIssueDetails: async () => [],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      queueRepos: ["natb1/commons.systems"],
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

  it("writes injected parked details into the snapshot under `parked`", async () => {
    const store = createInMemoryFirestore();
    const now = new Date("2026-06-07T08:30:00Z");

    const counts: Record<string, number> = {};
    const q = buildQueueSearchQueries("natb1/commons.systems", now);
    counts[q.open] = 28;
    counts[q.closed] = 28;
    counts[q.created] = 14;
    counts[q.security] = 0;
    counts[q.bug] = 0;
    counts[q.enhancement] = 0;
    counts[q.other] = 0;

    const fakeParked: ParkedIssue[] = [
      {
        number: 200,
        title: "Parked A",
        url: "https://github.com/natb1/commons.systems/issues/200",
        createdAt: new Date("2026-06-01T00:00:00Z"),
        repo: "natb1/commons.systems",
        phase: "dispatch:plan",
      },
      {
        number: 201,
        title: "Parked B",
        url: "https://github.com/natb1/commons.systems/issues/201",
        createdAt: new Date("2026-06-02T00:00:00Z"),
        repo: "natb1/commons.systems",
      },
    ];

    await sampleDispatchQueueCore({
      searchIssueCount: async (query: string) => counts[query],
      searchIssueDetails: async (query: string) => {
        expect(query).toBe(buildOfficeHoursQuery("natb1/commons.systems"));
        return fakeParked;
      },
      firestore: store as unknown as Firestore, // type-safety-ok: test-only cast of in-memory stub to Firestore interface
      namespace: "office-hours/prod",
      queueRepos: ["natb1/commons.systems"],
      groupId: "group-1",
      memberEmails: ["owner@example.com"],
      now,
    });

    const written = store._docs.get("office-hours/prod/metrics/dispatch-queue") as Record< // type-safety-ok: test-only cast to access written doc fields
      string,
      unknown
    >;
    expect(written.parked).toEqual(fakeParked);
  });

  it("concatenates parked details across repos into `parked`", async () => {
    const store = createInMemoryFirestore();
    const now = new Date("2026-06-07T08:30:00Z");

    const repoA = "natb1/commons.systems";
    const repoB = "natb1/other-repo";
    const qA = buildQueueSearchQueries(repoA, now);
    const qB = buildQueueSearchQueries(repoB, now);
    const counts: Record<string, number> = {};
    for (const qq of [qA, qB]) {
      counts[qq.open] = 0;
      counts[qq.closed] = 0;
      counts[qq.created] = 0;
      counts[qq.security] = 0;
      counts[qq.bug] = 0;
      counts[qq.enhancement] = 0;
      counts[qq.other] = 0;
    }

    const parkedByRepo: Record<string, ParkedIssue[]> = {
      [buildOfficeHoursQuery(repoA)]: [
        {
          number: 1,
          title: "A1",
          url: "https://github.com/natb1/commons.systems/issues/1",
          createdAt: new Date("2026-06-01T00:00:00Z"),
          repo: repoA,
        },
      ],
      [buildOfficeHoursQuery(repoB)]: [
        {
          number: 2,
          title: "B1",
          url: "https://github.com/natb1/other-repo/issues/2",
          createdAt: new Date("2026-06-02T00:00:00Z"),
          repo: repoB,
        },
      ],
    };

    await sampleDispatchQueueCore({
      searchIssueCount: async (query: string) => counts[query],
      searchIssueDetails: async (query: string) => parkedByRepo[query] ?? [],
      firestore: store as unknown as Firestore, // type-safety-ok: test-only cast of in-memory stub to Firestore interface
      namespace: "office-hours/prod",
      queueRepos: [repoA, repoB],
      groupId: "group-1",
      memberEmails: ["owner@example.com"],
      now,
    });

    const written = store._docs.get("office-hours/prod/metrics/dispatch-queue") as Record< // type-safety-ok: test-only cast to access written doc fields
      string,
      unknown
    >;
    const parked = written.parked as ParkedIssue[]; // type-safety-ok: test-only cast to inspect parked array written to store
    expect(parked).toHaveLength(2);
    expect(parked.map((p) => p.number)).toEqual([1, 2]);
  });

  it("writes runwayDays null when the queue is flat or growing", async () => {
    const store = createInMemoryFirestore();
    const now = new Date("2026-06-07T08:30:00Z");

    const counts: Record<string, number> = {};
    const q = buildQueueSearchQueries("natb1/commons.systems", now);
    counts[q.open] = 10;
    counts[q.closed] = 7;
    counts[q.created] = 28; // created outpaces closed -> queue growing
    counts[q.security] = 0;
    counts[q.bug] = 0;
    counts[q.enhancement] = 0;
    counts[q.other] = 0;

    await sampleDispatchQueueCore({
      searchIssueCount: async (query: string) => counts[query],
      searchIssueDetails: async () => [],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      queueRepos: ["natb1/commons.systems"],
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

  it("precedence partition (single repo): appends the four bucket counts to issue-samples", async () => {
    const store = createInMemoryFirestore();
    const now = new Date("2026-06-07T08:30:00Z");

    const counts: Record<string, number> = {};
    const q = buildQueueSearchQueries("natb1/commons.systems", now);
    counts[q.open] = 12;
    counts[q.closed] = 14;
    counts[q.created] = 7;
    counts[q.security] = 3;
    counts[q.bug] = 8;
    counts[q.enhancement] = 11;
    counts[q.other] = 8;

    await sampleDispatchQueueCore({
      searchIssueCount: async (query: string) => counts[query],
      searchIssueDetails: async () => [],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      queueRepos: ["natb1/commons.systems"],
      groupId: "group-1",
      memberEmails: ["owner@example.com"],
      now,
    });

    const sample = store._docs.get("office-hours/prod/issue-samples/auto-0") as Record<
      string,
      unknown
    >;
    expect(sample).toBeDefined();
    expect(sample.openSecurity).toBe(3);
    expect(sample.openBug).toBe(8);
    expect(sample.openEnhancement).toBe(11);
    expect(sample.openOther).toBe(8);
    // The four precedence buckets partition the total open set (mutually
    // exclusive + exhaustive), so they sum to it.
    expect(
      (sample.openSecurity as number) +
        (sample.openBug as number) +
        (sample.openEnhancement as number) +
        (sample.openOther as number),
    ).toBe(counts[q.security] + counts[q.bug] + counts[q.enhancement] + counts[q.other]);
    // openHelpWanted is orthogonal — it does not appear in the backlog-history sample.
    expect("openHelpWanted" in sample).toBe(false);
  });

  it("multi-repo aggregation: sums the four buckets and runway inputs across repos", async () => {
    const store = createInMemoryFirestore();
    const now = new Date("2026-06-07T08:30:00Z");

    const repoA = "natb1/commons.systems";
    const repoB = "natb1/other-repo";
    const qA = buildQueueSearchQueries(repoA, now);
    const qB = buildQueueSearchQueries(repoB, now);

    const counts: Record<string, number> = {};
    counts[qA.open] = 5;
    counts[qA.closed] = 14;
    counts[qA.created] = 7;
    counts[qA.security] = 1;
    counts[qA.bug] = 2;
    counts[qA.enhancement] = 3;
    counts[qA.other] = 4;
    counts[qB.open] = 3;
    counts[qB.closed] = 14;
    counts[qB.created] = 7;
    counts[qB.security] = 10;
    counts[qB.bug] = 20;
    counts[qB.enhancement] = 30;
    counts[qB.other] = 40;

    await sampleDispatchQueueCore({
      searchIssueCount: async (query: string) => counts[query],
      searchIssueDetails: async () => [],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      queueRepos: [repoA, repoB],
      groupId: "group-1",
      memberEmails: ["owner@example.com"],
      now,
    });

    const snapshot = store._docs.get("office-hours/prod/metrics/dispatch-queue") as Record<
      string,
      unknown
    >;
    expect(snapshot.openHelpWanted).toBe(8); // 5 + 3
    // closedPerDay = (14+14)/14 = 2; createdPerDay = (7+7)/14 = 1; net = 1; runway = 8/1 = 8
    expect(snapshot.runwayDays).toBe(8);

    const sample = store._docs.get("office-hours/prod/issue-samples/auto-0") as Record<
      string,
      unknown
    >;
    expect(sample).toBeDefined();
    expect(sample.openSecurity).toBe(11); // 1 + 10
    expect(sample.openBug).toBe(22); // 2 + 20
    expect(sample.openEnhancement).toBe(33); // 3 + 30
    expect(sample.openOther).toBe(44); // 4 + 40
  });

  it("issue-samples append shape: exactly one doc with all seven fields and correct values", async () => {
    const store = createInMemoryFirestore();
    const now = new Date("2026-06-07T08:30:00Z");

    const counts: Record<string, number> = {};
    const q = buildQueueSearchQueries("natb1/commons.systems", now);
    counts[q.open] = 15;
    counts[q.closed] = 14;
    counts[q.created] = 7;
    counts[q.security] = 2;
    counts[q.bug] = 3;
    counts[q.enhancement] = 4;
    counts[q.other] = 6;

    await sampleDispatchQueueCore({
      searchIssueCount: async (query: string) => counts[query],
      searchIssueDetails: async () => [],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      queueRepos: ["natb1/commons.systems"],
      groupId: "my-group",
      memberEmails: ["a@example.com", "b@example.com"],
      now,
    });

    const prefix = "office-hours/prod/issue-samples";
    const sampleKeys = [...store._docs.keys()].filter(
      (k) => k.startsWith(`${prefix}/`) && !k.slice(prefix.length + 1).includes("/"),
    );
    expect(sampleKeys).toHaveLength(1);

    const sample = store._docs.get(sampleKeys[0]) as Record<string, unknown>;
    expect(sample).toBeDefined();
    expect("sampledAt" in sample).toBe(true);
    expect("openSecurity" in sample).toBe(true);
    expect("openBug" in sample).toBe(true);
    expect("openEnhancement" in sample).toBe(true);
    expect("openOther" in sample).toBe(true);
    expect("groupId" in sample).toBe(true);
    expect("memberEmails" in sample).toBe(true);
    // The two-bucket help-wanted split is gone from the backlog-history sample.
    expect("openHelpWanted" in sample).toBe(false);

    expect(sample.sampledAt).toBe(now);
    expect(sample.openSecurity).toBe(2);
    expect(sample.openBug).toBe(3);
    expect(sample.openEnhancement).toBe(4);
    expect(sample.openOther).toBe(6);
    expect(sample.groupId).toBe("my-group");
    expect(sample.memberEmails).toEqual(["a@example.com", "b@example.com"]);
  });
});
