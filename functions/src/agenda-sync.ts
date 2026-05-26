// syncAgenda — scheduled Firebase Function that mirrors open jit issues from a
// private GitHub repo into the `agenda/{env}/items` Firestore collection.
//
// Deployment-time setup:
//   - The GitHub token is a Functions secret. Set it once per project via the
//     interactive prompt:
//         firebase functions:secrets:set AGENDA_GITHUB_TOKEN
//   - The non-secret strings live in `functions/.env.<project>`, e.g.
//     `functions/.env.commons-systems-prod`:
//         AGENDA_HOUSEHOLD_REPO=natb1/household
//         AGENDA_PROJECT_OWNER=natb1
//         AGENDA_PROJECT_NUMBER=5
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
const PROJECT_OWNER = defineString("AGENDA_PROJECT_OWNER");
const PROJECT_NUMBER = defineString("AGENDA_PROJECT_NUMBER");
const MEMBER_EMAILS = defineString("AGENDA_MEMBER_EMAILS");
const NAMESPACE = defineString("AGENDA_FIRESTORE_NAMESPACE", { default: "agenda/prod" });

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp();

export interface JitIssue {
  number: number;
  title: string;
  body: string;
  jitKey: string;
  repo: string;
}

export interface SyncResult {
  written: number;
  deleted: number;
  skippedNoDate: number;
}

export async function syncAgendaCore(deps: {
  fetchOpenJitIssues: () => Promise<JitIssue[]>;
  fetchProjectDueDates: (issueNumbers: number[]) => Promise<Map<number, string>>;
  firestore: Firestore;
  namespace: string;
  memberEmails: string[];
}): Promise<SyncResult> {
  const issues = await deps.fetchOpenJitIssues();
  const dueDates = await deps.fetchProjectDueDates(issues.map((i) => i.number));

  const itemsPath = `${deps.namespace}/items`;
  const itemsCollection = deps.firestore.collection(itemsPath);
  const batch = deps.firestore.batch();

  const writtenKeys = new Set<string>();
  let written = 0;
  let skippedNoDate = 0;

  for (const issue of issues) {
    const date = dueDates.get(issue.number);
    if (!date) {
      skippedNoDate += 1;
      console.warn(`syncAgenda: issue #${issue.number} has no Due date; skipping`);
      continue;
    }

    const dueAt = Timestamp.fromDate(new Date(`${date}T00:00:00Z`));
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
      });
    }

    if (!data.repository.issues.pageInfo.hasNextPage) break;
    cursor = data.repository.issues.pageInfo.endCursor;
  }

  return results;
}

interface ProjectQueryResponse {
  user: {
    projectV2: {
      items: {
        pageInfo: { endCursor: string | null; hasNextPage: boolean };
        nodes: Array<{
          content: { number?: number } | null;
          fieldValueByName: { date?: string } | null;
        }>;
      };
    } | null;
  } | null;
}

export async function fetchProjectDueDatesLive(
  owner: string,
  projectNumber: number,
  token: string,
  issueNumbers: number[],
): Promise<Map<number, string>> {
  const wanted = new Set(issueNumbers);
  const result = new Map<number, string>();

  if (wanted.size === 0) return result;

  const query = `
    query($owner: String!, $number: Int!, $cursor: String) {
      user(login: $owner) {
        projectV2(number: $number) {
          items(first: 100, after: $cursor) {
            pageInfo { endCursor hasNextPage }
            nodes {
              content {
                ... on Issue { number }
              }
              fieldValueByName(name: "Due") {
                ... on ProjectV2ItemFieldDateValue { date }
              }
            }
          }
        }
      }
    }
  `;

  let cursor: string | null = null;

  while (true) {
    const data: ProjectQueryResponse = await githubGraphQL<ProjectQueryResponse>(
      token,
      query,
      { owner, number: projectNumber, cursor },
    );

    const project = data.user?.projectV2;
    if (!project) {
      throw new Error(
        `GitHub project not found: user="${owner}" number=${projectNumber}`,
      );
    }

    for (const node of project.items.nodes) {
      const num = node.content?.number;
      const date = node.fieldValueByName?.date;
      if (typeof num === "number" && date && wanted.has(num)) {
        result.set(num, date);
      }
    }

    if (!project.items.pageInfo.hasNextPage) break;
    cursor = project.items.pageInfo.endCursor;
  }

  return result;
}

export const syncAgenda = onSchedule(
  {
    schedule: "every 30 minutes",
    secrets: [GH_TOKEN],
    timeoutSeconds: 120,
  },
  async () => {
    const repo = HOUSEHOLD_REPO.value();
    const owner = PROJECT_OWNER.value();
    const projectNumberStr = PROJECT_NUMBER.value();
    const memberEmailsStr = MEMBER_EMAILS.value();
    const namespace = NAMESPACE.value();
    const token = GH_TOKEN.value();

    if (!repo || !owner || !projectNumberStr || !memberEmailsStr || !token) {
      console.error(
        "syncAgenda: missing required config (AGENDA_HOUSEHOLD_REPO / AGENDA_PROJECT_OWNER / AGENDA_PROJECT_NUMBER / AGENDA_MEMBER_EMAILS / AGENDA_GITHUB_TOKEN); skipping run.",
      );
      return;
    }

    const projectNumber = Number(projectNumberStr);
    if (!Number.isInteger(projectNumber) || projectNumber <= 0) {
      console.error(
        `syncAgenda: AGENDA_PROJECT_NUMBER must be a positive integer, got "${projectNumberStr}"; skipping run.`,
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
      fetchProjectDueDates: (issueNumbers) =>
        fetchProjectDueDatesLive(owner, projectNumber, token, issueNumbers),
      firestore,
      namespace,
      memberEmails,
    });

    console.log(
      `syncAgenda: wrote ${result.written}, deleted ${result.deleted}, skipped ${result.skippedNoDate} (no due date)`,
    );
  },
);
