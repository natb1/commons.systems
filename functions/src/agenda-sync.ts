// syncAgenda — scheduled Firebase Function that mirrors open jit issues from a
// private GitHub repo into the `agenda/{env}/items` Firestore collection.
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
//         firebase functions:secrets:set AGENDA_GITHUB_APP_PRIVATE_KEY
//   - On each run the function signs a short-lived JWT with that key and
//     exchanges it for a ~1-hour installation access token, which it uses to
//     call the GitHub API. The installation token self-expires; nothing
//     long-lived is stored.
//   - The non-secret strings live in `functions/.env.<project>`, e.g.
//     `functions/.env.commons-systems`:
//         AGENDA_GITHUB_APP_ID=123456
//         AGENDA_GITHUB_APP_INSTALLATION_ID=87654321
//         AGENDA_GROUP_REPO=natb1/agenda-nate
//         AGENDA_MEMBER_EMAILS=owner@example.com
//         AGENDA_FIRESTORE_NAMESPACE=agenda/prod
//     The App must be installed on the `natb1/agenda-nate` repo with read-only
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

const GH_APP_PRIVATE_KEY = defineSecret("AGENDA_GITHUB_APP_PRIVATE_KEY");
const GH_APP_ID = defineString("AGENDA_GITHUB_APP_ID");
const GH_APP_INSTALLATION_ID = defineString("AGENDA_GITHUB_APP_INSTALLATION_ID");
const GROUP_REPO = defineString("AGENDA_GROUP_REPO");
const MEMBER_EMAILS = defineString("AGENDA_MEMBER_EMAILS");
const NAMESPACE = defineString("AGENDA_FIRESTORE_NAMESPACE", { default: "agenda/prod" });

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

export async function syncAgendaCore(deps: {
  fetchOpenJitIssues: () => Promise<JitIssue[]>;
  firestore: Firestore;
  namespace: string;
  memberEmails: string[];
}): Promise<SyncResult> {
  const issues = await deps.fetchOpenJitIssues();

  const itemsPath = `${deps.namespace}/items`;
  const itemsCollection = deps.firestore.collection(itemsPath);
  const batch = deps.firestore.batch();

  const writtenKeys = new Set<string>();
  let written = 0;
  let skippedNoDate = 0;

  for (const issue of issues) {
    if (!issue.dueAt) {
      skippedNoDate += 1;
      console.warn(
        `syncAgenda: issue #${issue.number} has no jit-due marker; skipping`,
      );
      continue;
    }

    const dueAt = Timestamp.fromDate(issue.dueAt);
    const docRef = itemsCollection.doc(issue.jitKey);
    batch.set(docRef, {
      title: issue.title,
      dueAt,
      repo: issue.repo,
      issueNumber: issue.number,
      jitKey: issue.jitKey,
      memberEmails: deps.memberEmails,
      updatedAt: FieldValue.serverTimestamp(),
    });
    writtenKeys.add(issue.jitKey);
    written += 1;
  }

  const existing = await itemsCollection.get();
  let deleted = 0;
  for (const doc of existing.docs) {
    if (!writtenKeys.has(doc.id)) {
      batch.delete(doc.ref);
      deleted += 1;
    }
  }

  await batch.commit();

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
        "User-Agent": "agenda-sync/1.0",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitHub App installation-token exchange failed: ${res.status} ${text}`,
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
      "User-Agent": "agenda-sync/1.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GraphQL request failed: ${res.status} ${text}`);
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

    if (!data.repository.issues.pageInfo.hasNextPage) break;
    cursor = data.repository.issues.pageInfo.endCursor;
  }

  return results;
}

export const syncAgenda = onSchedule(
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
        "syncAgenda: missing required config (AGENDA_GROUP_REPO / AGENDA_MEMBER_EMAILS / AGENDA_GITHUB_APP_ID / AGENDA_GITHUB_APP_INSTALLATION_ID / AGENDA_GITHUB_APP_PRIVATE_KEY); skipping run.",
      );
      return;
    }

    const memberEmails = memberEmailsStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const token = await mintInstallationToken({ appId, installationId, privateKey });

    const firestore = getFirestore(adminApp!);

    const result = await syncAgendaCore({
      fetchOpenJitIssues: () => fetchOpenJitIssuesLive(repo, token),
      firestore,
      namespace,
      memberEmails,
    });

    console.log(
      `syncAgenda: wrote ${result.written}, deleted ${result.deleted}, skipped ${result.skippedNoDate} (no due date)`,
    );
  },
);
