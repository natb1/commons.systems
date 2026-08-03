// produceSnapshot — the office-hours local-snapshot assembler.
//
// Assembles the in-memory `SnapshotInput` (the six dashboard PanelData fields
// plus producer metadata) that the Unit-5 `serializeSnapshot` consumes. It does
// NOT serialize, encrypt, or write — Units 5/7 own those.
//
// How the six fields are produced (scope = "full"):
//   - reminders / queueMetrics / issueSamples / projectSignals come from running
//     the three unmodified extracted cores (syncOfficeHoursCore /
//     sampleDispatchQueueCore / collectProjectSignalsCore) against an in-memory
//     capture Firestore (capture-firestore.ts) with injected GitHub fetchers,
//     then reading the captured docs back through the office-hours PARSERS.
//   - topicUsage comes from the `topic-usage-writer.mjs --dry-run` subprocess
//     (stdout JSON), mapped via office-hours `toTopicUsage`.
//   - samples comes from an injectable `sampleUsage` seam (Unit 9 wires the real
//     live-usage payload source).
//
// Every external effect is an injectable `deps` field so tests mock them and
// Unit 9 wires the real ones. The `.mjs` producers are ALWAYS invoked as
// `--dry-run` subprocesses through an injectable runner — never imported (their
// module bottoms call `main()` unconditionally).
//
// Parsers reused (not re-defined): parseQueueMetrics, toIssueSample,
// parseProjectSignals, toTopicUsage. The one mapper that could NOT be reused is
// the reminder mapper `toReminder` (office-hours/src/data.ts): that module
// top-imports vite `virtual:` seed modules, which this firebase-admin package's
// vitest/tsc cannot resolve. The reminder shape is five plain fields, so it is
// mapped inline here.

import { spawn } from "node:child_process";
import path from "node:path";

import { syncOfficeHoursCore } from "../../functions/src/office-hours-sync-core.js";
import type { OfficeHoursItem } from "../../functions/src/office-hours-sync-core.js";
import {
  sampleDispatchQueueCore,
  buildOfficeHoursQuery,
} from "../../functions/src/dispatch-queue-metrics-core.js";
import type { ParkedIssue } from "../../functions/src/dispatch-queue-metrics-core.js";
import { collectProjectSignalsCore } from "./project-signals-core.js";
import type {
  GithubSignals,
  Ga4AppSignals,
  GscSignals,
  PsiUrlSignals,
} from "./project-signals-core.js";

import { parseQueueMetrics } from "../../office-hours/src/queue-metrics.js";
import type { QueueMetricsSnapshot } from "../../office-hours/src/queue-metrics.js";
import { toIssueSample } from "../../office-hours/src/issue-samples.js";
import type { IssueSample } from "../../office-hours/src/issue-samples.js";
import type { UsageSample } from "../../office-hours/src/usage-samples.js";
import type { Reminder } from "../../office-hours/src/reminders.js";
import { parseProjectSignals } from "../../office-hours/src/project-signals.js";
import type { ProjectSignalsSnapshot } from "../../office-hours/src/project-signals.js";
import { toTopicUsage } from "../../office-hours/src/topic-usage.js";
import type { TopicUsageDoc } from "../../office-hours/src/topic-usage.js";

import { createCaptureFirestore } from "./capture-firestore.js";
import type { CaptureFirestore } from "./capture-firestore.js";
import type { ChainHealth, SnapshotInput, SnapshotScope } from "./snapshot.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Bound applied to the two append-only SERIES fields (`samples`,
 * `issueSamples`). The producer keeps only the last `WINDOW_SIZE` points so the
 * encrypted snapshot stays bounded across many runs. 100 points ≈ a few months
 * of hourly samples — enough history for the dashboard charts without unbounded
 * growth. Override per-call via `deps.windowSize`.
 */
export const WINDOW_SIZE = 100;

// ---------------------------------------------------------------------------
// Injectable dependency seams
// ---------------------------------------------------------------------------

/** Prior decrypted series history, supplied by Unit 7/9 (the `current` snapshot). */
export interface PriorHistory {
  samples: UsageSample[];
  issueSamples: IssueSample[];
}

export interface ProduceDeps {
  // --- Producer config (required) ---
  /** Firestore-style namespace prefix, e.g. "office-hours/prod". */
  namespace: string;
  /** Owning group id, denormalized into each written doc. */
  groupId: string;
  /**
   * Member emails, denormalized into the docs the cores write (the auth field
   * the Firestore rules read). NOT stamped onto the serialized series samples —
   * the offline wire deliberately omits the ACL (see snapshot-wire.ts).
   */
  memberEmails: string[];
  /** Repos scanned for queue metrics + parked office-hours work. */
  queueRepos: string[];

  // --- GitHub fetchers (from createGhFetchers; Unit 9 wires the real ones) ---
  searchIssueCount: (query: string) => Promise<number>;
  searchIssueDetails: (query: string) => Promise<ParkedIssue[]>;
  /**
   * Open-jit-issues fetcher for syncOfficeHoursCore. Nullable from the factory
   * (gated on a configured group repo); REQUIRED for scope="full" — a null here
   * throws a clear error rather than silently dropping reminders.
   */
  fetchOpenJitIssues: (() => Promise<OfficeHoursItem[]>) | null;
  /** GitHub project-signals fetcher; null when no githubRepo configured. */
  fetchGithub: (() => Promise<GithubSignals>) | null;
  /** GA4 fetcher; defaults to null (Unit 9 wires the live source + secrets). */
  fetchGa4?: (() => Promise<Ga4AppSignals[]>) | null;
  /** GSC fetcher; defaults to null (Unit 9 wires the live source + secrets). */
  fetchGsc?: ((now: Date) => Promise<GscSignals>) | null;
  /** PSI fetcher; defaults to null (Unit 9 wires the live source). */
  fetchPsi?: (() => Promise<PsiUrlSignals[]>) | null;

  // --- External-effect seams (all defaulted; tests inject mocks) ---
  /** Producer clock; defaults to `() => new Date()`. Evaluated once per call. */
  now?: () => Date;
  /** Capture-Firestore factory; defaults to the in-memory createCaptureFirestore. */
  createFirestore?: () => CaptureFirestore;
  /** Returns `topic-usage-writer.mjs --dry-run` stdout (a JSON array). */
  runTopicUsage?: () => Promise<string>;
  /** Returns the newly-sampled capacity-band point, or null when unavailable. */
  sampleUsage?: () => Promise<UsageSample | null>;
  /** Best-effort, cheap chain-health probe; returns `{}` on any error. */
  probeChainHealth?: () => Promise<ChainHealth>;
  /** Prior decrypted series history (Unit 7/9); null when no prior snapshot. */
  readPriorHistory?: () => Promise<PriorHistory | null>;
  /** Window bound for the series fields; defaults to WINDOW_SIZE. */
  windowSize?: number;
}

// ---------------------------------------------------------------------------
// Default subprocess runners (used by Unit 9; tests inject canned values).
// The `.mjs` producers are invoked as `--dry-run` subprocesses here, NEVER
// imported.
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const TOPIC_USAGE_WRITER = path.join(
  REPO_ROOT,
  ".claude/skills/dispatch-token-audit/scripts/topic-usage-writer.mjs",
);
const USAGE_SAMPLE_WRITER = path.join(
  REPO_ROOT,
  ".claude/skills/dispatch-propagate/scripts/usage-sample-writer.mjs",
);

/** Spawn `node <args>`, optionally feeding `stdin`, and resolve captured stdout. */
function spawnNode(args: string[], stdin?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", args, { stdio: ["pipe", "pipe", "pipe"] });
    // Suppress EPIPE if the child exits before draining stdin; the 'close'
    // handler already captures a non-zero exit as a rejected promise.
    child.stdin.on("error", () => {});
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => (stdout += c.toString()));
    child.stderr.on("data", (c) => (stderr += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`node ${args.join(" ")} exited ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(stdout);
    });
    if (stdin !== undefined) child.stdin.write(stdin);
    child.stdin.end();
  });
}

/** Default topic-usage runner: `topic-usage-writer.mjs --dry-run` (stdout JSON array). */
function defaultRunTopicUsage(): Promise<string> {
  return spawnNode([TOPIC_USAGE_WRITER, "--dry-run"]);
}

/**
 * Pipe a usage payload to `usage-sample-writer.mjs --dry-run`, parse the
 * assembled doc (the writer renders timestamps as ISO strings in dry-run), and // type-safety-ok: false positive — 'as ISO strings' is prose in a JSDoc comment, not a type cast
 * map it to a `UsageSample`. Exported for Unit 9 to build its real `sampleUsage`
 * dep once it has a live usage payload; null resets fall back to `sampledAt`.
 */
export async function runUsageSampleWriter(payloadJson: string): Promise<UsageSample> {
  const stdout = await spawnNode([USAGE_SAMPLE_WRITER, "--dry-run"], payloadJson);
  const doc = JSON.parse(stdout) as Record<string, unknown>; // type-safety-ok: dry-run writer emits the assembled usage-sample doc
  const sampledAt = new Date(String(doc.sampledAt));
  const toDateOr = (v: unknown): Date => (v === null || v === undefined ? sampledAt : new Date(String(v)));
  return {
    sampledAt,
    fiveHourUsedPct: Number(doc.fiveHourUsedPct),
    weeklyUsedPct: Number(doc.weeklyUsedPct),
    fiveHourResetsAt: toDateOr(doc.fiveHourResetsAt),
    weeklyResetsAt: toDateOr(doc.weeklyResetsAt),
    activeWorkers: Number(doc.activeWorkers),
    targetWorkers: Number(doc.targetWorkers),
    groupId: String(doc.groupId),
  };
}

/**
 * Default capacity-band sampler: returns null. The live usage payload source is
 * supplied by Unit 9 / the caller, which wires a real `sampleUsage` (typically
 * built on `runUsageSampleWriter`). Absent that payload there is nothing to
 * sample, so the producer starts/continues the series without a new point.
 */
function defaultSampleUsage(): Promise<UsageSample | null> {
  return Promise.resolve(null);
}

/**
 * Default chain-health probe: best-effort `claude agents --json` (or the
 * `$DISPATCH_AGENTS_SNAPSHOT` override). Cheap and fail-soft — any error yields
 * `{}` so the snapshot still produces. Needs the host network at runtime.
 */
async function defaultProbeChainHealth(): Promise<ChainHealth> {
  try {
    const override = process.env.DISPATCH_AGENTS_SNAPSHOT;
    // Prefer the env snapshot when present; otherwise shell `claude agents --json`.
    const json = override !== undefined ? override : await spawnClaudeAgents();
    const parsed = JSON.parse(json) as unknown; // type-safety-ok: JSON.parse returns any; as unknown forces explicit discrimination below
    return Array.isArray(parsed) ? { liveSessions: parsed.length } : {};
  } catch {
    return {};
  }
}

/** Shell `claude agents --json` and resolve its stdout (best-effort). */
function spawnClaudeAgents(): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["agents", "--json"], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", () => resolve(out));
  });
}

// ---------------------------------------------------------------------------
// Small mapping helpers
// ---------------------------------------------------------------------------

/** Read a Date out of a value that is a `Date` or a Timestamp-like (`.toDate()`). */
function readDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate();
  }
  throw new Error("produceSnapshot: expected a Date or Timestamp value");
}

/**
 * Present a captured `sampledAt` Date as a Timestamp-like so `toIssueSample`
 * (whose inline check is strictly `.toDate`-based) accepts it. The capture stub
 * records the core's in-memory `Date` verbatim; a real Firestore read would
 * return a Timestamp, so we re-wrap to feed the parser its expected shape.
 */
function asTimestampLike(v: unknown): unknown {
  if (v instanceof Date) return { toDate: () => v };
  return v;
}

/** Append new points to a prior window and keep only the last `n`. */
function boundedAppend<T>(prior: T[], next: T[], n: number): T[] {
  return [...prior, ...next].slice(-n);
}

// ---------------------------------------------------------------------------
// produceSnapshot
// ---------------------------------------------------------------------------

/**
 * Assemble the in-memory `SnapshotInput` for the given scope.
 *
 * scope="full": run all three cores against the capture Firestore + injected
 * fetchers, plus topic-usage and usage sampling, and assemble all six fields.
 *
 * scope="parked-only": refresh ONLY the parked-issues data and a cheap
 * chainHealth (no full core runs, no topic-usage / usage / project-signals /
 * GA4 / GSC / PSI). The five non-parked fields carry prior-history values when
 * available, else empty / null. The returned `queueMetrics` is PARTIAL — only
 * `parked` is meaningful; the rate fields are zeroed.
 */
export async function produceSnapshot(
  deps: ProduceDeps,
  scope: SnapshotScope,
): Promise<SnapshotInput> {
  const now = (deps.now ?? (() => new Date()))();
  const windowSize = deps.windowSize ?? WINDOW_SIZE;
  const probeChainHealth = deps.probeChainHealth ?? defaultProbeChainHealth;
  const readPriorHistory = deps.readPriorHistory ?? (() => Promise.resolve(null));

  // Best-effort chain health; never let a probe failure fail the snapshot.
  let chainHealth: ChainHealth;
  try {
    chainHealth = await probeChainHealth();
  } catch {
    chainHealth = {};
  }

  const prior = await readPriorHistory();
  const priorSamples = prior?.samples ?? [];
  const priorIssueSamples = prior?.issueSamples ?? [];

  if (scope === "parked-only") {
    // Cheap path: one details search per repo, no count aggregation, no cores.
    const parkedPerRepo = await Promise.all(
      deps.queueRepos.map((r) => deps.searchIssueDetails(buildOfficeHoursQuery(r))),
    );
    const parked = parkedPerRepo.flat();
    // Partial queue metrics: only `parked` is meaningful here. The rate fields
    // are zeroed and runwayDays is null (which satisfies the
    // netDrainPerDay/runwayDays invariant: 0 > 0 is false ⇔ null). `scope:
    // "parked-only"` marks depth/rate/runway as fabricated placeholders so the
    // dashboard renders them as unmeasured rather than as a real (misleading)
    // "queue empty / 0.0 net drain" reading.
    const queueMetrics: QueueMetricsSnapshot = {
      openHelpWanted: 0,
      closedPerDay: 0,
      createdPerDay: 0,
      netDrainPerDay: 0,
      runwayDays: null,
      windowDays: 0,
      computedAt: now,
      groupId: deps.groupId,
      memberEmails: deps.memberEmails,
      parked,
      scope: "parked-only",
    };
    return {
      samples: priorSamples.slice(-windowSize),
      reminders: [],
      queueMetrics,
      issueSamples: priorIssueSamples.slice(-windowSize),
      topicUsage: [],
      projectSignals: null,
      computedAt: now,
      chainHealth,
      scope,
      window: { samples: windowSize, issueSamples: windowSize },
    };
  }

  // --- scope === "full" ---

  if (!deps.fetchOpenJitIssues) {
    throw new Error(
      "produceSnapshot(full): fetchOpenJitIssues is required (no group repo configured) " +
        "but is null — cannot sync reminders",
    );
  }
  const fetchOpenJitIssues = deps.fetchOpenJitIssues;

  const { firestore, captured } = (deps.createFirestore ?? createCaptureFirestore)();
  const ns = deps.namespace;
  const runTopicUsage = deps.runTopicUsage ?? defaultRunTopicUsage;
  const sampleUsage = deps.sampleUsage ?? defaultSampleUsage;

  // Drive the three cores against the capture stub, plus topic-usage + usage
  // sampling, all in parallel. The cores write distinct paths into the shared
  // in-memory stub, so there is no write contention.
  const [, , , topicStdout, newSample] = await Promise.all([
    syncOfficeHoursCore({
      fetchOpenJitIssues,
      firestore,
      namespace: ns,
      memberEmails: deps.memberEmails,
    }),
    sampleDispatchQueueCore({
      searchIssueCount: deps.searchIssueCount,
      searchIssueDetails: deps.searchIssueDetails,
      firestore,
      namespace: ns,
      queueRepos: deps.queueRepos,
      groupId: deps.groupId,
      memberEmails: deps.memberEmails,
      now,
    }),
    collectProjectSignalsCore({
      firestore,
      namespace: ns,
      groupId: deps.groupId,
      memberEmails: deps.memberEmails,
      now,
      fetchGithub: deps.fetchGithub,
      fetchGa4: deps.fetchGa4 ?? null,
      fetchGsc: deps.fetchGsc ?? null,
      fetchPsi: deps.fetchPsi ?? null,
    }),
    runTopicUsage(),
    sampleUsage(),
  ]);

  // reminders — from captured `${ns}/items` bulk-set payloads. Mapped inline
  // (see header: toReminder lives in a virtual-import module we cannot load).
  const reminders: Reminder[] = captured.bulkSets(`${ns}/items`).map(({ payload }) => ({
    jitKey: String(payload.jitKey),
    title: String(payload.title),
    repo: String(payload.repo),
    issueNumber: Number(payload.issueNumber),
    // dueAt is a firebase-admin Timestamp (Timestamp.fromDate) in the payload.
    dueAt: readDate(payload.dueAt),
  }));

  // queueMetrics — from captured `${ns}/metrics/dispatch-queue`.
  const queueDoc = captured.doc(`${ns}/metrics/dispatch-queue`);
  const queueMetrics = queueDoc ? parseQueueMetrics(queueDoc) : null;

  // issueSamples (new point) — from captured `${ns}/issue-samples` add payload(s).
  const newIssueSamples: IssueSample[] = captured
    .added(`${ns}/issue-samples`)
    .flatMap((payload, i) => {
      const shimmed = { ...payload, sampledAt: asTimestampLike(payload.sampledAt) };
      const parsed = toIssueSample(`capture-${i}`, shimmed);
      return parsed ? [parsed] : [];
    });

  // projectSignals — from captured `${ns}/metrics/project-signals`.
  const signalsDoc = captured.doc(`${ns}/metrics/project-signals`);
  const projectSignals = signalsDoc ? parseProjectSignals(signalsDoc) : null;

  // topicUsage — parse the dry-run stdout JSON array of `{ id, doc }` entries and
  // map each `doc` via office-hours toTopicUsage (dropping nulls).
  const topicUsage: TopicUsageDoc[] = parseTopicUsageStdout(topicStdout);

  // Bounded series: append the new points to the prior windows, keep last N.
  const samples = boundedAppend(priorSamples, newSample ? [newSample] : [], windowSize);
  const issueSamples = boundedAppend(priorIssueSamples, newIssueSamples, windowSize);

  return {
    samples,
    reminders,
    queueMetrics,
    issueSamples,
    topicUsage,
    projectSignals,
    computedAt: now,
    chainHealth,
    scope,
    window: { samples: windowSize, issueSamples: windowSize },
  };
}

// ---------------------------------------------------------------------------
// produceProjectSignals — the analytics-scope collector
// ---------------------------------------------------------------------------

/** Deps for the analytics-only collection (a strict subset of ProduceDeps). */
export interface ProduceSignalsDeps {
  /** Firestore-style namespace prefix, e.g. "office-hours/prod". */
  namespace: string;
  /** Owning group id, denormalized into the signals section. */
  groupId: string;
  /** Member emails, denormalized into the signals section. */
  memberEmails: string[];
  /** GitHub project-signals fetcher. */
  fetchGithub: (() => Promise<GithubSignals>) | null;
  /** GA4 fetcher. */
  fetchGa4: (() => Promise<Ga4AppSignals[]>) | null;
  /** GSC fetcher. */
  fetchGsc: ((now: Date) => Promise<GscSignals>) | null;
  /** PSI fetcher. */
  fetchPsi: (() => Promise<PsiUrlSignals[]>) | null;
  /** Producer clock; defaults to `() => new Date()`. */
  now?: () => Date;
  /** Capture-Firestore factory; defaults to the in-memory createCaptureFirestore. */
  createFirestore?: () => CaptureFirestore;
}

/**
 * Collect ONLY the projectSignals section (`--scope analytics`): run the
 * unmodified collectProjectSignalsCore against the capture Firestore and read
 * the written doc back through the office-hours parser. The caller
 * (run.ts) folds the result into the prior snapshot via foldProjectSignals.
 *
 * The core keeps its per-source omit-on-failure posture (a failed source is
 * logged and its key omitted), but a run where EVERY source came back empty
 * throws — a daily analytics timer that silently produces an empty section
 * would defeat its purpose (clear errors over fallbacks).
 */
export async function produceProjectSignals(
  deps: ProduceSignalsDeps,
): Promise<ProjectSignalsSnapshot> {
  const now = (deps.now ?? (() => new Date()))();
  const { firestore, captured } = (deps.createFirestore ?? createCaptureFirestore)();
  const ns = deps.namespace;

  await collectProjectSignalsCore({
    firestore,
    namespace: ns,
    groupId: deps.groupId,
    memberEmails: deps.memberEmails,
    now,
    fetchGithub: deps.fetchGithub,
    fetchGa4: deps.fetchGa4,
    fetchGsc: deps.fetchGsc,
    fetchPsi: deps.fetchPsi,
  });

  const signalsDoc = captured.doc(`${ns}/metrics/project-signals`);
  if (!signalsDoc) {
    throw new Error("produceProjectSignals: the signals core wrote no project-signals doc");
  }
  const parsed = parseProjectSignals(signalsDoc);
  if (!parsed) {
    throw new Error(
      "produceProjectSignals: parseProjectSignals rejected the collected doc (shape drift)",
    );
  }
  if (!parsed.github && !parsed.ga4 && !parsed.gsc && !parsed.psi) {
    throw new Error(
      "produceProjectSignals: every analytics source failed — refusing to fold an empty projectSignals section",
    );
  }
  return parsed;
}

/** Parse `topic-usage-writer.mjs --dry-run` stdout → TopicUsageDoc[] (drops nulls). */
function parseTopicUsageStdout(stdout: string): TopicUsageDoc[] {
  const parsed = JSON.parse(stdout) as unknown; // type-safety-ok: JSON.parse returns any; as unknown forces explicit discrimination below
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((entry) => {
    // Each entry is `{ id, doc }`; fall back to the entry itself if it is already
    // a bare document.
    const raw =
      entry && typeof entry === "object" && "doc" in (entry as Record<string, unknown>) // type-safety-ok: object guard + 'in' check above; cast to read the 'doc' field
        ? (entry as Record<string, unknown>).doc // type-safety-ok: same object guard; cast to access 'doc' field value
        : entry;
    const doc = toTopicUsage(raw);
    return doc ? [doc] : [];
  });
}
