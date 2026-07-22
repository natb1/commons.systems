// gh-based fetcher adapters for the office-hours local snapshot producer.
//
// The producer runs locally where an authenticated `gh` CLI exists, so GitHub
// transport goes through `gh` (shelling out) instead of the hosted Functions'
// GitHub-App installation token. Each adapter returns EXACTLY the shape the
// matching `*Live` fetcher in functions/src returns, so the three extracted
// cores (sampleDispatchQueueCore / syncOfficeHoursCore / collectProjectSignalsCore)
// are byte-for-byte indifferent to transport. Unit 6 wires the factory output
// straight into the core deps.
//
// Transport notes:
//   - We invoke `gh` via child_process.execFile with an argv ARRAY, never a
//     `sh -c` string, so a search query / repo name can never be shell-injected.
//   - `gh api graphql` reserves the field named `query` for the GraphQL DOCUMENT.
//     The hosted `searchIssueCount*`/`searchIssueDetails*` GraphQL documents bind
//     a variable ALSO named `$query`; that would collide with gh's reserved field.
//     So the documents below rename that variable to `$searchQuery` (bound via
//     `-f searchQuery=<string>`, still a bound variable — never interpolated into
//     the document body). The search-query STRING the cores build is unchanged.
//   - Failures fail loud: a non-zero `gh` exit, invalid JSON, or a GraphQL
//     `errors` payload throws a clear Error (no silent empty fallback) per
//     .claude/rules/code-style.md.

import { execFile } from "node:child_process";
import { parseJitDueMarker } from "../../functions/src/office-hours-sync-core.js";
import type { OfficeHoursItem } from "../../functions/src/office-hours-sync-core.js";
import type { ParkedIssue } from "../../functions/src/dispatch-queue-metrics-core.js";
import type { GithubSignals } from "./project-signals-core.js";

// ---------------------------------------------------------------------------
// Injectable transport boundary
// ---------------------------------------------------------------------------

export interface GhRunResult {
  stdout: string;
  stderr: string;
}

/**
 * The `gh` invocation boundary. Receives the full argv (e.g.
 * `["api", "graphql", "-f", "query=..."]`) and resolves the captured stdout /
 * stderr. Tests inject a mock to avoid spawning a real process.
 */
export type GhRunner = (args: string[]) => Promise<GhRunResult>;

/** Truncate a blob for inclusion in an error message (mirrors truncateForLog). */
function truncate(text: string, max = 200): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

/**
 * Default runner: spawns the real `gh` CLI via execFile (argv array, no shell).
 * Rejects with a clear Error (including stderr) on any non-zero exit.
 */
const defaultGhRunner: GhRunner = (args) =>
  new Promise((resolve, reject) => {
    execFile(
      "gh",
      args,
      { maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `gh ${args.join(" ")} failed: ${error.message}${
                stderr ? `\n${truncate(stderr)}` : ""
              }`,
            ),
          );
          return;
        }
        resolve({ stdout, stderr });
      },
    );
  });

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Run a GraphQL document through `gh api graphql`. `vars` are bound as GraphQL // type-safety-ok: false positive — prose in JSDoc comment, not a type cast
 * variables (one `-f key=value` each); the reserved `query` field carries the
 * document. Returns the `.data` payload. Throws on invalid JSON, a GraphQL
 * `errors` payload, or missing `data` — matching the hosted live helpers.
 */
export async function ghGraphql<T = unknown>(
  document: string,
  vars: Record<string, string> = {},
  run: GhRunner = defaultGhRunner,
): Promise<T> {
  const args = ["api", "graphql", "-f", `query=${document}`];
  for (const [key, value] of Object.entries(vars)) {
    args.push("-f", `${key}=${value}`);
  }

  const { stdout } = await run(args);

  let parsed: GraphQLResponse<T>;
  try {
    parsed = JSON.parse(stdout) as GraphQLResponse<T>; // type-safety-ok: cast matches documented GraphQL response schema
  } catch {
    throw new Error(`gh api graphql returned invalid JSON: ${truncate(stdout)}`);
  }
  if (parsed.errors && parsed.errors.length > 0) {
    throw new Error(
      `GitHub GraphQL errors: ${parsed.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!parsed.data) {
    throw new Error("GitHub GraphQL response missing data");
  }
  return parsed.data;
}

/**
 * Run a REST endpoint through `gh api <path>` and parse the JSON body. Throws on
 * a non-zero exit (e.g. a 403 on the traffic endpoints, which the github fetcher
 * treats as "no traffic access") or invalid JSON.
 */
export async function ghRest<T = unknown>(
  path: string,
  run: GhRunner = defaultGhRunner,
): Promise<T> {
  const { stdout } = await run(["api", path]);
  try {
    return JSON.parse(stdout) as T; // type-safety-ok: cast matches documented GitHub REST schema
  } catch {
    throw new Error(`gh api ${path} returned invalid JSON: ${truncate(stdout)}`);
  }
}

// ---------------------------------------------------------------------------
// Dispatch-queue fetchers — map to searchIssueCountLive / searchIssueDetailsLive
// (functions/src/dispatch-queue-metrics.ts:109-218).
// ---------------------------------------------------------------------------

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

// Mirrors searchIssueCountLive's GraphQL document, with the `$query` variable
// renamed to `$searchQuery` to avoid colliding with gh's reserved `query` field.
const COUNT_DOCUMENT = `
  query($searchQuery: String!) { // type-safety-ok: false positive — '!' is a GraphQL non-null type marker in a template literal, not a TS assertion
    search(query: $searchQuery, type: ISSUE) {
      issueCount
    }
  }
`;

// Mirrors searchIssueDetailsLive's GraphQL document (single page, first: 100),
// with the same `$query`→`$searchQuery` rename.
const DETAILS_DOCUMENT = `
  query($searchQuery: String!) { // type-safety-ok: false positive — '!' is a GraphQL non-null type marker in a template literal, not a TS assertion
    search(query: $searchQuery, type: ISSUE, first: 100) {
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

/** gh adapter for sampleDispatchQueueCore's `searchIssueCount` dep. */
export async function searchIssueCount(
  query: string,
  run: GhRunner = defaultGhRunner,
): Promise<number> {
  const data = await ghGraphql<SearchCountResponse>(
    COUNT_DOCUMENT,
    { searchQuery: query },
    run,
  );
  return data.search.issueCount;
}

/** gh adapter for sampleDispatchQueueCore's `searchIssueDetails` dep. */
export async function searchIssueDetails(
  query: string,
  run: GhRunner = defaultGhRunner,
): Promise<ParkedIssue[]> {
  const data = await ghGraphql<SearchDetailsResponse>(
    DETAILS_DOCUMENT,
    { searchQuery: query },
    run,
  );
  return data.search.nodes.map((node) => {
    // Best-effort dispatch phase: the first dispatch:* label other than
    // dispatch:office-hours (the bucket itself, not a phase). Mirrors
    // searchIssueDetailsLive.
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
      ...(phase ? { phase } : {}),
    };
  });
}

// ---------------------------------------------------------------------------
// Office-hours-sync fetcher — maps to fetchOpenJitIssuesLive
// (functions/src/office-hours-sync.ts:165-224).
// ---------------------------------------------------------------------------

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

const JIT_ISSUES_DOCUMENT = `
  query($owner: String!, $name: String!, $cursor: String) { // type-safety-ok: false positive — '!' markers are GraphQL non-null type annotations in a template literal, not TS assertions
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

/** gh adapter for syncOfficeHoursCore's `fetchOpenJitIssues` dep. */
export async function fetchOpenJitIssues(
  repo: string,
  run: GhRunner = defaultGhRunner,
): Promise<OfficeHoursItem[]> {
  const slash = repo.indexOf("/");
  if (slash <= 0 || slash === repo.length - 1) {
    throw new Error(`Invalid repo "${repo}"; expected "owner/name"`);
  }
  const owner = repo.slice(0, slash);
  const name = repo.slice(slash + 1);

  const results: OfficeHoursItem[] = [];
  let cursor: string | null = null;

  while (true) {
    // Omit cursor on the first page (the $cursor variable defaults to null);
    // pass it as a bound variable on subsequent pages.
    const vars: Record<string, string> =
      cursor === null ? { owner, name } : { owner, name, cursor };
    const data = await ghGraphql<IssuesQueryResponse>(
      JIT_ISSUES_DOCUMENT,
      vars,
      run,
    );

    for (const node of data.repository.issues.nodes) {
      const jitLabel = node.labels.nodes.find((l) => l.name.startsWith("jit:"));
      if (jitLabel) {
        results.push({
          kind: "reminder",
          number: node.number,
          title: node.title,
          body: node.body,
          jitKey: jitLabel.name.slice("jit:".length),
          repo,
          dueAt: parseJitDueMarker(node.body),
        });
      }
    }

    const { hasNextPage, endCursor } = data.repository.issues.pageInfo;
    if (!hasNextPage || !endCursor) break;
    cursor = endCursor;
  }

  return results;
}

// ---------------------------------------------------------------------------
// Project-signals GitHub fetcher — maps to the project-signals.ts closure
// (functions/src/project-signals.ts:243-257): stats ALWAYS, traffic OMITTED on
// any error. Combines fetchGithubStatsLive + fetchGithubTrafficLive
// (project-signals-core.ts:116-181) over REST via `gh api`.
// ---------------------------------------------------------------------------

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

interface GithubForkResponse {
  // GitHub returns `owner: null` for a fork whose owning account was later
  // deleted — the per-entry transform must tolerate it, not assume a login.
  owner: { login: string } | null;
  html_url: string;
  created_at: string;
  pushed_at: string;
  stargazers_count: number;
}

/** gh adapter for collectProjectSignalsCore's `fetchGithub` dep. */
export async function fetchGithub(
  repo: string,
  run: GhRunner = defaultGhRunner,
): Promise<GithubSignals> {
  // Public stats — always collected. Mirrors fetchGithubStatsLive's mapping.
  const statsJson = await ghRest<GithubRepoResponse>(`repos/${repo}`, run);
  const result: GithubSignals = {
    repo,
    stars: statsJson.stargazers_count,
    forks: statsJson.forks_count,
    watchers: statsJson.watchers_count,
  };

  // Fork detail and traffic each only need `repo` — independent of each other
  // and of the stats fetch above. Fire them concurrently (below) so total
  // latency is max(forks, traffic), not their sum. Each branch tolerates its own
  // failure (resolving to undefined) so a missing scope on one never voids the
  // other or the public stats.

  // Fork detail — one page (100) of forks, newest first; the total count already
  // rides `forks`. The try/catch guards ONLY the network fetch; the per-entry
  // transform uses flatMap to drop a single malformed fork (e.g. `owner` null for
  // a since-deleted account) while keeping the rest — mirroring the read-side
  // parseGithubSignals, rather than voiding the whole list on one bad entry.
  const collectForksDetail = async (): Promise<GithubSignals["forksDetail"]> => {
    let forks: GithubForkResponse[];
    try {
      forks = await ghRest<GithubForkResponse[]>(
        `repos/${repo}/forks?sort=newest&per_page=100`,
        run,
      );
    } catch {
      // no fork-listing access / fetch failure — omit forksDetail, keep stats.
      return undefined;
    }
    return forks.flatMap((f) =>
      f.owner?.login
        ? [
            {
              owner: f.owner.login,
              repoUrl: f.html_url,
              createdAt: f.created_at,
              pushedAt: f.pushed_at,
              stars: f.stargazers_count,
            },
          ]
        : [],
    );
  };

  // Traffic needs push access; any error (e.g. 403) means "no access" — omit the
  // traffic key but keep the public stats. Mirrors project-signals.ts:248-256
  // and fetchGithubTrafficLive's three-endpoint mapping.
  const collectTraffic = async (): Promise<GithubSignals["traffic"]> => {
    try {
      const [clones, views, referrers] = await Promise.all([
        ghRest<GithubTrafficCountResponse>(`repos/${repo}/traffic/clones`, run),
        ghRest<GithubTrafficCountResponse>(`repos/${repo}/traffic/views`, run),
        ghRest<GithubReferrerResponse[]>(`repos/${repo}/traffic/popular/referrers`, run),
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
    } catch {
      // no traffic access — omit traffic, keep stats.
      return undefined;
    }
  };

  const [forksDetail, traffic] = await Promise.all([
    collectForksDetail(),
    collectTraffic(),
  ]);
  if (forksDetail !== undefined) result.forksDetail = forksDetail;
  if (traffic !== undefined) result.traffic = traffic;

  return result;
}

// ---------------------------------------------------------------------------
// Deps factory for Unit 6
// ---------------------------------------------------------------------------

export interface GhFetcherConfig {
  /** The office-hours group repo (owner/name) scanned for jit issues. */
  groupRepo?: string;
  /** The single project-signals GitHub repo (owner/name). */
  githubRepo?: string;
}

/**
 * Returns the named fetcher properties Unit 6 drops into the three core deps:
 *   - `searchIssueCount` / `searchIssueDetails` → sampleDispatchQueueCore
 *   - `fetchOpenJitIssues` → syncOfficeHoursCore (null when no groupRepo)
 *   - `fetchGithub` → collectProjectSignalsCore (null when no githubRepo)
 *
 * The repo-bound fetchers are gated to `null` when their config is absent,
 * mirroring collectProjectSignalsCore's `| null` deps. Unit 6 supplies the
 * remaining deps (firestore, namespace, etc.).
 */
export function createGhFetchers(
  config: GhFetcherConfig = {},
  run: GhRunner = defaultGhRunner,
): {
  searchIssueCount: (query: string) => Promise<number>;
  searchIssueDetails: (query: string) => Promise<ParkedIssue[]>;
  fetchOpenJitIssues: (() => Promise<OfficeHoursItem[]>) | null;
  fetchGithub: (() => Promise<GithubSignals>) | null;
} {
  return {
    searchIssueCount: (query: string) => searchIssueCount(query, run),
    searchIssueDetails: (query: string) => searchIssueDetails(query, run),
    fetchOpenJitIssues: config.groupRepo
      ? () => fetchOpenJitIssues(config.groupRepo!, run) // type-safety-ok: guarded by the truthy config.groupRepo check
      : null,
    fetchGithub: config.githubRepo
      ? () => fetchGithub(config.githubRepo!, run) // type-safety-ok: guarded by the truthy config.githubRepo check
      : null,
  };
}
