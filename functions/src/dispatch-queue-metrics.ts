// sampleDispatchQueueMetrics — scheduled Firebase Function that computes the
// dispatch-queue runway metrics from GitHub issue search and writes them to the
// `office-hours/{env}/metrics/dispatch-queue` Firestore snapshot document.
//
// This is the sampler for the office-hours Queue view: the hosted app cannot run
// `gh`, so the backlog / throughput / runway numbers are computed server-side on
// a schedule (mirroring `syncOfficeHours` in office-hours-sync.ts) and persisted
// to Firestore for the status band to render.
//
// All three counts are scoped to `label:"help wanted"` so inflow, outflow, and
// backlog compose into a coherent runway:
//   - open:    is:issue is:open label:"help wanted"                         -> openHelpWanted
//   - closed:  is:issue is:closed reason:completed label:"help wanted"
//              closed:>=<today-14d>                                          -> closedPerDay = count / 14
//   - created: is:issue label:"help wanted" created:>=<today-14d>           -> createdPerDay = count / 14
// `reason:completed` excludes not-planned / duplicate closes.
//
// Authentication — reuses the syncOfficeHours GitHub App auth:
//   - The same GitHub App, JWT -> installation-token exchange, and private-key
//     secret as office-hours-sync.ts. `mintInstallationToken` is imported, not
//     re-implemented, and the config params share the same NAMES so
//     firebase-functions dedupes them.
//
// SETUP STEP (acceptance criterion — a one-time manual provisioning step):
//   The GitHub App is currently installed only on the office-hours group repo
//   (`natb1/office-hours-nate`). To let this sampler search the dispatch queue,
//   extend that SAME installation's repository access to additionally include
//   `natb1/commons.systems` with read-only `Issues` permission. There is one
//   installation per account, so this reuses the existing installation id — no
//   new installation, no new private key. Then set the non-secret config var
//   `DISPATCH_METRICS_QUEUE_REPO=natb1/commons.systems` (and `OFFICE_HOURS_GROUP_ID`).
//   Until those vars are set the function deploys dormant: the config guard logs
//   one line and returns without any GitHub call.
//
//   - If a required param is missing/invalid, or the live GitHub/Firestore run
//     hits an outage, the function logs one diagnostic and returns normally so
//     the schedule keeps running cheaply (throwing would generate paid alerting
//     noise) — matching syncOfficeHours and dispatch-refresh-rate-limits.
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret, defineString } from "firebase-functions/params";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { mintInstallationToken } from "./office-hours-sync.js";

// Reuse the SAME param names as office-hours-sync.ts so firebase-functions
// dedupes them across modules (params are keyed by name).
const GH_APP_PRIVATE_KEY = defineSecret("OFFICE_HOURS_GITHUB_APP_PRIVATE_KEY");
const GH_APP_ID = defineString("OFFICE_HOURS_GITHUB_APP_ID");
const GH_APP_INSTALLATION_ID = defineString("OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID");
const MEMBER_EMAILS = defineString("OFFICE_HOURS_MEMBER_EMAILS");
const NAMESPACE = defineString("OFFICE_HOURS_FIRESTORE_NAMESPACE", { default: "office-hours/prod" });

// New config vars, empty by default so the function deploys dormant until
// provisioned (an empty DISPATCH_METRICS_QUEUE_REPO trips the first guard).
const QUEUE_REPO = defineString("DISPATCH_METRICS_QUEUE_REPO");
const GROUP_ID = defineString("OFFICE_HOURS_GROUP_ID");

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp();

const WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface QueueSearchQueries {
  open: string;
  closed: string;
  created: string;
}

// Builds the three GitHub issue-search query strings. `now` is injected so tests
// pin the 14-day cutoff date deterministically. The cutoff is the YYYY-MM-DD
// date 14 days before `now` (UTC).
export function buildQueueSearchQueries(queueRepo: string, now: Date): QueueSearchQueries {
  const cutoff = new Date(now.getTime() - WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10);
  return {
    open: `repo:${queueRepo} is:issue is:open label:"help wanted"`,
    closed: `repo:${queueRepo} is:issue is:closed reason:completed label:"help wanted" closed:>=${cutoff}`,
    created: `repo:${queueRepo} is:issue label:"help wanted" created:>=${cutoff}`,
  };
}

export interface ComputedQueueMetrics {
  closedPerDay: number;
  createdPerDay: number;
  netDrainPerDay: number;
  runwayDays: number | null;
}

// Pure arithmetic. `runwayDays` is null when the queue is flat or growing
// (netDrainPerDay <= 0) so it is never negative or infinite.
export function computeQueueMetrics(input: {
  openHelpWanted: number;
  closedCount: number;
  createdCount: number;
  windowDays: number;
}): ComputedQueueMetrics {
  const closedPerDay = input.closedCount / input.windowDays;
  const createdPerDay = input.createdCount / input.windowDays;
  const netDrainPerDay = closedPerDay - createdPerDay;
  const runwayDays = netDrainPerDay > 0 ? input.openHelpWanted / netDrainPerDay : null;
  return { closedPerDay, createdPerDay, netDrainPerDay, runwayDays };
}

// Truncates a third-party HTTP response body before it enters an Error message
// (and thus the function logs). Mirrors the helper in office-hours-sync.ts,
// which is not exported.
function truncateForLog(text: string, max = 200): string {
  return text.length > max ? `${text.slice(0, max)}…[truncated]` : text;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface SearchCountResponse {
  search: { issueCount: number };
}

// Posts a single GraphQL `search(... type: ISSUE) { issueCount }` query and
// returns the count. Throws on non-OK HTTP and on GraphQL `errors`. Mirrors the
// local githubGraphQL helper in office-hours-sync.ts (which is not exported).
export async function searchIssueCountLive(token: string, query: string): Promise<number> {
  const gql = `
    query($query: String!) {
      search(query: $query, type: ISSUE) {
        issueCount
      }
    }
  `;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "User-Agent": "dispatch-queue-metrics/1.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: gql, variables: { query } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitHub GraphQL request failed: ${res.status} ${truncateForLog(text)}`,
    );
  }

  const json = (await res.json()) as GraphQLResponse<SearchCountResponse>;
  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `GitHub GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!json.data) {
    throw new Error("GitHub GraphQL response missing data");
  }
  return json.data.search.issueCount;
}

// Runs the three searches via the injected `searchIssueCount`, computes the
// snapshot, and writes the field map to `${namespace}/metrics/dispatch-queue`.
// The field map matches office-hours/src/queue-metrics.ts exactly.
export async function sampleDispatchQueueCore(deps: {
  searchIssueCount: (query: string) => Promise<number>;
  firestore: Firestore;
  namespace: string;
  queueRepo: string;
  groupId: string;
  memberEmails: string[];
  now: Date;
}): Promise<void> {
  const queries = buildQueueSearchQueries(deps.queueRepo, deps.now);

  const openHelpWanted = await deps.searchIssueCount(queries.open);
  const closedCount = await deps.searchIssueCount(queries.closed);
  const createdCount = await deps.searchIssueCount(queries.created);

  const { closedPerDay, createdPerDay, netDrainPerDay, runwayDays } = computeQueueMetrics({
    openHelpWanted,
    closedCount,
    createdCount,
    windowDays: WINDOW_DAYS,
  });

  const docRef = deps.firestore.doc(`${deps.namespace}/metrics/dispatch-queue`);
  await docRef.set({
    openHelpWanted,
    closedPerDay,
    createdPerDay,
    netDrainPerDay,
    runwayDays,
    windowDays: WINDOW_DAYS,
    computedAt: deps.now,
    groupId: deps.groupId,
    memberEmails: deps.memberEmails,
  });
}

export const sampleDispatchQueueMetrics = onSchedule(
  {
    schedule: "every 60 minutes",
    secrets: [GH_APP_PRIVATE_KEY],
    timeoutSeconds: 120,
  },
  async () => {
    const queueRepo = QUEUE_REPO.value();
    const groupId = GROUP_ID.value();
    const memberEmailsStr = MEMBER_EMAILS.value();
    const namespace = NAMESPACE.value();
    const appId = GH_APP_ID.value();
    const installationId = GH_APP_INSTALLATION_ID.value();
    const privateKey = GH_APP_PRIVATE_KEY.value();

    if (!queueRepo || !groupId || !memberEmailsStr || !appId || !installationId || !privateKey) {
      console.error(
        "sampleDispatchQueueMetrics: missing required config (DISPATCH_METRICS_QUEUE_REPO / OFFICE_HOURS_GROUP_ID / OFFICE_HOURS_MEMBER_EMAILS / OFFICE_HOURS_GITHUB_APP_ID / OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID / OFFICE_HOURS_GITHUB_APP_PRIVATE_KEY); skipping run.",
      );
      return;
    }

    // queueRepo is interpolated into the GitHub search query. Require owner/name
    // so a misconfigured value cannot build a malformed or unexpected query.
    const slash = queueRepo.indexOf("/");
    if (slash <= 0 || slash === queueRepo.length - 1 || queueRepo.indexOf("/", slash + 1) !== -1) {
      console.error(
        `sampleDispatchQueueMetrics: DISPATCH_METRICS_QUEUE_REPO "${queueRepo}" is not a valid owner/name; skipping run.`,
      );
      return;
    }

    // installationId is interpolated into the token-exchange URL path; require a
    // bare numeric id so a misconfigured value cannot redirect the request.
    if (!/^\d+$/.test(installationId)) {
      console.error(
        `sampleDispatchQueueMetrics: OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID "${installationId}" is not numeric; skipping run.`,
      );
      return;
    }

    // namespace prefixes the Firestore collection path. Pin it to the office-hours
    // app so a misconfigured value cannot write into another app's collection.
    if (!/^office-hours\/[A-Za-z0-9][A-Za-z0-9-]*$/.test(namespace)) {
      console.error(
        `sampleDispatchQueueMetrics: OFFICE_HOURS_FIRESTORE_NAMESPACE "${namespace}" is not a valid office-hours/<env> path; skipping run.`,
      );
      return;
    }

    const memberEmails = memberEmailsStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // A whitespace-only OFFICE_HOURS_MEMBER_EMAILS survives the truthy check above
    // but trims to an empty owner list, which would lock the owner out of the
    // written document — fail closed instead of writing unreadable data.
    if (memberEmails.length === 0) {
      console.error(
        "sampleDispatchQueueMetrics: OFFICE_HOURS_MEMBER_EMAILS resolved to an empty list; skipping run.",
      );
      return;
    }

    // Wrap the live GitHub/Firestore run so an outage logs one diagnostic and
    // returns without throwing (matching dispatch-refresh-rate-limits).
    try {
      const token = await mintInstallationToken({ appId, installationId, privateKey });
      const firestore = getFirestore(adminApp!);

      await sampleDispatchQueueCore({
        searchIssueCount: (query) => searchIssueCountLive(token, query),
        firestore,
        namespace,
        queueRepo,
        groupId,
        memberEmails,
        now: new Date(),
      });

      console.log(
        `sampleDispatchQueueMetrics: wrote ${namespace}/metrics/dispatch-queue for ${queueRepo}`,
      );
    } catch (err) {
      console.error(
        `sampleDispatchQueueMetrics: sampling run failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }
  },
);
