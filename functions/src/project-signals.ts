// collectProjectSignals — scheduled Firebase Function that gathers every
// available project signal (GitHub stats + traffic, GA4, Google Search Console,
// PageSpeed Insights) server-side on a schedule and persists durable snapshots,
// mirroring the dispatch-queue-metrics.ts collector.
//
// WIRE SHAPE IS THE SOURCE OF TRUTH. The interfaces below define exactly what is
// written to Firestore; the office-hours app re-declares the read shape
// independently (there is no shared types package), so these comments are the
// contract. Two documents are written per run:
//   - ONE shared snapshot at `office-hours/{env}/metrics/project-signals`
//     (`.set`), carrying whichever sources succeeded this run.
//   - ONE headline-scalar sample appended to
//     `office-hours/{env}/signal-samples/{autoId}` (`.add`) for the time series.
//
// This store (the `project-signals` metrics doc + the `signal-samples` series)
// is what the intention graph's per-node readings (#2371) will consume to attach
// live project signals to the nodes they bear on.
//
// Each source runs under its OWN try/catch and contributes nothing when it fails
// or is unconfigured; a failed/dormant source's key is OMITTED from the written
// document via conditional spread (firebase-admin rejects an explicit
// `undefined`). The collector ALWAYS writes the snapshot with whatever succeeded.
//
// Fetch logic is ported faithfully from the /align skill scripts
// (.claude/skills/align/scripts/{gather-context,fetch-analytics,fetch-psi}.sh).
// CrUX field-data and GA4 web-vitals percentile aggregation are intentionally
// DROPPED — they are not in those scripts' stable output.
//
// Authentication:
//   - GitHub: reuses the syncOfficeHours GitHub App auth (`mintInstallationToken`
//     imported, not re-implemented; param NAMES shared so firebase-functions
//     dedupes them). Stats are public; traffic needs push access, so traffic is
//     omitted (not an error) when the token lacks it.
//   - GA4 + GSC: a SINGLE Google OAuth refresh-token→access-token exchange, whose
//     access token authenticates both runReport (GA4) and searchAnalytics (GSC).
//     When Google creds are absent, BOTH sources skip together.
//   - PSI: keyless by default (IP-rate-limited); PAGESPEED_API_KEY only raises the
//     limit.
//
// If a required identity param is missing/invalid the function logs one line and
// returns without writing. A live outage in any single source is swallowed by
// that source's try/catch so the schedule keeps running cheaply.
//
// SETUP STEPS (one-time manual provisioning, performed by the repo owner
// post-merge; the function deploys dormant until these are completed):
//
//   1. Google APIs. In the Google Cloud project that backs the Firebase project:
//      enable the "Google Analytics Data API" (GA4 runReport) and the
//      "Google Search Console API" (searchAnalytics). Both can be enabled via
//      the Cloud Console APIs & Services library or `gcloud services enable`.
//
//   2. Google OAuth credential. Create an OAuth 2.0 client ID (Desktop or Web
//      application type) in the Cloud Console. Grant the credential
//      `analytics.readonly` (to run GA4 reports) and `webmasters.readonly` (to
//      query Search Console) scopes. Exchange the auth code for a refresh token
//      once (e.g. using the OAuth playground or a one-time local script); that
//      refresh token is long-lived and is what you set as the secret below.
//
//   3. PSI API key (optional). A keyless call works but is IP-rate-limited. If
//      that becomes a problem, create an API key in the Cloud Console for the
//      "PageSpeed Insights API" and set it via `PAGESPEED_API_KEY` below.
//
//   4. GitHub App — traffic read. GitHub's traffic API (clones, views,
//      referrers) requires the `Administration: read` repository permission
//      for a GitHub App — NOT `Contents: read`. To unlock traffic data, add
//      `Administration: read` to the App's repository permissions, then accept
//      the pending permission upgrade on the installation. Until then, traffic
//      is silently omitted from each run (a 403 "Resource not accessible by
//      integration") while public stats (stars/forks/watchers) continue to be
//      collected — no error is raised.
//
//   5. Secrets. Set each secret via `firebase functions:secrets:set`:
//        OFFICE_HOURS_GITHUB_APP_PRIVATE_KEY  — already set (reused)
//        OFFICE_HOURS_MEMBER_EMAILS           — already set (reused)
//        GOOGLE_ANALYTICS_CLIENT_SECRET       — OAuth client secret from step 2
//        GOOGLE_ANALYTICS_REFRESH_TOKEN       — OAuth refresh token from step 2
//        PAGESPEED_API_KEY                    — PSI key from step 3 (optional)
//
//   6. Config vars. Set each `defineString` var in the Firebase Functions
//      config (`.env.<project>` or `firebase functions:config:set` depending
//      on your Firebase CLI version):
//        PROJECT_SIGNALS_GITHUB_REPO          — "owner/name" of the repo to track
//        GOOGLE_ANALYTICS_CLIENT_ID           — OAuth client ID from step 2
//        PROJECT_SIGNALS_GA4_PROPERTY_IDS     — "app:propertyId,app:propertyId,..."
//        PROJECT_SIGNALS_GSC_SITE             — defaults to "sc-domain:commons.systems"
//                                               (covers all commons.systems subdomains;
//                                               one site config suffices for the whole
//                                               domain property already verified in GSC)
//        PROJECT_SIGNALS_PSI_URLS             — comma-separated https:// URLs to audit
//        PROJECT_SIGNALS_PSI_STRATEGY         — "mobile" (default) or "desktop"
//
//   7. Post-deploy live QA. After deploying, trigger one manual run from the
//      Firebase Console (Functions → collectProjectSignals → Test) and verify:
//      - The `office-hours/{env}/metrics/project-signals` document is written
//        with whichever sources are configured.
//      - A new document appears in `office-hours/{env}/signal-samples`.
//      - The PROJECT SIGNALS panel in the office-hours dashboard renders the
//        collected values.
//
// Intention-graph contract (see also lines 10–17 above):
//   `office-hours/{env}/metrics/project-signals` and the `signal-samples` time
//   series are the Firestore paths the intention graph's per-node readings
//   (#2371) will read to attach live project signals to the nodes they bear on.
//   Do not rename or restructure these paths without updating #2371's
//   implementation.
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret, defineString } from "firebase-functions/params";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { mintInstallationToken } from "./office-hours-sync.js";
import { truncateForLog } from "./log-utils.js";

// Reuse the SAME param names as office-hours-sync.ts / dispatch-queue-metrics.ts
// so firebase-functions dedupes them across modules (params are keyed by name).
const GH_APP_PRIVATE_KEY = defineSecret("OFFICE_HOURS_GITHUB_APP_PRIVATE_KEY");
const GH_APP_ID = defineString("OFFICE_HOURS_GITHUB_APP_ID");
const GH_APP_INSTALLATION_ID = defineString("OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID");
const MEMBER_EMAILS = defineSecret("OFFICE_HOURS_MEMBER_EMAILS");
const NAMESPACE = defineString("OFFICE_HOURS_FIRESTORE_NAMESPACE", { default: "office-hours/prod" });
const GROUP_ID = defineString("OFFICE_HOURS_GROUP_ID");

// New config vars. Every source is dormant until its config is set (empty
// default => that source no-ops), so the function deploys safely without wiring.
const GITHUB_REPO = defineString("PROJECT_SIGNALS_GITHUB_REPO"); // owner/name; singular (not the queue repo list)

// GA4 + GSC share one Google OAuth credential.
const GA4_CLIENT_SECRET = defineSecret("GOOGLE_ANALYTICS_CLIENT_SECRET");
const GA4_REFRESH_TOKEN = defineSecret("GOOGLE_ANALYTICS_REFRESH_TOKEN");
const GA4_CLIENT_ID = defineString("GOOGLE_ANALYTICS_CLIENT_ID");
const GA4_PROPERTY_IDS = defineString("PROJECT_SIGNALS_GA4_PROPERTY_IDS"); // "app:propertyId,app:propertyId,..."
const GSC_SITE = defineString("PROJECT_SIGNALS_GSC_SITE", { default: "sc-domain:commons.systems" });

// PSI. Keyless by default; the key only raises the rate limit.
const PAGESPEED_API_KEY = defineSecret("PAGESPEED_API_KEY");
const PSI_URLS = defineString("PROJECT_SIGNALS_PSI_URLS", {
  default:
    "https://commons.systems,https://budget.commons.systems,https://print.commons.systems,https://audio.commons.systems,https://fellspiral.commons.systems",
});
const PSI_STRATEGY = defineString("PROJECT_SIGNALS_PSI_STRATEGY", { default: "mobile" });

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp();

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
  ga4?: Ga4AppSignals[]; // per app (app:propertyId config pairs)
  gsc?: GscSignals; // single site
  psi?: PsiUrlSignals[]; // per deployed-app URL
}

export interface GithubSignals {
  repo: string; // owner/name
  stars: number;
  forks: number;
  watchers: number;
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

interface GithubRepoResponse {
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
}

interface GithubTrafficCountResponse {
  count: number;
  uniques: number;
}

interface GithubReferrerResponse {
  referrer: string;
  count: number;
  uniques: number;
}

// Fetches the public repo stats (stars/forks/watchers) via the REST repo
// endpoint. Mirrors gather-context.sh line 42 (`repos/$OWNER_REPO`
// {stargazers_count, forks_count, watchers_count}).
export async function fetchGithubStatsLive(
  fetchFn: FetchFn,
  token: string,
  repo: string,
): Promise<Pick<GithubSignals, "repo" | "stars" | "forks" | "watchers">> {
  const res = await fetchFn(`https://api.github.com/repos/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "project-signals/1.0",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub repo stats request failed: ${res.status} ${truncateForLog(text)}`);
  }
  const json = (await res.json()) as GithubRepoResponse; // type-safety-ok: cast matches documented GitHub repo schema
  return {
    repo,
    stars: json.stargazers_count,
    forks: json.forks_count,
    watchers: json.watchers_count,
  };
}

// Fetches the three traffic endpoints (clones, views, popular/referrers). These
// require push access and 403 otherwise; the caller treats any throw as "no
// traffic access" and omits the `traffic` key. Not present in the align scripts
// (constructed here from the documented REST traffic API).
export async function fetchGithubTrafficLive(
  fetchFn: FetchFn,
  token: string,
  repo: string,
): Promise<NonNullable<GithubSignals["traffic"]>> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "project-signals/1.0",
  };
  const getJson = async <T>(path: string): Promise<T> => {
    const res = await fetchFn(`https://api.github.com/repos/${repo}/traffic/${path}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub traffic/${path} request failed: ${res.status} ${truncateForLog(text)}`);
    }
    return (await res.json()) as T; // type-safety-ok: cast matches documented GitHub traffic schema
  };

  const [clones, views, referrers] = await Promise.all([
    getJson<GithubTrafficCountResponse>("clones"),
    getJson<GithubTrafficCountResponse>("views"),
    getJson<GithubReferrerResponse[]>("popular/referrers"),
  ]);

  return {
    clonesCount: clones.count,
    clonesUniques: clones.uniques,
    viewsCount: views.count,
    viewsUniques: views.uniques,
    topReferrers: referrers.map((r) => ({
      referrer: r.referrer,
      count: r.count,
      uniques: r.uniques,
    })),
  };
}

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
// landing pages) for one property and parses them. Mirrors fetch-analytics.sh
// Step 3 (a)/(b)/(c); the web-vitals query (d) is intentionally not run, so
// webVitals is always []. `app`/`propertyId` are pre-validated by the caller.
export async function fetchGa4Live(
  fetchFn: FetchFn,
  accessToken: string,
  app: string,
  propertyId: string,
): Promise<Ga4AppSignals> {
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
      throw new Error(`GA4 runReport failed for ${app}: ${res.status} ${truncateForLog(text)}`);
    }
    return (await res.json()) as Ga4RunReportResponse; // type-safety-ok: cast matches documented GA4 runReport schema
  };

  const num = (v: string | undefined): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // (a) Overview: page views, sessions, bounce rate (30-day window).
  const overview = await runReport({
    dateRanges: [GA4_WINDOW],
    metrics: [{ name: "screenPageViews" }, { name: "sessions" }, { name: "bounceRate" }],
  });
  const ov = overview.rows?.[0]?.metricValues ?? [];

  // (b) Top-10 referral sources by sessions.
  const referral = await runReport({
    dateRanges: [GA4_WINDOW],
    dimensions: [{ name: "sessionSource" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 10,
  });
  const topReferralSources = (referral.rows ?? []).map((r) => ({
    source: r.dimensionValues?.[0]?.value ?? "",
    sessions: num(r.metricValues?.[0]?.value),
  }));

  // (c) Landing-page performance.
  const landing = await runReport({
    dateRanges: [GA4_WINDOW],
    dimensions: [{ name: "landingPage" }],
    metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 10,
  });
  const topLandingPages = (landing.rows ?? []).map((r) => ({
    page: r.dimensionValues?.[0]?.value ?? "",
    sessions: num(r.metricValues?.[0]?.value),
    views: num(r.metricValues?.[1]?.value),
  }));

  return {
    app,
    pageViews: num(ov[0]?.value),
    sessions: num(ov[1]?.value),
    bounceRate: num(ov[2]?.value),
    topReferralSources,
    topLandingPages,
    webVitals: [],
  };
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

// ---------------------------------------------------------------------------
// Scheduled top-level wrapper.
//
// Schedule: every 6 hours, 300s timeout.
//   (a) PSI keyless is IP-rate-limited and GA4/GSC barely move hour-to-hour, so
//       an hourly schedule would flood signal-samples with near-identical rows
//       and risk PSI rate-limit rejections. Six-hourly keeps the series legible.
//   (b) PSI is up to ~60s per URL × ~5 deployed-app URLs; even run in parallel a
//       slow batch plus the GA4/GSC/GitHub round-trips can approach a few minutes,
//       so a 300s timeout gives headroom.
// ---------------------------------------------------------------------------
export const collectProjectSignals = onSchedule(
  {
    schedule: "every 6 hours",
    secrets: [
      GH_APP_PRIVATE_KEY,
      MEMBER_EMAILS,
      GA4_CLIENT_SECRET,
      GA4_REFRESH_TOKEN,
      PAGESPEED_API_KEY,
    ],
    timeoutSeconds: 300,
  },
  async () => {
    // ---- Identity guard FIRST (mirrors dispatch-queue-metrics.ts) -----------
    const groupId = GROUP_ID.value();
    const memberEmailsStr = MEMBER_EMAILS.value();
    const namespace = NAMESPACE.value();

    if (!groupId || !memberEmailsStr) {
      console.error(
        "collectProjectSignals: missing required identity config (OFFICE_HOURS_GROUP_ID / OFFICE_HOURS_MEMBER_EMAILS); skipping run.",
      );
      return;
    }

    if (!/^office-hours\/[A-Za-z0-9][A-Za-z0-9-]*$/.test(namespace)) {
      console.error(
        `collectProjectSignals: OFFICE_HOURS_FIRESTORE_NAMESPACE "${namespace}" is not a valid office-hours/<env> path; skipping run.`,
      );
      return;
    }

    const memberEmails = memberEmailsStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Fail closed: a whitespace-only value would lock the owner out of the doc.
    if (memberEmails.length === 0) {
      console.error(
        "collectProjectSignals: OFFICE_HOURS_MEMBER_EMAILS resolved to an empty list; skipping run.",
      );
      return;
    }

    const fetchFn = globalThis.fetch;

    // ---- Per-source config gates. Each builds a fetcher closure or stays null.
    // GitHub: needs the App auth params AND a valid owner/name repo.
    let fetchGithub: CollectProjectSignalsDeps["fetchGithub"] = null;
    const githubRepo = GITHUB_REPO.value();
    const appId = GH_APP_ID.value();
    const installationId = GH_APP_INSTALLATION_ID.value();
    const privateKey = GH_APP_PRIVATE_KEY.value();
    if (!githubRepo || !appId || !installationId || !privateKey) {
      console.log("collectProjectSignals: skipping github: not configured");
    } else if (!isValidOwnerName(githubRepo)) {
      console.error(
        `collectProjectSignals: PROJECT_SIGNALS_GITHUB_REPO "${githubRepo}" is not a valid owner/name; skipping github.`,
      );
    } else if (!/^\d+$/.test(installationId)) {
      console.error(
        `collectProjectSignals: OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID "${installationId}" is not numeric; skipping github.`,
      );
    } else {
      fetchGithub = async (): Promise<GithubSignals> => {
        const token = await mintInstallationToken({ appId, installationId, privateKey });
        const stats = await fetchGithubStatsLive(fetchFn, token, githubRepo);
        // Traffic needs push access; a 403 (or any error) means "no access" — omit
        // traffic but keep the public stats.
        try {
          const traffic = await fetchGithubTrafficLive(fetchFn, token, githubRepo);
          return { ...stats, traffic };
        } catch (err) {
          console.log(
            `collectProjectSignals: github traffic unavailable (${err instanceof Error ? err.message : String(err)}); omitting traffic.`,
          );
          return stats;
        }
      };
    }

    // GA4 + GSC share one Google OAuth token. When Google creds are absent, BOTH
    // skip together. GA4 additionally needs the property-id map; GSC needs a site.
    let fetchGa4: CollectProjectSignalsDeps["fetchGa4"] = null;
    let fetchGsc: CollectProjectSignalsDeps["fetchGsc"] = null;
    const ga4ClientId = GA4_CLIENT_ID.value();
    const ga4ClientSecret = GA4_CLIENT_SECRET.value();
    const ga4RefreshToken = GA4_REFRESH_TOKEN.value();
    const ga4PropertyIds = GA4_PROPERTY_IDS.value();
    const gscSite = GSC_SITE.value();
    if (!ga4ClientId || !ga4ClientSecret || !ga4RefreshToken) {
      console.log("collectProjectSignals: skipping ga4+gsc: Google OAuth not configured");
    } else {
      // Mint the shared Google access token once, lazily, memoized across both
      // sources so a single run exchanges the refresh token at most once.
      let tokenPromise: Promise<string> | null = null;
      const googleToken = (): Promise<string> => {
        if (!tokenPromise) {
          tokenPromise = fetchGoogleAccessTokenLive(fetchFn, {
            clientId: ga4ClientId,
            clientSecret: ga4ClientSecret,
            refreshToken: ga4RefreshToken,
          });
        }
        return tokenPromise;
      };

      const ga4Pairs = parseGa4Pairs(ga4PropertyIds);
      if (ga4Pairs.length === 0) {
        console.log("collectProjectSignals: skipping ga4: no valid app:propertyId pairs configured");
      } else {
        fetchGa4 = async (): Promise<Ga4AppSignals[]> => {
          const token = await googleToken();
          return Promise.all(ga4Pairs.map((p) => fetchGa4Live(fetchFn, token, p.app, p.propertyId)));
        };
      }

      if (!isValidGscSite(gscSite)) {
        console.error(
          `collectProjectSignals: PROJECT_SIGNALS_GSC_SITE "${gscSite}" is not a valid sc-domain:/https:// site; skipping gsc.`,
        );
      } else {
        fetchGsc = async (now: Date): Promise<GscSignals> => {
          const token = await googleToken();
          return fetchGscLive(fetchFn, token, gscSite, now);
        };
      }
    }

    // PSI: gated only on valid URLs + strategy (keyless by default).
    let fetchPsi: CollectProjectSignalsDeps["fetchPsi"] = null;
    const psiStrategy = PSI_STRATEGY.value();
    const psiUrls = (PSI_URLS.value() || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .filter((u) => isValidPsiUrl(u));
    const apiKey = PAGESPEED_API_KEY.value() || undefined;
    if (psiStrategy !== "mobile" && psiStrategy !== "desktop") {
      console.error(
        `collectProjectSignals: PROJECT_SIGNALS_PSI_STRATEGY "${psiStrategy}" must be mobile or desktop; skipping psi.`,
      );
    } else if (psiUrls.length === 0) {
      console.log("collectProjectSignals: skipping psi: no valid URLs configured");
    } else {
      const strategy = psiStrategy;
      fetchPsi = async (): Promise<PsiUrlSignals[]> =>
        Promise.all(psiUrls.map((u) => fetchPsiLive(fetchFn, u, strategy, apiKey)));
    }

    if (!fetchGithub && !fetchGa4 && !fetchGsc && !fetchPsi) {
      console.error(
        "collectProjectSignals: no source is configured; skipping run (nothing to collect).",
      );
      return;
    }

    try {
      const firestore = getFirestore(adminApp!); // type-safety-ok: adminApp is initialized at module load before any scheduled trigger fires
      await collectProjectSignalsCore({
        firestore,
        namespace,
        groupId,
        memberEmails,
        now: new Date(),
        fetchGithub,
        fetchGa4,
        fetchGsc,
        fetchPsi,
      });
      console.log(`collectProjectSignals: wrote ${namespace}/metrics/project-signals`);
    } catch (err) {
      console.error(
        `collectProjectSignals: collection run failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }
  },
);

// ---- Validation helpers (exported for testing) ----------------------------

export function isValidOwnerName(repo: string): boolean {
  const slash = repo.indexOf("/");
  return slash > 0 && slash !== repo.length - 1 && repo.indexOf("/", slash + 1) === -1;
}

export function isValidGscSite(site: string): boolean {
  return /^(sc-domain:[A-Za-z0-9.-]+|https:\/\/[A-Za-z0-9._/-]+)$/.test(site);
}

export function isValidPsiUrl(url: string): boolean {
  return /^https:\/\/[A-Za-z0-9._/-]+$/.test(url);
}

// Parses "app:propertyId,app:propertyId,..." into validated pairs. An app name
// must match [A-Za-z0-9_-]+ (echoed into a header), a property id must be numeric
// (interpolated into a URL path). Invalid pairs are dropped. Mirrors
// fetch-analytics.sh lines 120-140.
export function parseGa4Pairs(raw: string): Array<{ app: string; propertyId: string }> {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx <= 0) return null;
      const app = pair.slice(0, idx);
      const propertyId = pair.slice(idx + 1);
      if (!/^[A-Za-z0-9_-]+$/.test(app) || !/^\d+$/.test(propertyId)) return null;
      return { app, propertyId };
    })
    .filter((p): p is { app: string; propertyId: string } => p !== null);
}
