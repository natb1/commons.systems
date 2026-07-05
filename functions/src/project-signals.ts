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
//        PROJECT_SIGNALS_GA4_PROPERTY_ID      — the single numeric GA4 property id
//        PROJECT_SIGNALS_GA4_HOST_APPS        — "host:app,host:app,..." mapping each
//                                               web-stream hostName to an app label
//                                               (e.g. commons.systems:commons,
//                                               budget.commons.systems:budget)
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
import { mintInstallationToken } from "./office-hours-sync.js";
import {
  fetchGithubStatsLive,
  fetchGithubTrafficLive,
  fetchGoogleAccessTokenLive,
  fetchGa4Live,
  fetchGscLive,
  fetchPsiLive,
  collectProjectSignalsCore,
  isValidOwnerName,
  isValidGscSite,
  isValidPsiUrl,
  parseGa4HostApps,
  type GithubSignals,
  type Ga4AppSignals,
  type GscSignals,
  type PsiUrlSignals,
  type CollectProjectSignalsDeps,
} from "./project-signals-core.js";

export * from "./project-signals-core.js";

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
const GA4_PROPERTY_ID = defineString("PROJECT_SIGNALS_GA4_PROPERTY_ID"); // single numeric GA4 property id
const GA4_HOST_APPS = defineString("PROJECT_SIGNALS_GA4_HOST_APPS"); // "host:app,host:app,..." (e.g. commons.systems:commons,budget.commons.systems:budget)
const GSC_SITE = defineString("PROJECT_SIGNALS_GSC_SITE", { default: "sc-domain:commons.systems" });

// PSI. Keyless by default; the key only raises the rate limit.
const PAGESPEED_API_KEY = defineSecret("PAGESPEED_API_KEY");
const PSI_URLS = defineString("PROJECT_SIGNALS_PSI_URLS", {
  default:
    "https://commons.systems,https://budget.commons.systems,https://print.commons.systems,https://audio.commons.systems,https://fellspiral.commons.systems",
});
const PSI_STRATEGY = defineString("PROJECT_SIGNALS_PSI_STRATEGY", { default: "mobile" });

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp();

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
    const ga4PropertyId = GA4_PROPERTY_ID.value();
    const ga4HostApps = parseGa4HostApps(GA4_HOST_APPS.value());
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

      if (!/^\d+$/.test(ga4PropertyId)) {
        console.log("collectProjectSignals: skipping ga4: missing/invalid PROJECT_SIGNALS_GA4_PROPERTY_ID");
      } else if (ga4HostApps.length === 0) {
        console.log("collectProjectSignals: skipping ga4: no valid host:app entries configured");
      } else {
        fetchGa4 = async (): Promise<Ga4AppSignals[]> => {
          const token = await googleToken();
          return fetchGa4Live(fetchFn, token, ga4PropertyId, ga4HostApps);
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
