// sampleDispatchQueueMetrics — scheduled Firebase Function that computes the
// dispatch-queue runway metrics from GitHub issue search, writes them to the
// `office-hours/{env}/metrics/dispatch-queue` Firestore snapshot document, and
// appends one `office-hours/{env}/issue-samples/{autoId}` document per run
// carrying the four mutually-exclusive precedence buckets
// (openSecurity / openBug / openEnhancement / openOther) for the
// backlog-history time series.
//
// This is the sampler for the office-hours Queue view: the hosted app cannot run
// `gh`, so the backlog / throughput / runway numbers are computed server-side on
// a schedule (mirroring `syncOfficeHours` in office-hours-sync.ts) and persisted
// to Firestore for the status band to render.
//
// Counts are aggregated (summed) across all repos listed in
// DISPATCH_METRICS_QUEUE_REPO. Three counts are scoped to `label:"help wanted"`
// so inflow, outflow, and backlog compose into a coherent runway:
//   - open:      is:issue is:open label:"help wanted"                         -> openHelpWanted
//   - closed:    is:issue is:closed reason:completed label:"help wanted"
//                closed:>=<today-14d>                                          -> closedPerDay = count / 14
//   - created:   is:issue label:"help wanted" created:>=<today-14d>           -> createdPerDay = count / 14
// The remaining four counts partition the total open set into four
// mutually-exclusive precedence buckets (each negates the higher-priority
// labels) for the backlog-history chart:
//   - security:    is:issue is:open label:"security"                          -> openSecurity
//   - bug:         is:issue is:open label:"bug" -label:"security"             -> openBug
//   - enhancement: is:issue is:open label:"enhancement" -label:"bug"
//                  -label:"security"                                          -> openEnhancement
//   - other:       is:issue is:open -label:"enhancement" -label:"bug"
//                  -label:"security"                                          -> openOther
// The four precedence buckets are mutually exclusive and exhaustive, so they
// sum to the total open count. `openHelpWanted` is an orthogonal, overlapping
// count that feeds only the runway. `reason:completed` excludes not-planned /
// duplicate closes.
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
//   each repo you want sampled, with read-only `Issues` permission. There is one
//   installation per account, so this reuses the existing installation id — no
//   new installation, no new private key. Then set the non-secret config var
//   `DISPATCH_METRICS_QUEUE_REPO` to a comma-separated list of `owner/name` repos
//   (e.g. `natb1/commons.systems` or `natb1/commons.systems,natb1/other-repo`);
//   counts are summed across all listed repos. Also set `OFFICE_HOURS_GROUP_ID`.
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
import { mintInstallationToken } from "./office-hours-sync.js";
import { truncateForLog } from "./log-utils.js";
import { sampleDispatchQueueCore, type ParkedIssue } from "./dispatch-queue-metrics-core.js";

export { buildQueueSearchQueries, computeQueueMetrics, buildOfficeHoursQuery, sampleDispatchQueueCore } from "./dispatch-queue-metrics-core.js";
export type { QueueSearchQueries, ComputedQueueMetrics, ParkedIssue } from "./dispatch-queue-metrics-core.js";

// Reuse the SAME param names as office-hours-sync.ts so firebase-functions
// dedupes them across modules (params are keyed by name).
const GH_APP_PRIVATE_KEY = defineSecret("OFFICE_HOURS_GITHUB_APP_PRIVATE_KEY");
const GH_APP_ID = defineString("OFFICE_HOURS_GITHUB_APP_ID");
const GH_APP_INSTALLATION_ID = defineString("OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID");
const MEMBER_EMAILS = defineSecret("OFFICE_HOURS_MEMBER_EMAILS");
const NAMESPACE = defineString("OFFICE_HOURS_FIRESTORE_NAMESPACE", { default: "office-hours/prod" });

// New config vars, empty by default so the function deploys dormant until
// provisioned (an empty DISPATCH_METRICS_QUEUE_REPO trips the first guard).
const QUEUE_REPO = defineString("DISPATCH_METRICS_QUEUE_REPO");
const GROUP_ID = defineString("OFFICE_HOURS_GROUP_ID");

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp();

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface SearchCountResponse {
  search: { issueCount: number };
}

interface SearchDetailsResponse {
  search: {
    nodes: Array<{
      number: number;
      title: string;
      url: string;
      createdAt: string;
      labels: { nodes: Array<{ name: string }> };
      repository: { nameWithOwner: string };
    }>;
  };
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

// Posts a single GraphQL `search(... type: ISSUE) { nodes { ... } }` query and
// maps each issue node to a ParkedIssue. Same fetch/auth/error-handling shape as
// searchIssueCountLive, but fetches node details instead of a count. Single page
// (first: 100, no pagination loop): a parked queue over 100 is pathological and
// truncation is acceptable. `query` is bound as the $query GraphQL variable (not
// interpolated) so it cannot inject into the query body.
export async function searchIssueDetailsLive(
  token: string,
  query: string,
): Promise<ParkedIssue[]> {
  const gql = `
    query($query: String!) { # // type-safety-ok: GraphQL non-null type annotation, not a TypeScript assertion
      search(query: $query, type: ISSUE, first: 100) {
        nodes {
          ... on Issue {
            number
            title
            url
            createdAt
            labels(first: 20) { nodes { name } }
            repository { nameWithOwner }
          }
        }
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

  const json = (await res.json()) as GraphQLResponse<SearchDetailsResponse>; // type-safety-ok: res.json() returns unknown; cast matches documented GraphQL response schema
  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `GitHub GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!json.data) {
    throw new Error("GitHub GraphQL response missing data");
  }

  return json.data.search.nodes.map((node) => {
    // Best-effort dispatch phase: the first dispatch:* label other than
    // dispatch:office-hours (which is the bucket itself, not a phase).
    const phase = node.labels.nodes
      .map((l) => l.name)
      .find((n) => n.startsWith("dispatch:") && n !== "dispatch:office-hours");
    return {
      number: node.number,
      title: node.title,
      url: node.url,
      // GitHub returns createdAt as an ISO string; the app's toDate helper
      // returns null for strings, so it MUST be a real Date on the wire.
      createdAt: new Date(node.createdAt),
      repo: node.repository.nameWithOwner,
      // Omit phase entirely when absent — firebase-admin rejects an explicit
      // undefined in a written document.
      ...(phase ? { phase } : {}),
    };
  });
}

export const sampleDispatchQueueMetrics = onSchedule(
  {
    schedule: "every 60 minutes",
    secrets: [GH_APP_PRIVATE_KEY, MEMBER_EMAILS],
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

    // DISPATCH_METRICS_QUEUE_REPO is a comma-separated repo list. Parse it into
    // trimmed, non-empty owner/name entries; each is interpolated into a GitHub
    // search query, so require owner/name so a misconfigured value cannot build a
    // malformed or unexpected query.
    const queueRepos = queueRepo
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (queueRepos.length === 0) {
      console.error(
        `sampleDispatchQueueMetrics: DISPATCH_METRICS_QUEUE_REPO "${queueRepo}" resolved to an empty repo list; skipping run.`,
      );
      return;
    }

    for (const r of queueRepos) {
      const slash = r.indexOf("/");
      if (slash <= 0 || slash === r.length - 1 || r.indexOf("/", slash + 1) !== -1) {
        console.error(
          `sampleDispatchQueueMetrics: DISPATCH_METRICS_QUEUE_REPO entry "${r}" is not a valid owner/name; skipping run.`,
        );
        return;
      }
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
        searchIssueDetails: (query) => searchIssueDetailsLive(token, query),
        firestore,
        namespace,
        queueRepos,
        groupId,
        memberEmails,
        now: new Date(),
      });

      console.log(
        `sampleDispatchQueueMetrics: wrote ${namespace}/metrics/dispatch-queue for ${queueRepos.join(",")}`,
      );
    } catch (err) {
      console.error(
        `sampleDispatchQueueMetrics: sampling run failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }
  },
);
