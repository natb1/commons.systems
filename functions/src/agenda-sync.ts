// syncAgenda — scheduled Firebase Function that mirrors open jit issues from a
// private GitHub repo into the `agenda/{env}/items` Firestore collection.
//
// Each jit issue's due time is encoded in the issue body as a hidden HTML
// comment of the form `<!-- jit-due: <ISO8601 UTC> -->`, stamped by the JIT
// engine (.claude/skills/dispatch/scripts/dispatch-jit-engine) at creation.
// This function parses that marker and writes one Firestore document per
// reminder. The GitHub project's `Due` field is not used.
//
// Deployment-time setup:
//   - The GitHub token is a Functions secret. Set it once per project via the
//     interactive prompt:
//         firebase functions:secrets:set AGENDA_GITHUB_TOKEN
//   - The non-secret strings live in `functions/.env.<project>`, e.g.
//     `functions/.env.commons-systems`:
//         AGENDA_HOUSEHOLD_REPO=natb1/household
//         AGENDA_MEMBER_EMAILS=owner@example.com
//         AGENDA_FIRESTORE_NAMESPACE=agenda/prod
//   - If a required param is missing the function logs an error and returns
//     normally so the schedule keeps running cheaply on misconfigured
//     environments (throwing would generate paid alerting noise).
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret, defineString } from "firebase-functions/params";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

const GH_TOKEN = defineSecret("AGENDA_GITHUB_TOKEN");
const HOUSEHOLD_REPO = defineString("AGENDA_HOUSEHOLD_REPO");
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
    secrets: [GH_TOKEN],
    timeoutSeconds: 120,
  },
  async () => {
    const repo = HOUSEHOLD_REPO.value();
    const memberEmailsStr = MEMBER_EMAILS.value();
    const namespace = NAMESPACE.value();
    const token = GH_TOKEN.value();

    if (!repo || !memberEmailsStr || !token) {
      console.error(
        "syncAgenda: missing required config (AGENDA_HOUSEHOLD_REPO / AGENDA_MEMBER_EMAILS / AGENDA_GITHUB_TOKEN); skipping run.",
      );
      return;
    }

    const memberEmails = memberEmailsStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

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
