// Core logic for dispatch-queue-metrics — dependency-injected, firebase-functions-free.
// The onSchedule wrapper, secrets, and live GitHub fetchers live in dispatch-queue-metrics.ts.
import type { Firestore } from "firebase-admin/firestore";

const WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface QueueSearchQueries {
  open: string;
  closed: string;
  created: string;
  security: string;
  bug: string;
  enhancement: string;
  other: string;
}

// Builds the seven GitHub issue-search query strings. `now` is injected so tests
// pin the 14-day cutoff date deterministically. The cutoff is the YYYY-MM-DD
// date 14 days before `now` (UTC). `security`/`bug`/`enhancement`/`other` are the
// four mutually-exclusive precedence buckets that partition the total open set.
export function buildQueueSearchQueries(queueRepo: string, now: Date): QueueSearchQueries {
  const cutoff = new Date(now.getTime() - WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10);
  return {
    open: `repo:${queueRepo} is:issue is:open label:"help wanted"`,
    closed: `repo:${queueRepo} is:issue is:closed reason:completed label:"help wanted" closed:>=${cutoff}`,
    created: `repo:${queueRepo} is:issue label:"help wanted" created:>=${cutoff}`,
    security: `repo:${queueRepo} is:issue is:open label:"security"`,
    bug: `repo:${queueRepo} is:issue is:open label:"bug" -label:"security"`,
    enhancement: `repo:${queueRepo} is:issue is:open label:"enhancement" -label:"bug" -label:"security"`,
    other: `repo:${queueRepo} is:issue is:open -label:"enhancement" -label:"bug" -label:"security"`,
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

// A parked dispatch:office-hours issue, surfaced for the dashboard. This wire
// shape must match office-hours/src/queue-metrics.ts independently (there is no
// shared types package). `url` is emitted by the producer (not constructed
// client-side); `createdAt` is a real Date (the app's toDate helper returns null
// for raw strings, so a string would silently drop every parked item); `phase`
// is a best-effort dispatch residue label, omitted when none applies.
export interface ParkedIssue {
  number: number;
  title: string;
  url: string;
  createdAt: Date;
  repo: string;
  phase?: string;
}

// Builds the GitHub issue-search query for parked dispatch:office-hours work in
// one repo. Kept separate from buildQueueSearchQueries / QueueSearchQueries so
// the details fetch stays entirely off the stride-7 count aggregation path.
export function buildOfficeHoursQuery(queueRepo: string): string {
  return `repo:${queueRepo} is:issue is:open label:"dispatch:office-hours"`;
}

// Runs the seven searches per repo via the injected `searchIssueCount` and
// aggregates the counts across all configured repos, computes the snapshot, and
// writes the field map to `${namespace}/metrics/dispatch-queue`. The snapshot
// field map matches office-hours/src/queue-metrics.ts exactly. In the same run
// it also appends one `issue-samples` document (the cross-repo four-bucket
// precedence split openSecurity / openBug / openEnhancement / openOther) to
// `${namespace}/issue-samples`.
export async function sampleDispatchQueueCore(deps: {
  searchIssueCount: (query: string) => Promise<number>;
  searchIssueDetails: (query: string) => Promise<ParkedIssue[]>;
  firestore: Firestore;
  namespace: string;
  queueRepos: string[];
  groupId: string;
  memberEmails: string[];
  now: Date;
}): Promise<void> {
  const perRepoQueries = deps.queueRepos.map((r) => buildQueueSearchQueries(r, deps.now));

  // Flatten every repo×query search into a single Promise.all so all repos run
  // in parallel, then sum each of the seven query counts across all repos. The
  // flat order (open, closed, created, security, bug, enhancement, other) must
  // match the stride-7 index math below.
  const counts = await Promise.all(
    perRepoQueries.flatMap((q) => [
      deps.searchIssueCount(q.open),
      deps.searchIssueCount(q.closed),
      deps.searchIssueCount(q.created),
      deps.searchIssueCount(q.security),
      deps.searchIssueCount(q.bug),
      deps.searchIssueCount(q.enhancement),
      deps.searchIssueCount(q.other),
    ]),
  );

  let openHelpWanted = 0;
  let closedCount = 0;
  let createdCount = 0;
  let openSecurity = 0;
  let openBug = 0;
  let openEnhancement = 0;
  let openOther = 0;
  for (let i = 0; i < perRepoQueries.length; i++) {
    openHelpWanted += counts[i * 7 + 0];
    closedCount += counts[i * 7 + 1];
    createdCount += counts[i * 7 + 2];
    openSecurity += counts[i * 7 + 3];
    openBug += counts[i * 7 + 4];
    openEnhancement += counts[i * 7 + 5];
    openOther += counts[i * 7 + 6];
  }

  const { closedPerDay, createdPerDay, netDrainPerDay, runwayDays } = computeQueueMetrics({
    openHelpWanted,
    closedCount,
    createdCount,
    windowDays: WINDOW_DAYS,
  });

  // Parked dispatch:office-hours details, fetched on a completely separate code
  // path from the stride-7 count aggregation above. One details search per repo
  // in parallel, concatenated across repos.
  const parkedPerRepo = await Promise.all(
    deps.queueRepos.map((r) => deps.searchIssueDetails(buildOfficeHoursQuery(r))),
  );
  const parked = parkedPerRepo.flat();

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
    parked,
  });

  await deps.firestore.collection(`${deps.namespace}/issue-samples`).add({
    sampledAt: deps.now,
    openSecurity,
    openBug,
    openEnhancement,
    openOther,
    groupId: deps.groupId,
    memberEmails: deps.memberEmails,
  });
}
