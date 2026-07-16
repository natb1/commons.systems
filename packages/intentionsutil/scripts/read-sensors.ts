// Read the local-first default sensors over every node in the store and write
// each node's fresh `reading` + derived `gap` back to the local `intentions/`
// store.
//
// This is the batch driver for the feedback arm's READ step: for every node in
// the store that names a `success_signal.sensor`, it resolves that sensor in
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
import { SensorRegistry, deriveGap, type Sensor } from "../src/sensors.js";
import { IntentionSchemaError } from "../src/errors.js";
import type { IntentionNode } from "../src/schema.js";
import { computeDependencyAudit } from "./dependency-audit.js";

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

// --- dependency-audit sensor -------------------------------------------------
// Name is the exact `success_signal.sensor` string `strategy-owned-web-platform`
// declares — the driver resolves a sensor by that verbatim name (same
// match-the-declared-name contract as `token-economy`/lifecycle above). The
// reading measures the third-party runtime dependency surface against its
// recorded justifications (`dependency-justifications.ts`): total count,
// unjustified count, dead-upstream count. Unlike the other sensors in this
// file — which are already-total library/git calls — `computeDependencyAudit`
// intentionally THROWS on a genuine manifest read error (a misconfigured
// environment, per `.claude/rules/code-style.md`), by design so a caller can
// choose how to handle it. This sensor is that caller: its `read()` wraps the
// call in try/catch so a thrown error degrades to an honest status string
// rather than propagating and aborting the whole batch (the total-sensor
// contract documented at the top of this file).

/** The verbatim `success_signal.sensor` name strategy-owned-web-platform declares. */
const DEPENDENCY_AUDIT_SENSOR_NAME =
  "dependency audit script over the workspace manifests (extending the knip ratchet), reviewed at office-hours";

const dependencyAuditSensor: Sensor = {
  name: DEPENDENCY_AUDIT_SENSOR_NAME,
  read(): string {
    try {
      return computeDependencyAudit(repoRoot).summaryLine;
    } catch (err) {
      return `dependency audit: read error — ${String(err)}`;
    }
  },
};

// --- intention-store sensor --------------------------------------------------
// The verbatim `success_signal.sensor` name strategy-graph-drives-dispatch
// declares, and the store's self-measuring sensor: it counts how many open
// tactics carry a serves edge and how many sensor-naming strategies have a
// reading — the two quantities that strategy's threshold names ("every open
// tactic carries a non-empty serves edge and sensor-run readings exist for
// every strategy that names a sensor"). Per strategy clarification 7
// (2026-07-11): a sensor-naming strategy counts as read when its `reading` is
// non-null — reading provenance is not recorded in frontmatter, so existence is
// the deliberate mechanical proxy for a sensor-run — and the sensor separately
// reports how many name a sensor absent from the registry.

/** The verbatim `success_signal.sensor` name strategy-graph-drives-dispatch declares. */
export const INTENTION_STORE_SENSOR_NAME = "the intention store itself";

/**
 * Open-tactic serves coverage: over `kind === "tactic"` nodes carrying an open
 * dispatch phase (`phase !== null && phase !== "done"`), count how many carry a
 * non-empty `serves` edge. Exported (like `readTokenEconomy`) for unit testing
 * over fixture node arrays.
 */
export function openTacticServesCoverage(nodes: IntentionNode[]): {
  withServes: number;
  open: number;
} {
  let withServes = 0;
  let open = 0;
  for (const node of nodes) {
    if (node.kind !== "tactic") {
      continue;
    }
    if (node.phase === null || node.phase === "done") {
      continue;
    }
    open += 1;
    if (node.serves.length > 0) {
      withServes += 1;
    }
  }
  return { withServes, open };
}

/**
 * Sensor-reading coverage: over `kind === "strategy"` nodes that name a success
 * signal (`success_signal !== null`), return `{ read, total, unregistered }`:
 * `read` counts nodes whose `reading` is non-null (the clarification-7 proxy for
 * a sensor-run); `total` counts all sensor-naming strategies; `unregistered`
 * counts nodes whose `success_signal.sensor` is not in `registeredNames`.
 * Exported for unit testing over fixture node arrays.
 */
export function sensorReadingCoverage(
  nodes: IntentionNode[],
  registeredNames: ReadonlySet<string>,
): { read: number; total: number; unregistered: number } {
  let read = 0;
  let total = 0;
  let unregistered = 0;
  for (const node of nodes) {
    if (node.kind !== "strategy") {
      continue;
    }
    if (node.success_signal === null) {
      continue;
    }
    total += 1;
    if (node.reading !== null) {
      read += 1;
    }
    if (!registeredNames.has(node.success_signal.sensor)) {
      unregistered += 1;
    }
  }
  return { read, total, unregistered };
}

/**
 * Build the intention-store sensor — the store measuring itself. `read()` is
 * total (never throws — degrades to `"unknown"` on a load failure, per the
 * total-sensor contract above) and returns the stable format:
 *   `serves: <a>/<b> open tactic(s); readings: <c>/<d> sensor-naming strateg(y/ies) (<e> unregistered sensor(s))`
 * with each counted noun singular/plural to match its count. `getRegisteredNames`
 * yields the set of sensor names the driver's registry knows (including this
 * sensor's own name); it is queried at `read()` time so the set can never drift
 * from the actual registry membership. `loadNodes` reads the store — injected so
 * unit tests can supply fixture arrays without touching the live store.
 */
export function makeIntentionStoreSensor(
  getRegisteredNames: () => ReadonlySet<string>,
  loadNodes: () => IntentionNode[],
): Sensor {
  return {
    name: INTENTION_STORE_SENSOR_NAME,
    read(): string {
      let nodes: IntentionNode[];
      try {
        nodes = loadNodes();
      } catch {
        return "unknown";
      }
      const serves = openTacticServesCoverage(nodes);
      const readings = sensorReadingCoverage(nodes, getRegisteredNames());
      const openNoun = serves.open === 1 ? "tactic" : "tactics";
      const strategyNoun = readings.total === 1 ? "strategy" : "strategies";
      const sensorNoun = readings.unregistered === 1 ? "sensor" : "sensors";
      return (
        `serves: ${serves.withServes}/${serves.open} open ${openNoun}; ` +
        `readings: ${readings.read}/${readings.total} sensor-naming ${strategyNoun} ` +
        `(${readings.unregistered} unregistered ${sensorNoun})`
      );
    },
  };
}

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
  registry.register(dependencyAuditSensor);
  // Register the intention-store sensor last and have it derive the set of
  // registered sensor names from the registry itself at read() time — by then
  // the registry holds every sensor, including this one. Deriving the set (vs
  // hand-listing it) means the unregistered-sensor count can never drift from
  // the true registry membership if a future sensor is added above.
  registry.register(
    makeIntentionStoreSensor(
      () => registry.names(),
      () => listNodes(intentionsDir),
    ),
  );
  return registry;
}

// --- Core driver -----------------------------------------------------------

/** Summary of one store-sensor pass, returned for testability and printing. */
export interface ReadSummary {
  read: number; // nodes whose sensor was read and written back
  skippedNoSignal: number; // store nodes with no success_signal (nothing to read)
  unregistered: { id: string; sensor: string }[]; // named a sensor not in the registry
}

/**
 * Walk EVERY node in the store and, for each that names a registered sensor,
 * read the sensor, derive the gap against the FRESH reading, and write the node
 * back preserving all other fields. Nodes with no signal are skipped silently;
 * nodes naming an unregistered sensor are collected for reporting (never crash,
 * never silently skipped). Exported for later unit testing.
 *
 * The scope is the whole store (`listNodes`), NOT the active frontier: the
 * strategy threshold quantifies over "every strategy that names a sensor", and
 * `activeFrontier` drops `status: "codified"` nodes and any node that is a
 * `parent` of another (goals.ts) — so a frontier scope could never write the
 * readings of codified or parent strategies (e.g. strategy-graph-drives-dispatch
 * is a parent; strategy-exercise-recovery-paths is codified). Frontier filtering
 * stays correct for goal projection; it was only wrong as the READ scope.
 */
export function readStoreSensors(dir: string, registry: SensorRegistry): ReadSummary {
  const summary: ReadSummary = { read: 0, skippedNoSignal: 0, unregistered: [] };

  // READ pass: compute every node's fresh reading against a single consistent
  // pre-run store snapshot, accumulating the updated nodes without writing any.
  // Deferring all writes to a second pass is what keeps a whole-store sensor
  // honest: the intention-store sensor re-reads the store while computing its
  // reading, and if writes happened inline here it would observe a store
  // partially mutated by earlier iterations — its serves/readings counts would
  // be an artifact of node iteration order rather than a clean snapshot. With
  // no writes during this pass, every such re-read sees the same unmutated
  // pre-run store.
  const updates: IntentionNode[] = [];
  for (const node of listNodes(dir)) {
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
    updates.push({ ...node, reading, gap });
  }

  // WRITE pass: persist every updated node now that all readings are computed.
  for (const updated of updates) {
    writeNode(dir, updated);
    summary.read += 1;
  }

  return summary;
}

// --- Main ------------------------------------------------------------------

function main(): void {
  const registry = buildDefaultRegistry();
  const summary = readStoreSensors(intentionsDir, registry);

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
