// Core logic for project-signals — dependency-injected, firebase-functions-free.
//
// OWNED BY THE LOCAL SNAPSHOT PRODUCER. Moved here from
// functions/src/project-signals-core.ts (tactic-attention-surface-analytics-collector):
// the producer collects GA4/GSC/PSI/GitHub signals directly and folds them into
// the encrypted snapshot, replacing the Firestore function. The Firebase
// function keeps its own untouched copy until
// tactic-attention-surface-firestore-retire deletes it.
import type { Firestore } from "firebase-admin/firestore";
import { truncateForLog } from "../../functions/src/log-utils.js";

const GA4_WINDOW = { startDate: "30daysAgo", endDate: "today" };
const GSC_WINDOW_DAYS = 28;
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Wire-shape interfaces — the source of truth for the written documents.
// ---------------------------------------------------------------------------

export interface ProjectSignalsSnapshot {
  computedAt: Date; // required; a Firestore Timestamp on the wire
  groupId: string; // required
  memberEmails: string[]; // required; denormalized auth field the rules read
  github?: GithubSignals;
  ga4?: Ga4AppSignals[]; // per configured host (one property, split by hostName)
  gsc?: GscSignals; // single site
  psi?: PsiUrlSignals[]; // per deployed-app URL
}

export interface GithubSignals {
  repo: string; // owner/name
  stars: number;
  forks: number;
  watchers: number;
  // Fork identity + activity for the fork-and-derivative review — SEPARATELY
  // optional from stats in the same style as `traffic` (omitted on fetch
  // failure, public stats still emitted). The `forks` count above cannot
  // discriminate a drive-by fork from an active derivative; this per-fork detail
  // (created vs pushed dates) can. Local-snapshot-only: the hosted Firestore
  // producer never emits it, so parity excludes it (see parity.ts).
  forksDetail?: Array<{
    owner: string;
    repoUrl: string;
    createdAt: string;
    pushedAt: string;
    stars: number;
  }>;
  // Traffic is SEPARATELY optional from stats: stars/forks/watchers are public,
  // but traffic needs an elevated (push-access) token. When the token lacks
  // traffic access the traffic endpoints 403; we omit `traffic` while still
  // emitting the public stats.
  traffic?: {
    clonesCount: number;
    clonesUniques: number;
    viewsCount: number;
    viewsUniques: number;
    topReferrers: Array<{ referrer: string; count: number; uniques: number }>;
  };
}

export interface Ga4AppSignals {
  app: string;
  pageViews: number;
  sessions: number;
  bounceRate: number;
  topReferralSources: Array<{ source: string; sessions: number }>;
  topLandingPages: Array<{ page: string; sessions: number; views: number }>;
  // Empty until web_vitals custom defs are registered in each GA4 property; the
  // align script's percentile aggregation is intentionally not collected here.
  webVitals: Array<{ metric: string; avg: number; goodPct: number }>;
}

export interface GscSignals {
  site: string;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  devices: Array<{ device: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

export interface PsiUrlSignals {
  url: string;
  strategy: "mobile" | "desktop";
  performance: number | null; // 0–100 integer; null when the category score is absent (script's "n/a")
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  lcp: string; // Lighthouse displayValue strings (e.g. "2.1 s", "0.04")
  cls: string;
  tbt: string;
  fcp: string;
}

// Appended to office-hours/{env}/signal-samples/{autoId} once per run. Headline
// scalars only — each is omitted when its source did not contribute this run.
interface ProjectSignalSample {
  sampledAt: Date;
  groupId: string;
  memberEmails: string[];
  stars?: number;
  forks?: number;
  pageViews?: number; // summed across GA4 apps
  sessions?: number; // summed across GA4 apps
  gscClicks?: number; // summed from topPages
  gscImpressions?: number; // summed from topPages
  psiPerformance?: number; // first-URL performance score at the configured strategy (mobile or desktop)
}

// ---------------------------------------------------------------------------
// Per-source live fetchers. Each is small and pure: it takes an injected `fetch`
// and config, and returns the parsed sub-object. Tests stub `fetch`.
// ---------------------------------------------------------------------------

type FetchFn = typeof globalThis.fetch;

// NOTE: GitHub stats/traffic are NOT fetched here via `fetch`+token, unlike the
// Firebase-function twin (functions/src/project-signals-core.ts). The local
// snapshot producer authenticates as the operator's own `gh` CLI session
// instead, so its GitHub fetching lives in gh-fetchers.ts's `fetchGithub`
// (REST via `gh api`, no injected FetchFn/token needed). Keeping a
// fetch+token-based fetchGithubStatsLive/fetchGithubTrafficLive pair here
// would be unreachable duplication of that function's twin.

// Exchanges a Google OAuth refresh token for a short-lived access token. Mirrors
// fetch-analytics.sh lines 86-101. This single token authenticates BOTH GA4
// runReport and GSC searchAnalytics.
export async function fetchGoogleAccessTokenLive(
  fetchFn: FetchFn,
  creds: { clientId: string; clientSecret: string; refreshToken: string },
): Promise<string> {
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: creds.refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetchFn("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth token exchange failed: ${res.status} ${truncateForLog(text)}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("Google OAuth token response missing access_token");
  }
  return json.access_token;
}

interface Ga4RunReportResponse {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
}

// Posts the three stable GA4 runReport queries (overview, referral sources,
// landing pages) for ONE property and splits each by the `hostName` dimension,
// emitting one Ga4AppSignals row per configured host. Mirrors fetch-analytics.sh
// Step 3 (a)/(b)/(c); the web-vitals query (d) is intentionally not run, so
// webVitals is always [].
//
// GA4's runReport is property-scoped (there is no stream-scoped report endpoint),
// so a single property aggregates every app subdomain. Adding `hostName` as the
// first dimension lets the report partition by host server-side: each host's
// pageViews/sessions/bounceRate come straight from its own overview row (NEVER
// averaged across hosts). For the referral/landing top-N, `hostName` first means
// a query `limit` would cap TOTAL rows and `orderBys` would sort globally — so we
// DROP the small per-query limit and instead group rows by host, then slice the
// first 10 per host. Because the global order is sessions-desc, those first 10
// rows for each host ARE that host's top-10. `propertyId` is pre-validated by the
// caller; `hostApps` carries the host→app label map (a host absent from it is
// dropped — it has no app label).
export async function fetchGa4Live(
  fetchFn: FetchFn,
  accessToken: string,
  propertyId: string,
  hostApps: Array<{ host: string; app: string }>,
): Promise<Ga4AppSignals[]> {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const runReport = async (reportBody: Record<string, unknown>): Promise<Ga4RunReportResponse> => {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportBody),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `GA4 runReport failed for property ${propertyId}: ${res.status} ${truncateForLog(text)}`,
      );
    }
    return (await res.json()) as Ga4RunReportResponse; // type-safety-ok: cast matches documented GA4 runReport schema
  };

  const num = (v: string | undefined): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // The three reports POST to the same GA4 endpoint and are fully independent,
  // so run them in parallel (mirrors the GitHub traffic-endpoint pattern above)
  // to avoid tripling latency in a timeout-bound Function.
  const [overview, referral, landing] = await Promise.all([
    // (a) Overview per host: page views, sessions, bounce rate (30-day window).
    // GA4 returns one row per host; take each host's value DIRECTLY.
    runReport({
      dateRanges: [GA4_WINDOW],
      dimensions: [{ name: "hostName" }],
      metrics: [{ name: "screenPageViews" }, { name: "sessions" }, { name: "bounceRate" }],
    }),
    // (b) Referral sources by host. No `limit` (global sessions-desc order),
    // grouped by host then sliced to top-10 per host below.
    runReport({
      dateRanges: [GA4_WINDOW],
      dimensions: [{ name: "hostName" }, { name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
    // (c) Landing-page performance by host. Same no-limit, group-then-slice posture.
    runReport({
      dateRanges: [GA4_WINDOW],
      dimensions: [{ name: "hostName" }, { name: "landingPage" }],
      metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
  ]);

  const overviewByHost = new Map<string, { pageViews: number; sessions: number; bounceRate: number }>();
  for (const r of overview.rows ?? []) {
    const host = r.dimensionValues?.[0]?.value ?? "";
    const m = r.metricValues ?? [];
    overviewByHost.set(host, {
      pageViews: num(m[0]?.value),
      sessions: num(m[1]?.value),
      bounceRate: num(m[2]?.value),
    });
  }

  const referralByHost = new Map<string, Array<{ source: string; sessions: number }>>();
  for (const r of referral.rows ?? []) {
    const host = r.dimensionValues?.[0]?.value ?? "";
    const arr = referralByHost.get(host) ?? [];
    arr.push({
      source: r.dimensionValues?.[1]?.value ?? "",
      sessions: num(r.metricValues?.[0]?.value),
    });
    referralByHost.set(host, arr);
  }

  const landingByHost = new Map<string, Array<{ page: string; sessions: number; views: number }>>();
  for (const r of landing.rows ?? []) {
    const host = r.dimensionValues?.[0]?.value ?? "";
    const arr = landingByHost.get(host) ?? [];
    arr.push({
      page: r.dimensionValues?.[1]?.value ?? "",
      sessions: num(r.metricValues?.[0]?.value),
      views: num(r.metricValues?.[1]?.value),
    });
    landingByHost.set(host, arr);
  }

  // One entry per configured host, in hostApps order. A host that produced no
  // data defaults to 0 metrics and empty top-N arrays.
  return hostApps.map(({ host, app }) => {
    const ov = overviewByHost.get(host);
    return {
      app,
      pageViews: ov?.pageViews ?? 0,
      sessions: ov?.sessions ?? 0,
      bounceRate: ov?.bounceRate ?? 0,
      topReferralSources: (referralByHost.get(host) ?? []).slice(0, 10),
      topLandingPages: (landingByHost.get(host) ?? []).slice(0, 10),
      webVitals: [],
    };
  });
}

interface GscQueryResponse {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
}

// Posts the three GSC searchAnalytics queries (queries, pages, devices) for one
// site and parses them. Mirrors fetch-analytics.sh Step 4 (lines 309-384). The
// `site` is pre-validated by the caller and percent-encoded into the URL path.
export async function fetchGscLive(
  fetchFn: FetchFn,
  accessToken: string,
  site: string,
  now: Date,
): Promise<GscSignals> {
  const encodedSite = encodeURIComponent(site);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;
  const startDate = new Date(now.getTime() - GSC_WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10);
  const endDate = now.toISOString().slice(0, 10);

  const query = async (reportBody: Record<string, unknown>): Promise<GscQueryResponse> => {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportBody),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Search Console query failed: ${res.status} ${truncateForLog(text)}`);
    }
    return (await res.json()) as GscQueryResponse; // type-safety-ok: cast matches documented GSC searchAnalytics schema
  };

  const mapRow = (key: string) => (r: NonNullable<GscQueryResponse["rows"]>[number]) => ({
    [key]: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  });

  const queryReport = await query({ startDate, endDate, dimensions: ["query"], rowLimit: 25 });
  const pageReport = await query({ startDate, endDate, dimensions: ["page"], rowLimit: 25 });
  const deviceReport = await query({ startDate, endDate, dimensions: ["device"] });

  return {
    site,
    topQueries: (queryReport.rows ?? []).map(mapRow("query")) as GscSignals["topQueries"], // type-safety-ok: mapRow output matches the GscSignals field shape
    topPages: (pageReport.rows ?? []).map(mapRow("page")) as GscSignals["topPages"], // type-safety-ok: mapRow output matches the GscSignals field shape
    devices: (deviceReport.rows ?? []).map(mapRow("device")) as GscSignals["devices"], // type-safety-ok: mapRow output matches the GscSignals field shape
  };
}

interface PsiResponse {
  lighthouseResult?: {
    categories?: Record<string, { score?: number | null } | undefined>;
    audits?: Record<string, { displayValue?: string } | undefined>;
  };
}

// Queries the PSI / Lighthouse-lab API once for one URL+strategy and parses the
// four category scores (0–100 integers; null when absent) and the four lab
// metric displayValue strings. Mirrors fetch-psi.sh lines 95-140. CrUX field
// data is intentionally not collected. `apiKey` is optional (keyless default).
export async function fetchPsiLive(
  fetchFn: FetchFn,
  url: string,
  strategy: "mobile" | "desktop",
  apiKey: string | undefined,
): Promise<PsiUrlSignals> {
  const params = new URLSearchParams();
  params.append("url", url);
  params.append("strategy", strategy);
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) {
    params.append("category", c);
  }
  if (apiKey) params.append("key", apiKey);

  const res = await fetchFn(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`,
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PSI request failed for ${url}: ${res.status} ${truncateForLog(text)}`);
  }
  const json = (await res.json()) as PsiResponse; // type-safety-ok: cast matches documented PSI runPagespeed schema
  const cats = json.lighthouseResult?.categories ?? {};
  const audits = json.lighthouseResult?.audits ?? {};

  // Category score 0–1 float → 0–100 integer via round (matches Lighthouse's own
  // rounding); null/absent → null (the script's "n/a").
  const score = (cat: string): number | null => {
    const s = cats[cat]?.score;
    return s === null || s === undefined ? null : Math.round(s * 100);
  };
  const display = (audit: string): string => audits[audit]?.displayValue ?? "n/a";

  return {
    url,
    strategy,
    performance: score("performance"),
    seo: score("seo"),
    accessibility: score("accessibility"),
    bestPractices: score("best-practices"),
    lcp: display("largest-contentful-paint"),
    cls: display("cumulative-layout-shift"),
    tbt: display("total-blocking-time"),
    fcp: display("first-contentful-paint"),
  };
}

// ---------------------------------------------------------------------------
// Dependency-injected core — mirrors sampleDispatchQueueCore. Each source runs
// under its own try/catch; the snapshot is assembled from whichever succeeded;
// a failed/dormant source's key is omitted via conditional spread.
// ---------------------------------------------------------------------------

export interface CollectProjectSignalsDeps {
  firestore: Firestore;
  namespace: string;
  groupId: string;
  memberEmails: string[];
  now: Date;
  // Each fetcher is null when its source is unconfigured (skipped entirely).
  fetchGithub: (() => Promise<GithubSignals>) | null;
  fetchGa4: (() => Promise<Ga4AppSignals[]>) | null;
  fetchGsc: ((now: Date) => Promise<GscSignals>) | null;
  fetchPsi: (() => Promise<PsiUrlSignals[]>) | null;
}

export async function collectProjectSignalsCore(deps: CollectProjectSignalsDeps): Promise<void> {
  let github: GithubSignals | undefined;
  let ga4: Ga4AppSignals[] | undefined;
  let gsc: GscSignals | undefined;
  let psi: PsiUrlSignals[] | undefined;

  if (deps.fetchGithub) {
    try {
      github = await deps.fetchGithub();
    } catch (err) {
      console.error(
        `collectProjectSignals: github source failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  if (deps.fetchGa4) {
    try {
      ga4 = await deps.fetchGa4();
    } catch (err) {
      console.error(
        `collectProjectSignals: ga4 source failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  if (deps.fetchGsc) {
    try {
      gsc = await deps.fetchGsc(deps.now);
    } catch (err) {
      console.error(
        `collectProjectSignals: gsc source failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  if (deps.fetchPsi) {
    try {
      psi = await deps.fetchPsi();
    } catch (err) {
      console.error(
        `collectProjectSignals: psi source failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Build the snapshot. OMIT a failed/dormant source's key (never write
  // undefined — firebase-admin rejects it).
  const snapshot: ProjectSignalsSnapshot = {
    computedAt: deps.now,
    groupId: deps.groupId,
    memberEmails: deps.memberEmails,
    ...(github ? { github } : {}),
    ...(ga4 && ga4.length > 0 ? { ga4 } : {}),
    ...(gsc ? { gsc } : {}),
    ...(psi && psi.length > 0 ? { psi } : {}),
  };
  await deps.firestore.doc(`${deps.namespace}/metrics/project-signals`).set(snapshot);

  // Headline-scalar time-series sample. Each scalar is omitted when its source
  // did not contribute this run.
  const pageViews = ga4 ? ga4.reduce((sum, a) => sum + a.pageViews, 0) : undefined;
  const sessions = ga4 ? ga4.reduce((sum, a) => sum + a.sessions, 0) : undefined;
  const gscClicks = gsc
    ? gsc.topPages.reduce((sum, p) => sum + p.clicks, 0)
    : undefined;
  const gscImpressions = gsc
    ? gsc.topPages.reduce((sum, p) => sum + p.impressions, 0)
    : undefined;
  const psiPerformance =
    psi && psi.length > 0 && psi[0].performance !== null ? psi[0].performance : undefined;

  const sample: ProjectSignalSample = {
    sampledAt: deps.now,
    groupId: deps.groupId,
    memberEmails: deps.memberEmails,
    ...(github ? { stars: github.stars, forks: github.forks } : {}),
    ...(pageViews !== undefined ? { pageViews } : {}),
    ...(sessions !== undefined ? { sessions } : {}),
    ...(gscClicks !== undefined ? { gscClicks } : {}),
    ...(gscImpressions !== undefined ? { gscImpressions } : {}),
    ...(psiPerformance !== undefined ? { psiPerformance } : {}),
  };
  await deps.firestore.collection(`${deps.namespace}/signal-samples`).add(sample);
}

// ---- Validation helpers (exported for testing) ----------------------------

export function isValidOwnerName(repo: string): boolean {
  const slash = repo.indexOf("/");
  return slash > 0 && slash !== repo.length - 1 && repo.indexOf("/", slash + 1) === -1;
}

// Shared https URL pattern for GSC sites and PSI URLs: an https URL whose path
// has no `..` traversal component and no `//` empty segment. Tightening the
// allowed character set or the lookaheads here applies to both validators.
const HTTPS_URL_RE =
  /^https:\/\/(?!.*\/\/)(?!.*\.\.)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]*)*$/;

// isValidGscSite — accepts `sc-domain:<host>` (no slashes) or an https URL
// whose path has no `..` traversal component and no `//` empty segment.
export function isValidGscSite(site: string): boolean {
  return /^sc-domain:[A-Za-z0-9.-]+$/.test(site) || HTTPS_URL_RE.test(site);
}

// isValidPsiUrl — https URL with no `..` traversal component and no `//`
// empty path segment.
export function isValidPsiUrl(url: string): boolean {
  return HTTPS_URL_RE.test(url);
}

// Parses "host:app,host:app,..." into validated host→app entries. NOTE the order:
// host is on the LEFT (matched against the GA4 `hostName` dimension; may contain
// dots), app is on the RIGHT (the emitted label). Each entry is split on the
// FIRST `:`. A host must match [A-Za-z0-9.-]+, an app must match [A-Za-z0-9_-]+;
// malformed entries are dropped (same drop-invalid posture as the old pair parse).
export function parseGa4HostApps(raw: string): Array<{ host: string; app: string }> {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((entry) => {
      const idx = entry.indexOf(":");
      if (idx <= 0) return null;
      const host = entry.slice(0, idx);
      const app = entry.slice(idx + 1);
      if (!/^[A-Za-z0-9.-]+$/.test(host) || !/^[A-Za-z0-9_-]+$/.test(app)) return null;
      return { host, app };
    })
    .filter((p): p is { host: string; app: string } => p !== null);
}
