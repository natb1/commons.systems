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
  defineSecret: () => ({ value: () => "test-secret" }),
  defineString: (_name: string, opts?: { default?: string }) => ({
    value: () => opts?.default ?? "test-value",
  }),
}));

import {
  fetchGithubStatsLive,
  fetchGithubTrafficLive,
  fetchGoogleAccessTokenLive,
  fetchGa4Live,
  fetchGscLive,
  fetchPsiLive,
  collectProjectSignalsCore,
  parseGa4Pairs,
  isValidOwnerName,
  isValidGscSite,
  isValidPsiUrl,
} from "../src/project-signals";
import type {
  GithubSignals,
  Ga4AppSignals,
  GscSignals,
  PsiUrlSignals,
} from "../src/project-signals";

// ---- in-memory Firestore stub (mirrors dispatch-queue-metrics.test.ts) ----
interface InMemoryDocRef {
  path: string;
  set: (data: Record<string, unknown>) => Promise<void>;
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
  });

  const collection = (path: string) => ({
    doc: (id: string) => doc(`${path}/${id}`),
    add: (data: Record<string, unknown>) => {
      const id = `auto-${autoIdSeq++}`;
      docs.set(`${path}/${id}`, data);
      return Promise.resolve({ id });
    },
  });

  return { doc, collection, _docs: docs };
}

const okJson = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe("fetchGithubStatsLive", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parses stars/forks/watchers from the repo endpoint", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe("https://api.github.com/repos/natb1/commons.systems");
      return okJson({ stargazers_count: 42, forks_count: 7, watchers_count: 42 });
    });
    const stats = await fetchGithubStatsLive(
      fetchMock as unknown as typeof fetch, // type-safety-ok: vi.fn() mock typed as global fetch for DI test
      "tok",
      "natb1/commons.systems",
    );
    expect(stats).toEqual({
      repo: "natb1/commons.systems",
      stars: 42,
      forks: 7,
      watchers: 42,
    });
  });

  it("throws on a non-OK response", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 404, text: async () => "nope" }));
    await expect(
      fetchGithubStatsLive(fetchMock as unknown as typeof fetch, "tok", "a/b"), // type-safety-ok: vi.fn() mock typed as global fetch for DI test
    ).rejects.toThrow(/404/);
  });
});

describe("fetchGithubTrafficLive", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parses clones/views/referrers from the three traffic endpoints", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/traffic/clones")) return okJson({ count: 100, uniques: 30 });
      if (url.endsWith("/traffic/views")) return okJson({ count: 500, uniques: 90 });
      if (url.endsWith("/traffic/popular/referrers"))
        return okJson([{ referrer: "google.com", count: 12, uniques: 8 }]);
      throw new Error(`unexpected url ${url}`);
    });
    const traffic = await fetchGithubTrafficLive(
      fetchMock as unknown as typeof fetch, // type-safety-ok: vi.fn() mock typed as global fetch for DI test
      "tok",
      "a/b",
    );
    expect(traffic).toEqual({
      clonesCount: 100,
      clonesUniques: 30,
      viewsCount: 500,
      viewsUniques: 90,
      topReferrers: [{ referrer: "google.com", count: 12, uniques: 8 }],
    });
  });

  it("throws (403) so the caller can omit traffic", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 403, text: async () => "forbidden" }));
    await expect(
      fetchGithubTrafficLive(fetchMock as unknown as typeof fetch, "tok", "a/b"), // type-safety-ok: vi.fn() mock typed as global fetch for DI test
    ).rejects.toThrow(/403/);
  });
});

describe("fetchGoogleAccessTokenLive", () => {
  it("exchanges the refresh token and returns the access token", async () => {
    const fetchMock = vi.fn(async (url: string, init: { body: string }) => {
      expect(url).toBe("https://oauth2.googleapis.com/token");
      expect(init.body).toContain("grant_type=refresh_token");
      return okJson({ access_token: "ya29.abc" });
    });
    const token = await fetchGoogleAccessTokenLive(fetchMock as unknown as typeof fetch, { // type-safety-ok: vi.fn() mock typed as global fetch for DI test
      clientId: "cid",
      clientSecret: "secret",
      refreshToken: "refresh",
    });
    expect(token).toBe("ya29.abc");
  });

  it("throws when the response carries no access_token", async () => {
    const fetchMock = vi.fn(async () => okJson({ error: "invalid_grant" }));
    await expect(
      fetchGoogleAccessTokenLive(fetchMock as unknown as typeof fetch, { // type-safety-ok: vi.fn() mock typed as global fetch for DI test
        clientId: "c",
        clientSecret: "s",
        refreshToken: "r",
      }),
    ).rejects.toThrow(/missing access_token/);
  });
});

describe("fetchGa4Live", () => {
  it("parses overview/referral/landing reports and leaves webVitals empty", async () => {
    let call = 0;
    const fetchMock = vi.fn(async () => {
      call++;
      if (call === 1) {
        // overview
        return okJson({
          rows: [{ metricValues: [{ value: "1234" }, { value: "567" }, { value: "0.42" }] }],
        });
      }
      if (call === 2) {
        // referral sources
        return okJson({
          rows: [
            { dimensionValues: [{ value: "google" }], metricValues: [{ value: "300" }] },
            { dimensionValues: [{ value: "(direct)" }], metricValues: [{ value: "200" }] },
          ],
        });
      }
      // landing pages
      return okJson({
        rows: [
          {
            dimensionValues: [{ value: "/" }],
            metricValues: [{ value: "150" }, { value: "400" }],
          },
        ],
      });
    });

    const ga4 = await fetchGa4Live(fetchMock as unknown as typeof fetch, "tok", "landing", "12345"); // type-safety-ok: vi.fn() mock typed as global fetch for DI test
    expect(ga4.app).toBe("landing");
    expect(ga4.pageViews).toBe(1234);
    expect(ga4.sessions).toBe(567);
    expect(ga4.bounceRate).toBeCloseTo(0.42);
    expect(ga4.topReferralSources).toEqual([
      { source: "google", sessions: 300 },
      { source: "(direct)", sessions: 200 },
    ]);
    expect(ga4.topLandingPages).toEqual([{ page: "/", sessions: 150, views: 400 }]);
    expect(ga4.webVitals).toEqual([]);
  });
});

describe("fetchGscLive", () => {
  it("parses queries/pages/devices reports", async () => {
    let call = 0;
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("sc-domain%3Acommons.systems");
      call++;
      if (call === 1) {
        return okJson({
          rows: [{ keys: ["commons systems"], clicks: 10, impressions: 100, ctr: 0.1, position: 3.2 }],
        });
      }
      if (call === 2) {
        return okJson({
          rows: [
            { keys: ["https://commons.systems/"], clicks: 5, impressions: 80, ctr: 0.06, position: 4.1 },
          ],
        });
      }
      return okJson({
        rows: [{ keys: ["MOBILE"], clicks: 8, impressions: 90, ctr: 0.09, position: 3.5 }],
      });
    });

    const gsc = await fetchGscLive(
      fetchMock as unknown as typeof fetch, // type-safety-ok: vi.fn() mock typed as global fetch for DI test
      "tok",
      "sc-domain:commons.systems",
      new Date("2026-06-23T00:00:00Z"),
    );
    expect(gsc.site).toBe("sc-domain:commons.systems");
    expect(gsc.topQueries).toEqual([
      { query: "commons systems", clicks: 10, impressions: 100, ctr: 0.1, position: 3.2 },
    ]);
    expect(gsc.topPages).toEqual([
      { page: "https://commons.systems/", clicks: 5, impressions: 80, ctr: 0.06, position: 4.1 },
    ]);
    expect(gsc.devices).toEqual([
      { device: "MOBILE", clicks: 8, impressions: 90, ctr: 0.09, position: 3.5 },
    ]);
  });
});

describe("fetchPsiLive", () => {
  it("parses category scores to 0-100 ints and lab metric displayValue strings", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("strategy=mobile");
      expect(url).toContain("category=best-practices");
      return okJson({
        lighthouseResult: {
          categories: {
            performance: { score: 0.29 },
            seo: { score: 1 },
            accessibility: { score: 0.95 },
            "best-practices": { score: 0.83 },
          },
          audits: {
            "largest-contentful-paint": { displayValue: "2.1 s" },
            "cumulative-layout-shift": { displayValue: "0.04" },
            "total-blocking-time": { displayValue: "120 ms" },
            "first-contentful-paint": { displayValue: "1.2 s" },
          },
        },
      });
    });

    const psi = await fetchPsiLive(
      fetchMock as unknown as typeof fetch, // type-safety-ok: vi.fn() mock typed as global fetch for DI test
      "https://commons.systems",
      "mobile",
      undefined,
    );
    // 0.29 * 100 rounds to 29 (round, not floor — guards the float off-by-one).
    expect(psi.performance).toBe(29);
    expect(psi.seo).toBe(100);
    expect(psi.accessibility).toBe(95);
    expect(psi.bestPractices).toBe(83);
    expect(psi.lcp).toBe("2.1 s");
    expect(psi.cls).toBe("0.04");
    expect(psi.tbt).toBe("120 ms");
    expect(psi.fcp).toBe("1.2 s");
  });

  it("maps an absent category score to null (the script's n/a)", async () => {
    const fetchMock = vi.fn(async () =>
      okJson({
        lighthouseResult: {
          categories: { performance: { score: null }, seo: {} }, // null and absent score
          audits: {},
        },
      }),
    );
    const psi = await fetchPsiLive(
      fetchMock as unknown as typeof fetch, // type-safety-ok: vi.fn() mock typed as global fetch for DI test
      "https://commons.systems",
      "mobile",
      undefined,
    );
    expect(psi.performance).toBeNull();
    expect(psi.seo).toBeNull();
    expect(psi.accessibility).toBeNull();
    // Absent audit displayValue falls back to "n/a".
    expect(psi.lcp).toBe("n/a");
  });

  it("appends the key query param only when provided", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("key=secret-key");
      return okJson({ lighthouseResult: { categories: {}, audits: {} } });
    });
    await fetchPsiLive(
      fetchMock as unknown as typeof fetch, // type-safety-ok: vi.fn() mock typed as global fetch for DI test
      "https://commons.systems",
      "desktop",
      "secret-key",
    );
  });
});

describe("validation helpers", () => {
  it("isValidOwnerName", () => {
    expect(isValidOwnerName("natb1/commons.systems")).toBe(true);
    expect(isValidOwnerName("noslash")).toBe(false);
    expect(isValidOwnerName("a/b/c")).toBe(false);
    expect(isValidOwnerName("/b")).toBe(false);
    expect(isValidOwnerName("a/")).toBe(false);
  });

  it("isValidGscSite", () => {
    expect(isValidGscSite("sc-domain:commons.systems")).toBe(true);
    expect(isValidGscSite("https://commons.systems/")).toBe(true);
    // hostname hyphen must be accepted as a literal (the `-` is a literal class member, not a range)
    expect(isValidGscSite("https://my-site.commons.systems/")).toBe(true);
    expect(isValidGscSite("ftp://x")).toBe(false);
    expect(isValidGscSite("sc-domain:has space")).toBe(false);
  });

  it("isValidPsiUrl", () => {
    expect(isValidPsiUrl("https://commons.systems")).toBe(true);
    // hostname hyphen must be accepted as a literal (the `-` is a literal class member, not a range)
    expect(isValidPsiUrl("https://my-site.commons.systems")).toBe(true);
    expect(isValidPsiUrl("http://commons.systems")).toBe(false);
    expect(isValidPsiUrl("https://x?q=1")).toBe(false);
  });

  it("parseGa4Pairs keeps valid pairs and drops malformed ones", () => {
    expect(parseGa4Pairs("landing:12345,budget:67890")).toEqual([
      { app: "landing", propertyId: "12345" },
      { app: "budget", propertyId: "67890" },
    ]);
    // non-numeric property id, missing colon, bad app charset all dropped
    expect(parseGa4Pairs("landing:abc,nopair,bad app:1, :5, app:")).toEqual([]);
  });
});

describe("collectProjectSignalsCore", () => {
  beforeEach(() => vi.restoreAllMocks());

  const baseArgs = (store: ReturnType<typeof createInMemoryFirestore>) => ({
    firestore: store as unknown as Firestore, // type-safety-ok: test-only cast of in-memory stub
    namespace: "office-hours/prod",
    groupId: "group-1",
    memberEmails: ["owner@example.com"],
    now: new Date("2026-06-23T08:30:00Z"),
  });

  const github: GithubSignals = {
    repo: "natb1/commons.systems",
    stars: 42,
    forks: 7,
    watchers: 42,
    traffic: {
      clonesCount: 100,
      clonesUniques: 30,
      viewsCount: 500,
      viewsUniques: 90,
      topReferrers: [{ referrer: "google.com", count: 12, uniques: 8 }],
    },
  };
  const ga4: Ga4AppSignals[] = [
    {
      app: "landing",
      pageViews: 1000,
      sessions: 400,
      bounceRate: 0.4,
      topReferralSources: [],
      topLandingPages: [],
      webVitals: [],
    },
    {
      app: "budget",
      pageViews: 200,
      sessions: 100,
      bounceRate: 0.3,
      topReferralSources: [],
      topLandingPages: [],
      webVitals: [],
    },
  ];
  const gsc: GscSignals = {
    site: "sc-domain:commons.systems",
    topQueries: [
      { query: "a", clicks: 10, impressions: 100, ctr: 0.1, position: 2 },
      { query: "b", clicks: 5, impressions: 50, ctr: 0.1, position: 3 },
    ],
    topPages: [
      { page: "/", clicks: 8, impressions: 80, ctr: 0.1, position: 2 },
      { page: "/budget", clicks: 4, impressions: 40, ctr: 0.1, position: 3 },
    ],
    devices: [],
  };
  const psi: PsiUrlSignals[] = [
    {
      url: "https://commons.systems",
      strategy: "mobile",
      performance: 88,
      seo: 100,
      accessibility: 95,
      bestPractices: 92,
      lcp: "2.1 s",
      cls: "0.04",
      tbt: "120 ms",
      fcp: "1.2 s",
    },
    {
      url: "https://budget.commons.systems",
      strategy: "mobile",
      performance: 70,
      seo: 90,
      accessibility: 88,
      bestPractices: 80,
      lcp: "3.0 s",
      cls: "0.10",
      tbt: "300 ms",
      fcp: "1.8 s",
    },
  ];

  it("writes the shared doc with only the sources that succeeded", async () => {
    const store = createInMemoryFirestore();
    await collectProjectSignalsCore({
      ...baseArgs(store),
      fetchGithub: async () => github,
      fetchGa4: async () => ga4,
      fetchGsc: null, // dormant
      fetchPsi: async () => psi,
    });

    const doc = store._docs.get("office-hours/prod/metrics/project-signals") as Record< // type-safety-ok: in-memory test fixture returns known shape
      string,
      unknown
    >;
    expect(doc).toBeDefined();
    expect(doc.computedAt).toEqual(new Date("2026-06-23T08:30:00Z"));
    expect(doc.groupId).toBe("group-1");
    expect(doc.memberEmails).toEqual(["owner@example.com"]);
    expect(doc.github).toEqual(github);
    expect(doc.ga4).toEqual(ga4);
    expect(doc.psi).toEqual(psi);
    // gsc was dormant -> key absent (not undefined).
    expect("gsc" in doc).toBe(false);
  });

  it("omits a thrown source's key entirely (Firestore-safe), and still writes the doc", async () => {
    const store = createInMemoryFirestore();
    await collectProjectSignalsCore({
      ...baseArgs(store),
      fetchGithub: async () => {
        throw new Error("github boom");
      },
      fetchGa4: async () => ga4,
      fetchGsc: null,
      fetchPsi: null,
    });

    const doc = store._docs.get("office-hours/prod/metrics/project-signals") as Record< // type-safety-ok: in-memory test fixture returns known shape
      string,
      unknown
    >;
    expect(doc).toBeDefined();
    // key absent, NOT an explicit undefined value.
    expect("github" in doc).toBe(false);
    expect(doc.ga4).toEqual(ga4);
  });

  it("appends a signal-samples doc carrying exactly the headline scalars", async () => {
    const store = createInMemoryFirestore();
    await collectProjectSignalsCore({
      ...baseArgs(store),
      fetchGithub: async () => github,
      fetchGa4: async () => ga4,
      fetchGsc: async () => gsc,
      fetchPsi: async () => psi,
    });

    const sample = store._docs.get("office-hours/prod/signal-samples/auto-0") as Record< // type-safety-ok: in-memory test fixture returns known shape
      string,
      unknown
    >;
    expect(sample).toBeDefined();
    expect(sample.sampledAt).toEqual(new Date("2026-06-23T08:30:00Z"));
    expect(sample.groupId).toBe("group-1");
    expect(sample.memberEmails).toEqual(["owner@example.com"]);
    expect(sample.stars).toBe(42);
    expect(sample.forks).toBe(7);
    // summed across GA4 apps
    expect(sample.pageViews).toBe(1200);
    expect(sample.sessions).toBe(500);
    // summed from topPages
    expect(sample.gscClicks).toBe(12);
    expect(sample.gscImpressions).toBe(120);
    // first-URL mobile performance
    expect(sample.psiPerformance).toBe(88);

    // Only the headline scalars + identity fields — no full sub-objects.
    expect("github" in sample).toBe(false);
    expect("ga4" in sample).toBe(false);
    expect("psi" in sample).toBe(false);
    expect("watchers" in sample).toBe(false);
  });

  it("omits sample scalars for dormant/failed sources", async () => {
    const store = createInMemoryFirestore();
    await collectProjectSignalsCore({
      ...baseArgs(store),
      fetchGithub: null,
      fetchGa4: null,
      fetchGsc: null,
      fetchPsi: async () => psi,
    });

    const sample = store._docs.get("office-hours/prod/signal-samples/auto-0") as Record< // type-safety-ok: in-memory test fixture returns known shape
      string,
      unknown
    >;
    expect("stars" in sample).toBe(false);
    expect("forks" in sample).toBe(false);
    expect("pageViews" in sample).toBe(false);
    expect("gscClicks" in sample).toBe(false);
    expect(sample.psiPerformance).toBe(88);
  });

  it("handles multi-app GA4 and multi-URL PSI as arrays", async () => {
    const store = createInMemoryFirestore();
    await collectProjectSignalsCore({
      ...baseArgs(store),
      fetchGithub: null,
      fetchGa4: async () => ga4,
      fetchGsc: null,
      fetchPsi: async () => psi,
    });

    const doc = store._docs.get("office-hours/prod/metrics/project-signals") as Record< // type-safety-ok: in-memory test fixture returns known shape
      string,
      unknown
    >;
    expect((doc.ga4 as Ga4AppSignals[]).map((a) => a.app)).toEqual(["landing", "budget"]); // type-safety-ok: fixture doc written with these exact types above
    expect((doc.psi as PsiUrlSignals[]).map((p) => p.url)).toEqual([ // type-safety-ok: fixture doc written with these exact types above
      "https://commons.systems",
      "https://budget.commons.systems",
    ]);
  });

  it("omits ga4 and psi keys when fetch resolves to an empty array", async () => {
    const store = createInMemoryFirestore();
    await collectProjectSignalsCore({
      ...baseArgs(store),
      fetchGithub: null,
      fetchGa4: async () => [],
      fetchGsc: null,
      fetchPsi: async () => [],
    });

    const doc = store._docs.get("office-hours/prod/metrics/project-signals") as Record< // type-safety-ok: in-memory test fixture returns known shape
      string,
      unknown
    >;
    expect(doc).toBeDefined();
    // Empty-array results must be omitted (not written) so the client parser
    // and server snapshot stay consistent — an empty [] on the server would be
    // promoted to undefined by parseGa4Signals/parsePsiSignals on the client.
    expect("ga4" in doc).toBe(false);
    expect("psi" in doc).toBe(false);
  });
});
