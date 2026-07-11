// Read the local-first default sensors over the active frontier and write each
// node's fresh `reading` + derived `gap` back to the local `intentions/` store.
//
// This is the batch driver for the feedback arm's READ step: for every active
// frontier node that names a `success_signal.sensor`, it resolves that sensor in
// a registry, reads the current measurement, derives the mechanical gap, and
// persists `{ ...node, reading, gap }` — preserving every other field. It reads
// only the local store and runs only local own-execution commands (no gh API,
// no analytics, no network).
//
// Run from anywhere (the store dir is resolved relative to this file, not cwd):
//   npx tsx packages/intentionsutil/scripts/read-sensors.ts
//
// SENSOR REGISTRATION PATTERN (documented once here, not enumerated per sensor):
// A Sensor is registered under the name nodes put in `success_signal.sensor`. A
// node naming sensor `"vitest"` is matched to the `"vitest"` sensor, and so on.
// Only LOCAL-FIRST own-execution sensors belong in this default registry —
// signals about one's own pipeline (CI/test status, the author's own use of an
// artifact), per the local-first / no-mining principle in
// `.claude/docs/signal-identification.md`. External sensors (site analytics,
// PageSpeed Insights, anything that observes activity beyond one's own
// execution) are FLAGGED, opt-in, and deliberately NOT registered here; they
// live in `.claude/skills/align-init/scripts/fetch-*.sh` behind explicit flags.
//
// A node naming a sensor that is not registered is NOT silently skipped and does
// NOT crash the batch: it is collected and reported to stderr at the end. That
// is the honest middle path for a batch driver — explicit reporting over a
// swallowed fallback (`.claude/rules/code-style.md`).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes, writeNode } from "../src/store.js";
import { projectGoals } from "../src/goals.js";
import { SensorRegistry, deriveGap, type Sensor } from "../src/sensors.js";
import { IntentionSchemaError } from "../src/errors.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/read-sensors.ts`, so the
// repo root is three directories up. Resolve from this file's own location, never from
// cwd — the local-first sensors run their commands with `cwd: repoRoot`.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

// --- Local-first default sensors -------------------------------------------
// Each sensor's `read` MUST be total: it never throws. A failing local command
// becomes a status reading string, not an exception — the driver does not
// try/catch `read`, so a throw here would abort the whole batch. Commands run
// with `cwd: repoRoot` (not process.cwd()) to honor the script-relative
// contract, and capture only stdout.

const execOpts = {
  cwd: repoRoot,
  encoding: "utf8" as const,
  stdio: ["ignore", "pipe", "ignore"] as ["ignore", "pipe", "ignore"],
};

/**
 * CI/test-status sensor — name `"vitest"`, the name nodes use for the test
 * signal. A thin own-execution adapter: it asks git whether any tracked source
 * has uncommitted changes as a cheap, side-effect-free local proxy for "tests
 * as last committed", rather than running the full suite once per node. Reports
 * a simple status string; QA (#2372) verifies the concrete signal.
 */
const vitestSensor: Sensor = {
  name: "vitest",
  read(): string {
    try {
      execFileSync("git", ["diff", "--quiet", "HEAD"], execOpts);
      return "tests: pass";
    } catch {
      return "tests: uncommitted changes";
    }
  },
};

/**
 * Own-use sensor — name `"git"`. Reports a local own-use signal: whether the
 * working tree is clean. A clean tree is the author's own-execution evidence
 * that committed work is the live state.
 */
const gitSensor: Sensor = {
  name: "git",
  read(): string {
    try {
      const out = execFileSync("git", ["status", "--porcelain"], execOpts);
      return out.trim() === "" ? "git: clean" : "git: dirty";
    } catch {
      return "git: unknown";
    }
  },
};

// --- token-economy sensor ----------------------------------------------------
// Name `"token-economy"` — the sensor `strategy-token-economy` names in its
// `success_signal.sensor`. The reading is dual, matching the strategy's dual
// signal: weekly prepaid-allowance utilization plus claude-eligible tactic
// velocity over a trailing window. Format (stable and parseable):
//   `utilization: <p>% weekly; tactics 28d: <c> created / <d> closed (net <±n>)`
// with either half degrading to `unknown` on a local failure — never a throw
// (total-sensor contract above).

/**
 * Where the statusline hook (`update-rate-limits.sh`) persists harness
 * telemetry. `TOKEN_ECONOMY_RATE_LIMITS_PATH` overrides for tests, mirroring
 * `DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH` in `dispatch-target-workers`.
 */
const RATE_LIMITS_DEFAULT_PATH = join(
  homedir(),
  ".local",
  "share",
  "commons-dispatch",
  "rate_limits.json",
);

/** Trailing window, in days, for the tactic-velocity half of the reading. */
const VELOCITY_WINDOW_DAYS = 28;

/**
 * Narrows `unknown` to a plain object without an `as` cast. Mirrors the
 * `isPlainObject`/`isPlainObjectLike` type-predicate pattern already used in
 * `../src/schema.ts` and `../src/attention.ts` for the same JSON-narrowing
 * need.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Utilization half: the pre-computed weekly used-percentage from the telemetry
 * file's `.seven_day.used_percentage` — no math here, the statusline hook
 * already computed it. Sanitization mirrors dispatch-target-workers: accept a
 * number or a plain numeric string; anything non-numeric, negative, or above
 * 100 is treated as missing. A missing file, field, or malformed value reads
 * as `"unknown"`, never a throw.
 */
export function readWeeklyUtilization(rateLimitsPath: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(rateLimitsPath, "utf8"));
  } catch {
    return "unknown";
  }
  if (!isPlainObject(parsed)) {
    return "unknown";
  }
  const sevenDay = parsed.seven_day;
  if (!isPlainObject(sevenDay)) {
    return "unknown";
  }
  const used = sevenDay.used_percentage;
  const value =
    typeof used === "number"
      ? used
      : typeof used === "string" && /^[0-9]+(\.[0-9]+)?$/.test(used)
        ? Number(used)
        : NaN;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return "unknown";
  }
  return `${value}% weekly`;
}

/**
 * Velocity half: claude-eligible tactic flow derived from the local clone's
 * `intentions/` git history over a trailing window.
 *
 *  - Created = a commit adding an `intentions/tactic-*.md` whose frontmatter
 *    declares `owner: ai`. Draft tactics (`status: raw`, no phase) count —
 *    they are claude-eligible work entering the graph.
 *  - Closed = a commit setting such a node's `phase` to `done` (the added
 *    `phase: done` frontmatter line) or deleting the file (gated on the
 *    removed `owner: ai` line, so only claude-eligible nodes count). The
 *    phase-transition diff line carries no ownership context (`owner` is
 *    rarely touched in the same commit), so that half is gated by reading
 *    the file's content as of that commit (`git show <commit>:<path>`) and
 *    checking it declares `owner: ai` — otherwise a human-owned tactic that
 *    also carries a dispatch `phase` (e.g. a main-qa or reading-review node)
 *    would inflate claude-eligible closure velocity.
 *
 * Both are line-level patch heuristics over `git log -p`, deduplicated by
 * path; a git failure (not a repo, no commits) reads as `"unknown"`.
 */
export function readTacticVelocity(
  repoDir: string,
  windowDays: number = VELOCITY_WINDOW_DAYS,
): string {
  let patch: string;
  try {
    patch = execFileSync(
      "git",
      [
        "log",
        `--since=${windowDays} days ago`,
        "--diff-filter=AMD",
        "--no-renames",
        "--format=%H",
        "-p",
        "--",
        "intentions/tactic-*.md",
      ],
      {
        cwd: repoDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 64 * 1024 * 1024,
      },
    );
  } catch {
    return "unknown";
  }

  /**
   * Whether `filePath` is an `owner: ai` node as of `commitHash`. Only
   * called for the phase:done-transition case (see doc comment above); a
   * failed lookup (e.g. the path is somehow unresolvable at that commit)
   * degrades to "not ai-owned" rather than throwing, honoring the total
   * sensor contract.
   */
  function isAiOwnedAt(commitHash: string, filePath: string): boolean {
    try {
      const content = execFileSync("git", ["show", `${commitHash}:${filePath}`], {
        cwd: repoDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return /^owner:\s*ai\s*$/m.test(content);
    } catch {
      return false;
    }
  }

  const created = new Set<string>();
  const closed = new Set<string>();
  let commit: string | null = null;
  let path: string | null = null;
  let isNewFile = false;
  let isDeletedFile = false;

  for (const line of patch.split("\n")) {
    if (/^[0-9a-f]{40}$/.test(line)) {
      commit = line;
      continue;
    }
    const header = /^diff --git a\/(\S+) b\/(\S+)$/.exec(line);
    if (header !== null) {
      path = header[2];
      isNewFile = false;
      isDeletedFile = false;
      continue;
    }
    if (path === null) {
      continue;
    }
    if (line.startsWith("new file mode")) {
      isNewFile = true;
      continue;
    }
    if (line.startsWith("deleted file mode")) {
      isDeletedFile = true;
      continue;
    }
    if (isNewFile && /^\+owner:\s*ai\s*$/.test(line)) {
      created.add(path);
      continue;
    }
    if (isDeletedFile && /^-owner:\s*ai\s*$/.test(line)) {
      closed.add(path);
      continue;
    }
    if (
      !isDeletedFile &&
      commit !== null &&
      /^\+\s*phase:\s*done\s*$/.test(line) &&
      isAiOwnedAt(commit, path)
    ) {
      closed.add(path);
    }
  }

  const net = created.size - closed.size;
  const signedNet = net >= 0 ? `+${net}` : `${net}`;
  return `${created.size} created / ${closed.size} closed (net ${signedNet})`;
}

/**
 * Compose the full token-economy reading from its two halves. Exported for
 * unit tests, which inject fixture telemetry and a fixture git repo.
 */
export function readTokenEconomy(
  rateLimitsPath: string,
  repoDir: string,
  windowDays: number = VELOCITY_WINDOW_DAYS,
): string {
  return (
    `utilization: ${readWeeklyUtilization(rateLimitsPath)}; ` +
    `tactics ${windowDays}d: ${readTacticVelocity(repoDir, windowDays)}`
  );
}

const tokenEconomySensor: Sensor = {
  name: "token-economy",
  read(): string {
    const rateLimitsPath =
      process.env.TOKEN_ECONOMY_RATE_LIMITS_PATH ?? RATE_LIMITS_DEFAULT_PATH;
    return readTokenEconomy(rateLimitsPath, repoRoot);
  },
};

// --- lifecycle sensor --------------------------------------------------------
// Name is the exact `success_signal.sensor` string
// `strategy-graph-native-dispatch` declares — the driver resolves a sensor by
// that verbatim name (`token-economy` uses the same match-the-declared-name
// contract). The reading is dual, mirroring the strategy's dual source:
//   (a) the phase-transition history in the local `intentions/` git log, and
//   (b) the router's own selection log (emitted by graph-select-target).
// Format (stable and parseable):
//   `lifecycle: <id> implement→qa→review→done (<YYYY-MM-DD>); router selections: <R> records, <D> nodes`
// with the lifecycle half degrading to `none yet` (no completed graph-native
// tactic lifecycle in history) and the selections half to `unknown` (missing or
// unreadable log) — never a throw (total-sensor contract above).

/** The verbatim `success_signal.sensor` name on strategy-graph-native-dispatch. */
const LIFECYCLE_SENSOR_NAME = "the intention store and the router's selection log";

/**
 * Phases a graph-native tactic passes through; a full lifecycle observes ALL of
 * them for one node. A graph-native lifecycle IS gh-free by construction — its
 * phase transitions live as `intentions/*.md` commits, not gh labels — so
 * observing a completed node in this history satisfies the observable's "no
 * GitHub label or issue required" clause without a gh query.
 */
const LIFECYCLE_REQUIRED_PHASES = ["implement", "qa", "review", "done"] as const;

/**
 * Where graph-select-target appends its selection log. Mirrors that script's
 * default (`$HOME/.local/share/commons-dispatch/graph-selection.jsonl`);
 * `DISPATCH_SELECTION_LOG_FILE` / `DISPATCH_SELECTION_LOG_DIR` override it,
 * matching the script's env contract and enabling fixture injection in tests.
 */
const SELECTION_LOG_DEFAULT_PATH = join(
  homedir(),
  ".local",
  "share",
  "commons-dispatch",
  "graph-selection.jsonl",
);

/**
 * Lifecycle half: the latest full graph-native tactic lifecycle observed in the
 * local clone's `intentions/` git history. A single line-level patch pass over
 * `git log -p` collects, per tactic path, the set of phases it transitioned
 * through (added `+phase: <x>` lines) and the date of its latest `phase: done`
 * transition. The `done` recognition is gated on the node declaring `owner: ai`
 * as of that commit (`git show <commit>:<path>`), so a human-owned node that
 * also carries a dispatch phase (a main-qa or reading-review node) cannot count
 * — the same ownership gate `readTacticVelocity` applies to closures.
 *
 * A node counts as a full lifecycle only when its phase set contains every
 * `LIFECYCLE_REQUIRED_PHASES` entry; among those, the one with the latest
 * `done` date wins. Reads `none yet` when no node qualifies, and `unknown` when
 * git history is unavailable (not a repo, no commits) — never a throw.
 */
export function readLifecyclePhaseHistory(repoDir: string): string {
  let patch: string;
  try {
    patch = execFileSync(
      "git",
      [
        "log",
        "--diff-filter=AM",
        "--no-renames",
        "--format=%H %cI",
        "-p",
        "--",
        "intentions/tactic-*.md",
      ],
      {
        cwd: repoDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 64 * 1024 * 1024,
      },
    );
  } catch {
    return "unknown";
  }

  /**
   * Whether `filePath` declares `owner: ai` as of `commitHash`. A failed lookup
   * degrades to "not ai-owned" rather than throwing, honoring the total-sensor
   * contract (mirrors `readTacticVelocity`'s `isAiOwnedAt`).
   */
  function isAiOwnedAt(commitHash: string, filePath: string): boolean {
    try {
      const content = execFileSync("git", ["show", `${commitHash}:${filePath}`], {
        cwd: repoDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return /^owner:\s*ai\s*$/m.test(content);
    } catch {
      return false;
    }
  }

  const phasesByPath = new Map<string, Set<string>>();
  const doneDateByPath = new Map<string, string>(); // YYYY-MM-DD of latest owner:ai done
  let commit: string | null = null;
  let commitDate: string | null = null;
  let path: string | null = null;

  for (const line of patch.split("\n")) {
    const commitLine = /^([0-9a-f]{40}) (\S+)$/.exec(line);
    if (commitLine !== null) {
      commit = commitLine[1];
      commitDate = commitLine[2];
      continue;
    }
    const header = /^diff --git a\/(\S+) b\/(\S+)$/.exec(line);
    if (header !== null) {
      path = header[2];
      continue;
    }
    if (path === null) {
      continue;
    }
    const phaseAdd = /^\+\s*phase:\s*(\S+)\s*$/.exec(line);
    if (phaseAdd === null) {
      continue;
    }
    const phase = phaseAdd[1];
    let set = phasesByPath.get(path);
    if (set === undefined) {
      set = new Set<string>();
      phasesByPath.set(path, set);
    }
    set.add(phase);
    if (phase === "done" && commit !== null && isAiOwnedAt(commit, path)) {
      const day = (commitDate ?? "").slice(0, 10);
      const prev = doneDateByPath.get(path);
      if (prev === undefined || day > prev) {
        doneDateByPath.set(path, day);
      }
    }
  }

  let bestPath: string | null = null;
  let bestDate = "";
  for (const [candidatePath, day] of doneDateByPath) {
    const set = phasesByPath.get(candidatePath);
    if (set === undefined) {
      continue;
    }
    if (!LIFECYCLE_REQUIRED_PHASES.every((ph) => set.has(ph))) {
      continue;
    }
    if (bestPath === null || day > bestDate) {
      bestPath = candidatePath;
      bestDate = day;
    }
  }

  if (bestPath === null) {
    return "none yet";
  }
  const id = bestPath.replace(/^intentions\//, "").replace(/\.md$/, "");
  return `${id} implement→qa→review→done (${bestDate})`;
}

/**
 * Selections half: a summary of the router's own selection log, the JSONL file
 * `graph-select-target` appends one record per invocation to. Counts total
 * records and the distinct node ids across every record's `selected` array —
 * the corroborating evidence that the router autonomously drove nodes through
 * the lifecycle observed above. Malformed lines are skipped (best-effort log,
 * like the appender); a missing or unreadable file reads `unknown`, never a
 * throw.
 */
export function readSelectionLog(selectionLogPath: string): string {
  let content: string;
  try {
    content = readFileSync(selectionLogPath, "utf8");
  } catch {
    return "unknown";
  }
  let records = 0;
  const nodes = new Set<string>();
  for (const line of content.split("\n")) {
    if (line.trim() === "") {
      continue;
    }
    let record: unknown;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (!isPlainObject(record)) {
      continue;
    }
    records += 1;
    const selected = record.selected;
    if (Array.isArray(selected)) {
      for (const id of selected) {
        if (typeof id === "string") {
          nodes.add(id);
        }
      }
    }
  }
  return `${records} records, ${nodes.size} nodes`;
}

/**
 * Compose the full lifecycle reading from its two halves. Exported for unit
 * tests, which inject a fixture git repo and a fixture selection log.
 */
export function readLifecycleReading(repoDir: string, selectionLogPath: string): string {
  return (
    `lifecycle: ${readLifecyclePhaseHistory(repoDir)}; ` +
    `router selections: ${readSelectionLog(selectionLogPath)}`
  );
}

const lifecycleSensor: Sensor = {
  name: LIFECYCLE_SENSOR_NAME,
  read(): string {
    const selectionLogPath =
      process.env.DISPATCH_SELECTION_LOG_FILE ??
      (process.env.DISPATCH_SELECTION_LOG_DIR !== undefined
        ? join(process.env.DISPATCH_SELECTION_LOG_DIR, "graph-selection.jsonl")
        : SELECTION_LOG_DEFAULT_PATH);
    return readLifecycleReading(repoRoot, selectionLogPath);
  },
};

// --- Delegation-records sensor ---------------------------------------------
// Reads every `kind: delegation` record's exercise state into a compact
// aggregate for `strategy-exercise-recovery-paths` (whose success_signal names
// this sensor). Local store reads only — no network, no git, no analytics.

/**
 * The exact `success_signal.sensor` string on
 * `intentions/strategy-exercise-recovery-paths.md`. Registry resolution is by
 * verbatim string match (`src/sensors.ts` `SensorRegistry.resolve`), so this
 * constant MUST equal that node's `success_signal.sensor` character-for-character.
 */
const DELEGATION_RECORDS_SENSOR_NAME = "the delegation records themselves";

/**
 * One delegation record's exercise-relevant fields, extracted from the free-form
 * `attributes` of a `kind: delegation` node. The shared extraction that the
 * aggregate reading and the `--report` table both read from (and that the
 * later attention surface, `tactic-delegation-capture-visibility`, can reuse).
 */
export interface DelegationRecordReading {
  id: string;
  origin: string;
  lastExercised: string | null;
  lastAssessed: string;
  nonDelegableFloor: string;
  reviewTrigger: string;
}

/** Guard a required non-empty string attribute, naming the record on failure. */
function requireAttrString(attrs: Record<string, unknown>, key: string, id: string): string {
  const value = attrs[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new IntentionSchemaError(
      `Delegation record "${id}" attributes.${key} must be a non-empty string, got ${typeof value}.`,
    );
  }
  return value;
}

/**
 * Read every `kind: delegation` node from the store and extract its
 * exercise-relevant fields. Validates the free-form `attributes` shape at this
 * boundary and throws `IntentionSchemaError` naming the malformed record.
 *
 * A schema-invalid delegation record is a real graph defect, so this
 * deliberately HALTS rather than degrading to a status string — the honest
 * failure for a misconfigured input (`.claude/rules/code-style.md`). This is
 * the intended exception to the "sensor read must be total" convention above:
 * that convention shields against transient local-command failures (git
 * unavailable), not against structurally invalid graph data.
 */
export function readDelegationRecords(dir: string): DelegationRecordReading[] {
  const records: DelegationRecordReading[] = [];
  for (const node of listNodes(dir)) {
    if (node.kind !== "delegation") {
      continue;
    }
    const attrs = node.attributes;
    const origin = requireAttrString(attrs, "origin", node.id);
    const lastAssessed = requireAttrString(attrs, "last_assessed", node.id);
    const nonDelegableFloor = requireAttrString(attrs, "non_delegable_floor", node.id);
    const reviewTrigger = requireAttrString(attrs, "review_trigger", node.id);

    const irreversibility = attrs.irreversibility;
    if (typeof irreversibility !== "object" || irreversibility === null) {
      throw new IntentionSchemaError(
        `Delegation record "${node.id}" attributes.irreversibility must be an object.`,
      );
    }
    if (!("last_exercised" in irreversibility)) {
      throw new IntentionSchemaError(
        `Delegation record "${node.id}" attributes.irreversibility is missing last_exercised.`,
      );
    }
    const rawLastExercised = (irreversibility as Record<string, unknown>).last_exercised;
    if (rawLastExercised !== null && typeof rawLastExercised !== "string") {
      throw new IntentionSchemaError(
        `Delegation record "${node.id}" attributes.irreversibility.last_exercised must be a ` +
          `string or null, got ${typeof rawLastExercised}.`,
      );
    }

    records.push({
      id: node.id,
      origin,
      lastExercised: rawLastExercised,
      lastAssessed,
      nonDelegableFloor,
      reviewTrigger,
    });
  }
  return records;
}

/**
 * The compact aggregate reading that lands on the strategy's `reading`. Declined
 * records (`origin: declined`) are counted as their own class — never as
 * unexercised: per the strategy's 2026-07-11 clarification and kind-delegation's
 * abstention doctrine a declined delegation has no entered path to walk, so the
 * portfolio review (not a drill) is its exercise. The denominator M is the total
 * record count so the reader sees how many of ALL records are exercised, with
 * the declined class broken out. Includes the read date so the fresh-reading
 * gate can compare against the strategy's `rounds.last_completed`.
 */
export function readDelegationRecordsReading(dir: string, today: Date = new Date()): string {
  const records = readDelegationRecords(dir);
  const total = records.length;
  const declined = records.filter((r) => r.origin === "declined");
  const active = records.filter((r) => r.origin !== "declined");
  const exercised = active.filter((r) => r.lastExercised !== null);
  const oldestAssessed = records.reduce<string | null>(
    (min, r) => (min === null || r.lastAssessed < min ? r.lastAssessed : min),
    null,
  );
  const readDate = today.toISOString().slice(0, 10);
  return (
    `${exercised.length} of ${total} delegation records exercised (last_exercised set); ` +
    `${declined.length} declined-origin (no entered path to exercise); ` +
    `oldest last_assessed ${oldestAssessed ?? "none"} (sensor read ${readDate})`
  );
}

/** Escape a free-form prose cell so it cannot break the markdown table. */
function escapeReportCell(value: string): string {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

/**
 * A markdown table over the same extraction — one row per delegation record —
 * for the human portfolio review (`tactic-recovery-portfolio-review`). Local
 * store reads only; no Firestore, no network.
 */
export function renderDelegationRecordsReport(dir: string): string {
  const records = readDelegationRecords(dir);
  const header =
    "| id | origin | last_exercised | last_assessed | non_delegable_floor | review_trigger |\n" +
    "| --- | --- | --- | --- | --- | --- |";
  const rows = records.map(
    (r) =>
      `| ${r.id} | ${r.origin} | ${r.lastExercised ?? "null"} | ${r.lastAssessed} | ` +
      `${escapeReportCell(r.nonDelegableFloor)} | ${escapeReportCell(r.reviewTrigger)} |`,
  );
  return [header, ...rows].join("\n");
}

const delegationRecordsSensor: Sensor = {
  name: DELEGATION_RECORDS_SENSOR_NAME,
  read(): string {
    return readDelegationRecordsReading(intentionsDir);
  },
};

/**
 * Build the default registry of local-first own-execution sensors. Exported so
 * the registration set can be unit-tested (verification deferred to #2372/QA).
 */
export function buildDefaultRegistry(): SensorRegistry {
  const registry = new SensorRegistry();
  registry.register(vitestSensor);
  registry.register(gitSensor);
  registry.register(tokenEconomySensor);
  registry.register(lifecycleSensor);
  registry.register(delegationRecordsSensor);
  return registry;
}

// --- Core driver -----------------------------------------------------------

/** Summary of one frontier-sensor pass, returned for testability and printing. */
export interface ReadSummary {
  read: number; // nodes whose sensor was read and written back
  skippedNoSignal: number; // frontier nodes with no success_signal (nothing to read)
  unregistered: { id: string; sensor: string }[]; // named a sensor not in the registry
}

/**
 * Walk the active frontier and, for each node that names a registered sensor,
 * read the sensor, derive the gap against the FRESH reading, and write the node
 * back preserving all other fields. Nodes with no signal are skipped silently;
 * nodes naming an unregistered sensor are collected for reporting (never crash,
 * never silently skipped). Exported for later unit testing.
 */
export function readFrontierSensors(dir: string, registry: SensorRegistry): ReadSummary {
  const summary: ReadSummary = { read: 0, skippedNoSignal: 0, unregistered: [] };

  for (const { node } of projectGoals(listNodes(dir))) {
    if (node.success_signal === null) {
      // No signal named — there is genuinely nothing to read. Not reported.
      summary.skippedNoSignal += 1;
      continue;
    }

    let sensor: Sensor;
    try {
      sensor = registry.resolve(node.success_signal.sensor);
    } catch (err) {
      // An unregistered sensor name is the honest middle path: collect and
      // report at the end. A non-schema error is a real bug — re-throw it.
      if (err instanceof IntentionSchemaError) {
        summary.unregistered.push({ id: node.id, sensor: node.success_signal.sensor });
        continue;
      }
      throw err;
    }

    const reading = sensor.read(node);
    const gap = deriveGap({ ...node, reading });
    writeNode(dir, { ...node, reading, gap });
    summary.read += 1;
  }

  return summary;
}

// --- Main ------------------------------------------------------------------

function main(): void {
  // `--report`: print the per-record delegation portfolio table and exit. No
  // frontier read, no writes — a read-only view for the human portfolio review.
  if (process.argv.includes("--report")) {
    process.stdout.write(renderDelegationRecordsReport(intentionsDir) + "\n");
    return;
  }

  const registry = buildDefaultRegistry();
  const summary = readFrontierSensors(intentionsDir, registry);

  process.stdout.write(
    `read-sensors: ${summary.read} read/written, ` +
      `${summary.skippedNoSignal} skipped (no signal), ` +
      `${summary.unregistered.length} skipped (unregistered sensor)\n`,
  );

  if (summary.unregistered.length > 0) {
    const listed = summary.unregistered
      .map((u) => `${u.id}(${u.sensor})`)
      .sort()
      .join(", ");
    process.stderr.write(
      `skipped ${summary.unregistered.length} nodes naming unregistered sensors: ${listed}\n`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
