// syncOfficeHours — scheduled Firebase Function that mirrors open jit issues from
// a private GitHub repo into the `office-hours/{env}/items` Firestore collection.
//
// Each jit issue's due time is encoded in the issue body as a hidden HTML
// comment of the form `<!-- jit-due: <ISO8601 UTC> -->`, stamped by the JIT
// engine (.claude/skills/dispatch/scripts/dispatch-jit-engine) at creation.
// This function parses that marker and writes one Firestore document per
// reminder. The GitHub project's `Due` field is not used.
//
// Authentication — GitHub App, not a personal access token:
//   - The App's private key (PEM) is the only Functions secret. It does not
//     expire, so there is no token to rotate on a cadence. Set it once per
//     project via the interactive prompt (paste the full PEM):
//         firebase functions:secrets:set OFFICE_HOURS_GITHUB_APP_PRIVATE_KEY
//   - On each run the function signs a short-lived JWT with that key and
//     exchanges it for a ~1-hour installation access token, which it uses to
//     call the GitHub API. The installation token self-expires; nothing
//     long-lived is stored.
//   - The non-secret strings live in `functions/.env.<project>`, e.g.
//     `functions/.env.commons-systems`:
//         OFFICE_HOURS_GITHUB_APP_ID=123456
//         OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID=87654321
//         OFFICE_HOURS_GROUP_REPO=natb1/office-hours-nate
//         OFFICE_HOURS_MEMBER_EMAILS=owner@example.com
//         OFFICE_HOURS_FIRESTORE_NAMESPACE=office-hours/prod
//     The App must be installed on the `natb1/office-hours-nate` repo with read-only
//     `Issues` permission.
//   - If a required param is missing the function logs an error and returns
//     normally so the schedule keeps running cheaply on misconfigured
//     environments (throwing would generate paid alerting noise).
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret, defineString } from "firebase-functions/params";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { createSign } from "node:crypto";

const GH_APP_PRIVATE_KEY = defineSecret("OFFICE_HOURS_GITHUB_APP_PRIVATE_KEY");
const GH_APP_ID = defineString("OFFICE_HOURS_GITHUB_APP_ID");
const GH_APP_INSTALLATION_ID = defineString("OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID");
const GROUP_REPO = defineString("OFFICE_HOURS_GROUP_REPO");
const MEMBER_EMAILS = defineString("OFFICE_HOURS_MEMBER_EMAILS");
const NAMESPACE = defineString("OFFICE_HOURS_FIRESTORE_NAMESPACE", { default: "office-hours/prod" });

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp();

export interface JitIssue {
  number: number;
  title: string;
  body: string;
  jitKey: string;
  repo: string;
  dueAt: Date | null;
}

export interface SyncResult {
  written: number;
  deleted: number;
  skippedNoDate: number;
}

// Matches the marker written by dispatch-jit-engine:
//   <!-- jit-due: 2026-01-01T12:00:00Z -->
// Whitespace tolerance keeps this resilient to incidental editor reformatting.
const JIT_DUE_RE =
  /<!--\s*jit-due:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s*-->/;

export function parseJitDueMarker(body: string): Date | null {
  const match = body.match(JIT_DUE_RE);
  if (!match) return null;
  const date = new Date(match[1]);
  return Number.isNaN(date.getTime()) ? null : date;
}

// A jitKey is the `jit:<key>` label suffix and becomes a Firestore document ID.
// The label name is external input from the scanned repo, so guard it: a key
// containing a slash would make `collection.doc(key)` resolve to a nested path
// outside the items collection, and empty / `.` / `..` keys are invalid IDs.
// Keys the JIT engine emits (e.g. `daily-chore`, `budget-review`) match this.
const JIT_KEY_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function isValidJitKey(key: string): boolean {
  return JIT_KEY_RE.test(key);
}

// Truncates a third-party HTTP response body before it enters an Error message
// (and thus the function logs). Bounds the blast radius of a verbose or
// reflected GitHub error response without dropping the leading diagnostic text.
function truncateForLog(text: string, max = 200): string {
  return text.length > max ? `${text.slice(0, max)}…[truncated]` : text;
}

export async function syncOfficeHoursCore(deps: {
  fetchOpenJitIssues: () => Promise<JitIssue[]>;
  firestore: Firestore;
  namespace: string;
  memberEmails: string[];
}): Promise<SyncResult> {
  const issues = await deps.fetchOpenJitIssues();

  const itemsPath = `${deps.namespace}/items`;
  const itemsCollection = deps.firestore.collection(itemsPath);
  const writer = deps.firestore.bulkWriter();
  const writes: Promise<unknown>[] = [];

  const writtenKeys = new Set<string>();
  let written = 0;
  let skippedNoDate = 0;

  for (const issue of issues) {
    if (!isValidJitKey(issue.jitKey)) {
      console.warn(
        `syncOfficeHours: issue #${issue.number} has invalid jitKey "${issue.jitKey}"; skipping`,
      );
      continue;
    }

    if (!issue.dueAt) {
      skippedNoDate += 1;
      console.warn(
        `syncOfficeHours: issue #${issue.number} has no jit-due marker; skipping`,
      );
      continue;
    }

    const dueAt = Timestamp.fromDate(issue.dueAt);
    const docRef = itemsCollection.doc(issue.jitKey);
    writes.push(
      writer.set(docRef, {
        title: issue.title,
        dueAt,
        repo: issue.repo,
        issueNumber: issue.number,
        jitKey: issue.jitKey,
        memberEmails: deps.memberEmails,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );
    writtenKeys.add(issue.jitKey);
    written += 1;
  }

  const existing = await itemsCollection.get();
  let deleted = 0;
  for (const doc of existing.docs) {
    if (!writtenKeys.has(doc.id)) {
      writes.push(writer.delete(doc.ref));
      deleted += 1;
    }
  }

  await writer.close(); // flushes all enqueued writes in ≤500-op chunks
  await Promise.all(writes); // BulkWriter routes per-op failures to the individual op promises, not to close(); this is what re-raises them

  return { written, deleted, skippedNoDate };
}

// Builds a GitHub App JWT (RS256) signed with the App's private key. GitHub
// caps the lifetime at 10 minutes; we use 9 and backdate `iat` by 60s to
// tolerate clock skew between this runtime and GitHub.
export function buildAppJwt(
  appId: string,
  privateKey: string,
  nowMs: number = Date.now(),
): string {
  const iat = Math.floor(nowMs / 1000) - 60;
  const exp = iat + 9 * 60;
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iat, exp, iss: appId }),
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(privateKey)
    .toString("base64url");
  return `${signingInput}.${signature}`;
}

// Exchanges an App JWT for a short-lived (~1h) installation access token, which
// is what the GraphQL queries authenticate with. Minted fresh every run.
export async function mintInstallationToken(opts: {
  appId: string;
  installationId: string;
  privateKey: string;
  nowMs?: number;
}): Promise<string> {
  const jwt = buildAppJwt(opts.appId, opts.privateKey, opts.nowMs);
  const res = await fetch(
    `https://api.github.com/app/installations/${opts.installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "office-hours-sync/1.0",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitHub App installation-token exchange failed: ${res.status} ${truncateForLog(text)}`,
    );
  }

  const json = (await res.json()) as { token?: string };
  if (!json.token) {
    throw new Error("GitHub App installation-token response missing token");
  }
  return json.token;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface IssuesQueryResponse {
  repository: {
    issues: {
      pageInfo: { endCursor: string | null; hasNextPage: boolean };
      nodes: Array<{
        number: number;
        title: string;
        body: string;
        labels: { nodes: Array<{ name: string }> };
      }>;
    };
  };
}

async function githubGraphQL<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "User-Agent": "office-hours-sync/1.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitHub GraphQL request failed: ${res.status} ${truncateForLog(text)}`,
    );
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `GitHub GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!json.data) {
    throw new Error("GitHub GraphQL response missing data");
  }
  return json.data;
}

export async function fetchOpenJitIssuesLive(
  repo: string,
  token: string,
): Promise<JitIssue[]> {
  const slash = repo.indexOf("/");
  if (slash <= 0 || slash === repo.length - 1) {
    throw new Error(`Invalid repo "${repo}"; expected "owner/name"`);
  }
  const owner = repo.slice(0, slash);
  const name = repo.slice(slash + 1);

  const query = `
    query($owner: String!, $name: String!, $cursor: String) {
      repository(owner: $owner, name: $name) {
        issues(states: OPEN, first: 100, after: $cursor) {
          pageInfo { endCursor hasNextPage }
          nodes {
            number
            title
            body
            labels(first: 20) { nodes { name } }
          }
        }
      }
    }
  `;

  const results: JitIssue[] = [];
  let cursor: string | null = null;

  while (true) {
    const data: IssuesQueryResponse = await githubGraphQL<IssuesQueryResponse>(
      token,
      query,
      { owner, name, cursor },
    );

    for (const node of data.repository.issues.nodes) {
      const jitLabel = node.labels.nodes.find((l) => l.name.startsWith("jit:"));
      if (!jitLabel) continue;
      results.push({
        number: node.number,
        title: node.title,
        body: node.body,
        jitKey: jitLabel.name.slice("jit:".length),
        repo,
        dueAt: parseJitDueMarker(node.body),
      });
    }

    const { hasNextPage, endCursor } = data.repository.issues.pageInfo;
    if (!hasNextPage || !endCursor) break;
    cursor = endCursor;
  }

  return results;
}

export const syncOfficeHours = onSchedule(
  {
    schedule: "every 30 minutes",
    secrets: [GH_APP_PRIVATE_KEY],
    timeoutSeconds: 120,
  },
  async () => {
    const repo = GROUP_REPO.value();
    const memberEmailsStr = MEMBER_EMAILS.value();
    const namespace = NAMESPACE.value();
    const appId = GH_APP_ID.value();
    const installationId = GH_APP_INSTALLATION_ID.value();
    const privateKey = GH_APP_PRIVATE_KEY.value();

    if (!repo || !memberEmailsStr || !appId || !installationId || !privateKey) {
      console.error(
        "syncOfficeHours: missing required config (OFFICE_HOURS_GROUP_REPO / OFFICE_HOURS_MEMBER_EMAILS / OFFICE_HOURS_GITHUB_APP_ID / OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID / OFFICE_HOURS_GITHUB_APP_PRIVATE_KEY); skipping run.",
      );
      return;
    }

    // installationId is interpolated into the token-exchange URL path; require a
    // bare numeric id so a misconfigured value cannot redirect the request.
    if (!/^\d+$/.test(installationId)) {
      console.error(
        `syncOfficeHours: OFFICE_HOURS_GITHUB_APP_INSTALLATION_ID "${installationId}" is not numeric; skipping run.`,
      );
      return;
    }

    // namespace prefixes the Firestore collection path. Pin it to the office-hours
    // app so a misconfigured value cannot write into another app's collection.
    if (!/^office-hours\/[A-Za-z0-9][A-Za-z0-9-]*$/.test(namespace)) {
      console.error(
        `syncOfficeHours: OFFICE_HOURS_FIRESTORE_NAMESPACE "${namespace}" is not a valid office-hours/<env> path; skipping run.`,
      );
      return;
    }

    const memberEmails = memberEmailsStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // A whitespace-only OFFICE_HOURS_MEMBER_EMAILS survives the truthy check above
    // but trims to an empty owner list, which would lock the owner out of every
    // written document — fail closed instead of writing unreadable data.
    if (memberEmails.length === 0) {
      console.error(
        "syncOfficeHours: OFFICE_HOURS_MEMBER_EMAILS resolved to an empty list; skipping run.",
      );
      return;
    }

    const token = await mintInstallationToken({ appId, installationId, privateKey });

    const firestore = getFirestore(adminApp!);

    const result = await syncOfficeHoursCore({
      fetchOpenJitIssues: () => fetchOpenJitIssuesLive(repo, token),
      firestore,
      namespace,
      memberEmails,
    });

    console.log(
      `syncOfficeHours: wrote ${result.written}, deleted ${result.deleted}, skipped ${result.skippedNoDate} (no due date)`,
    );
  },
);
