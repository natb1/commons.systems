// Read the local-first default sensors over every node in the store and write
// each node's fresh `reading` back to the local `intentions/` store. `gap` is
// derived on read (`deriveGap`, sensors.ts) from `reading` vs
// `success_signal.threshold` — it is never stored, so this driver does not
// compute or persist it.
//
// This is the batch driver for the feedback arm's READ step: for every node in
// the store that names a `success_signal.sensor`, it resolves that sensor in
// a registry, reads the current measurement, and persists `{ ...node, reading
// }` — preserving every other field. It reads
// only the local store and runs only local own-execution commands (no gh API,
// no analytics, no network) — with one deliberate exception: the main-health
// sensor below shells to `gh` to read the trunk's OWN check-run conclusions.
// That is still local-first own-execution in this driver's sense (it is the
// repo observing its OWN pipeline, not external/analytics activity), so it is
// registered here rather than living behind an opt-in flag like the FLAGGED
// external sensors described below.
//
// Three invocations, run from anywhere (the store dir is resolved relative to
// this file, not cwd — see the no-`--dir` note below):
//
//   node --import tsx/esm packages/intentionsutil/scripts/read-sensors.ts
//       Bare run. Reads every registered sensor and WRITES each fresh reading
//       back into the store. This is the only form that mutates `intentions/`.
//   node --import tsx/esm packages/intentionsutil/scripts/read-sensors.ts --dry-run
//       (`--check` is an accepted synonym.) Pure read of every sensor, with the
//       identical READ pass and identical reported counts. Makes NO write.
//   node --import tsx/esm packages/intentionsutil/scripts/read-sensors.ts --report
//       Pure read: prints the per-record delegation portfolio table. Makes NO
//       write, reads no sensor.
//
// Any other argument is a usage error (stderr + exit 1) — this driver never
// silently drops a flag it does not understand.
//
// THERE IS DELIBERATELY NO `--dir`. Unlike `validate-graph.ts` /
// `write-node.ts` / `dump-node.ts` / `clear-park` (the four scripts
// `strategy-graph-native-dispatch` clarification 242 scopes to the
// required-explicit-tree contract of clarification 194), this driver's store is
// FIXED to the checkout the script file itself lives in — `intentionsDir`
// below. The reason is mechanical, not a preference: `buildDefaultRegistry`
// takes no parameters and four registered sensors close over the module-level
// `intentionsDir`/`repoRoot` constants (`rsiSensor`, the delegation-records
// sensor, the ladder-terminus sensor, and the intention-store sensor). A
// `--dir` threaded only through `readStoreSensors` would produce a run that
// READS one store and WRITES another — strictly worse than an honest
// single-store driver, and the exact silent-wrong-result defect this file's
// argument handling exists to prevent. Honoring `--dir` properly means
// parameterizing `buildDefaultRegistry` and all four closures; that is filed as
// its own follow-on tactic, not done here. Until then the store in effect is
// printed on every run so it is never implicit, and `--dir` is rejected by name
// with that explanation rather than swallowed.
//
// SENSOR REGISTRATION PATTERN (documented once here, not enumerated per sensor):
// A Sensor is registered under the name nodes put in `success_signal.sensor`. A
// node naming sensor `"vitest"` is matched to the `"vitest"` sensor, and so on.
// Only LOCAL-FIRST own-execution sensors belong in this default registry —
// signals about one's own pipeline (CI/test status, the author's own use of an
// artifact), per the local-first / no-mining principle in
// `.claude/docs/signal-identification.md`. External sensors (site analytics,
// PageSpeed Insights, anything that observes activity beyond one's own
// execution) are FLAGGED, opt-in, and deliberately NOT registered here. They
// used to live in `.claude/skills/align-init/scripts/fetch-*.sh` behind
// explicit flags; those fetch scripts (fetch-analytics, fetch-psi,
// fetch-forks) were retired outright by `tactic-align-entrypoint-consolidation`
// and are not carried forward anywhere — see `origin/main` commit `44493733`
// for the pre-deletion `.claude/skills/align-init/SKILL.md` and scripts.
// Own-pipeline CI/check-run status is a different case: even where its probe
// (below, main-health) shells to `gh`, it observes the repo's OWN execution
// (own check-run conclusions), not external or analytics activity, so it is
// explicitly classed local-first and registered here despite the `no gh API`
// phrasing above, which describes the OTHER sensors in this file.
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
import { strategyBacklogBand } from "../src/census.js";
import { listNodesAtRef } from "./lib-store-at-ref.js";
import { SensorRegistry, type Sensor } from "../src/sensors.js";
import { attributeSpend, spendBucketsFrom } from "../src/spend.js";
import { IntentionSchemaError } from "../src/errors.js";
import type { IntentionNode } from "../src/schema.js";
import { computeDependencyAudit } from "./dependency-audit.js";
import { ladderTerminusCensus } from "../src/terminus.js";

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
const VITEST_SENSOR_NAME = "vitest";

const vitestSensor: Sensor = {
  name: VITEST_SENSOR_NAME,
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
const GIT_SENSOR_NAME = "git";

const gitSensor: Sensor = {
  name: GIT_SENSOR_NAME,
  read(): string {
    try {
      const out = execFileSync("git", ["status", "--porcelain"], execOpts);
      return out.trim() === "" ? "git: clean" : "git: dirty";
    } catch {
      return "git: unknown";
    }
  },
};

// --- main-health sensor ------------------------------------------------------
// Name `"main-health"` — the short canonical key `strategy-main-health` (and
// the tactic nodes the self-heal flow auto-creates) name in
// `success_signal.sensor` (same match-the-declared-name contract token-
// economy/lifecycle/intention-store use below). Own-pipeline CI/check-run
// status is a local-first own-execution sensor per this file's header comment,
// even though its probe shells out to `gh`: checking one's OWN repo's OWN
// check-run conclusions is the same "own pipeline" class as the vitest/git
// sensors above — it is distinct from the deliberately-excluded
// external/analytics sensors (site analytics, PageSpeed Insights, anything
// observing activity beyond one's own execution) that used to stay opt-in
// behind `.claude/skills/align-init/scripts/` — those fetch scripts were
// retired by `tactic-align-entrypoint-consolidation` (see `origin/main`
// commit `44493733` for the pre-deletion scripts).

/** The short canonical `success_signal.sensor` key this sensor registers under. */
const MAIN_HEALTH_SENSOR_NAME = "main-health";

/**
 * Exec options for `repo-health --main-broken-sha`, kept separate from the
 * shared `execOpts` above. `execOpts` backs this file's LOCAL-ONLY, no-network
 * commands (git diff/status); `repo-health --main-broken-sha` shells out to
 * `gh` (network + TLS) to probe origin/main's CI, so it gets its own binding —
 * same cwd/encoding/stdio shape, but a distinct name so a reader never mistakes
 * this sensor for one of the no-network ones.
 */
const ghExecOpts = {
  cwd: repoRoot,
  encoding: "utf8" as const,
  stdio: ["ignore", "pipe", "ignore"] as ["ignore", "pipe", "ignore"],
};

/**
 * Own-pipeline CI-status sensor. Shells to
 * `.claude/skills/dispatch-propagate/scripts/repo-health --main-broken-sha`,
 * which prints origin/main HEAD's full SHA on stdout when a check has failed,
 * and prints nothing when every check on that HEAD concludes success (or
 * neutral/skipped). Empty stdout maps to the exact `strategy-main-health`
 * `success_signal.threshold` string verbatim (though `deriveGap` compares
 * case/whitespace-insensitively, `sensors.ts:98-112`); non-empty stdout maps to
 * a fixed `red: <sha> ...` phrase — never raw log content. That green literal
 * stays the frozen threshold-matching case — no `strategy-main-health` edit is
 * needed by this unit.
 *
 * `repo-health --main-broken-sha` also exits non-zero (3) with the literal
 * stdout token `NO_ATTRIBUTABLE_CHECKS` when the attributable check-run/
 * workflow-run set for origin/main HEAD is empty or entirely misattributed to
 * another branch (fail-closed: cannot confirm green, but it's not a confirmed
 * red SHA either). That case reads as a distinct fixed `"unknown: ..."`
 * phrase, not the plain `"unknown"` used for any other invocation failure.
 * Either way, a `repo-health` invocation failure (non-zero exit) must not
 * throw (total-sensor contract above); both unknown readings can never equal
 * the threshold string, so `gap` stays non-null and the sensor fails safe
 * rather than reporting a false green.
 *
 * SIDE EFFECT: unlike the other sensors in this file, reading this one is not
 * pure. `repo-health --main-broken-sha` reconciles the durable `main_broken`
 * latch record as a documented side effect (red → set/refresh the sha, green →
 * clear it; `repo-health:59-65`). So naming the `main-health` sensor in a
 * `read-sensors` run mutates that latch state, not just the node's
 * `reading`/`gap`. This coupling is intentional — the latch and the sensor
 * reading are two views of the same origin/main CI status — but it means this
 * sensor breaks the file header's "no side-effect" promise in addition to its
 * "no network" one.
 */
/**
 * Standalone probe body, extracted so tests can exercise all three branches
 * (green/red/unknown) against a fake `binaryPath` without shelling to the
 * real `repo-health` script. `mainHealthSensor.read()` below is a thin
 * wrapper that supplies the real default path. Exported for unit tests
 * (mirrors `readWeeklyUtilization`, `readTacticVelocity`, etc. above).
 */
export function readMainHealth(binaryPath: string): string {
  let sha: string;
  try {
    sha = execFileSync(binaryPath, ["--main-broken-sha"], ghExecOpts).trim();
  } catch (err: unknown) {
    if (
      isPlainObject(err) &&
      typeof err.stdout === "string" &&
      err.stdout.trim() === "NO_ATTRIBUTABLE_CHECKS"
    ) {
      return "unknown: no check on the current origin/main HEAD is attributable to main's own workflow (empty or misattributed check set) — cannot confirm green";
    }
    return "unknown";
  }
  if (sha === "") {
    return "green: every check on the current origin/main HEAD concludes success (or neutral/skipped)";
  }
  return `red: ${sha} has one or more failing checks`;
}

const mainHealthSensor: Sensor = {
  name: MAIN_HEALTH_SENSOR_NAME,
  read(): string {
    return readMainHealth(
      join(repoRoot, ".claude", "skills", "dispatch-propagate", "scripts", "repo-health"),
    );
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
// contract). The reading has four segments, mirroring the strategy's sources:
//   (a) the phase-transition history in the local `intentions/` git log,
//   (b) the router's own selection log (emitted by graph-select-target),
//   (c) the CURRENT open machinery-defect backlog share over the tactic
//       population serving this strategy — the same classification
//       `align-tactics-census.ts` applies, reused from `../src/census.js`, and
//   (d) that same share SAMPLED BACKWARD through the `intentions/` git history,
//       so the band reads as a trend rather than a single instant.
// Format (stable and parseable):
//   `lifecycle: <id> implement→qa→review→done (<YYYY-MM-DD>); router selections: <R> records, <D> nodes; backlog: <B>/<T> = <P>% (band ≤35%); backlog series <W>d: <P1>% → <P2>% → … (<verdict>)`
// Every segment degrades independently and never throws (total-sensor contract
// above): the lifecycle half to `none yet`, the selections half to `unknown`
// (missing or unreadable log), the backlog half to `unknown` (store unreadable)
// or `0/0 = n/a` (no tactics serve the strategy yet), and the series to
// `unknown` (git history unavailable), `insufficient history` (fewer than two
// distinct sampled store states), or a per-sample `skipped` token (that
// historical ref's store does not read/validate).

/**
 * The verbatim `success_signal.sensor` name on strategy-graph-native-dispatch.
 * Load-bearing: this string is the registry key the anti-drift test
 * (lifecycle-sensor.test.ts) compares character-for-character against the
 * node's live `success_signal.sensor` frontmatter, and the same match is
 * asserted for every registered sensor by the registered-sensor rule
 * (validateRegisteredSensorNames in src/sensors.ts) — fatally in that unit
 * suite, and reported non-fatally by validate-graph.ts on the graph write
 * path, which must not be denied over a registry defect. Any edit to that field (including via /align) must be
 * mirrored here in the same round — while the two differ the sensor is
 * de-registered by name and reads nothing at all.
 *
 * The 2026-08-12 /align round (56039748) appended a fourth clause to the
 * recorded sensor — "a park-cause reading over office_hours.reason across
 * parked nodes counts /align-tactics parks attributable to an upstream
 * recording round's own record gap" — naming a reading this file does not
 * produce, which is exactly how the sensor went silent. That clause was
 * dropped from the node in the same change that wrote this comment: the
 * recorded sensor names the three readings below and nothing more, and the
 * park-cause observable belongs to its own node
 * (`tactic-park-cause-sensor-instrument`). Restore the clause here only if
 * this file grows the reading it names.
 */
export const LIFECYCLE_SENSOR_NAME =
  "the intention store and the router's selection log — align-tactics-census.ts enumerates the open machinery-defect population serving this strategy; the selection log carries lifecycle completions";

/** The band the recorded threshold declares ("at or below 35%"). */
export const BACKLOG_BAND_PCT = 35;

/** The strategy whose tactic population the band is measured over. */
const BACKLOG_STRATEGY_ID = "strategy-graph-native-dispatch";

/** Trailing window the backlog-share series samples over, and its step. */
const BACKLOG_SERIES_WINDOW_DAYS = 28;
const BACKLOG_SERIES_STEP_DAYS = 7;

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
 * Backlog half: the CURRENT open machinery-defect share over the tactic
 * population serving `strategyId`, against the band the recorded threshold
 * declares. Classification is `../src/census.js`'s `strategyBacklogBand` — the
 * same rules `align-tactics-census.ts` applies, so the sensor and the census
 * can never disagree.
 *
 * Enumeration uses the TOLERANT `listNodes` (a single unreadable node file must
 * not blind the whole reading), wrapped in try/catch so a missing or unreadable
 * store dir reads `unknown` rather than throwing — the total-sensor contract at
 * the top of this file. `total === 0` (no tactic serves the strategy yet) reads
 * `0/0 = n/a` rather than dividing by zero.
 */
export function readBacklogBand(storeDir: string, strategyId: string): string {
  let nodes: IntentionNode[];
  try {
    nodes = listNodes(storeDir);
  } catch {
    return "unknown";
  }
  const { backlog, total, pct } = strategyBacklogBand(nodes, strategyId);
  if (pct === null) {
    return `0/0 = n/a (band ≤${BACKLOG_BAND_PCT}%)`;
  }
  return `${backlog}/${total} = ${(pct * 100).toFixed(1)}% (band ≤${BACKLOG_BAND_PCT}%)`;
}

/**
 * Series half: the same backlog share sampled backward through the local
 * clone's `intentions/` git history, so the band reads as a trend rather than a
 * single instant. One sample per `stepDays` step across the trailing
 * `windowDays` window (28/7 → offsets 21, 14, 7, 0 days ago), each resolved to
 * the last `intentions/`-touching commit before that instant.
 *
 * Samples that resolve to no commit are dropped, and consecutive identical SHAs
 * are collapsed, so every element is a DISTINCT committed store state rather
 * than a repeated flat value.
 *
 * Failure posture matches `readTacticVelocity` / `readLifecyclePhaseHistory`: a
 * git failure (not a repo, no commits) reads `unknown`. Per sample, the read is
 * `listNodesAtRef`, which is STRICT and throws when any node at that historical
 * ref is unreadable or schema-invalid — a real possibility for old refs, so each
 * sample is caught individually and degrades to the literal token `skipped`
 * (as does a `null` pct: no tactic served the strategy at that ref). A throw
 * never propagates out of this function.
 *
 * The trend verdict is computed over the ROUNDED values actually printed, so
 * the rendered series and the verdict can never disagree through float noise.
 */
export function readBacklogSeries(
  repoDir: string,
  strategyId: string,
  windowDays: number = BACKLOG_SERIES_WINDOW_DAYS,
  stepDays: number = BACKLOG_SERIES_STEP_DAYS,
): string {
  const shas: string[] = [];
  try {
    for (let d = windowDays - stepDays; d >= 0; d -= stepDays) {
      const sha = execFileSync(
        "git",
        ["-C", repoDir, "rev-list", "-1", `--before=${d} days ago`, "HEAD", "--", "intentions"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      ).trim();
      if (sha === "") {
        continue;
      }
      if (shas.length > 0 && shas[shas.length - 1] === sha) {
        continue;
      }
      shas.push(sha);
    }
  } catch {
    return "unknown";
  }

  const rendered: string[] = [];
  const usable: number[] = [];
  for (const sha of shas) {
    let pct: number | null;
    try {
      pct = strategyBacklogBand(listNodesAtRef(repoDir, sha), strategyId).pct;
    } catch {
      rendered.push("skipped");
      continue;
    }
    if (pct === null) {
      rendered.push("skipped");
      continue;
    }
    const value = Number((pct * 100).toFixed(1));
    usable.push(value);
    rendered.push(`${value.toFixed(1)}%`);
  }

  if (usable.length < 2) {
    return "insufficient history";
  }
  let nonIncreasing = true;
  for (let i = 0; i + 1 < usable.length; i += 1) {
    if (usable[i + 1] > usable[i]) {
      nonIncreasing = false;
      break;
    }
  }
  return `${rendered.join(" → ")} (${nonIncreasing ? "non-increasing" : "increasing"})`;
}

/**
 * Compose the full lifecycle reading from its four segments. Exported for unit
 * tests, which inject a fixture git repo and a fixture selection log. The store
 * dir is derived from `repoDir` so the current band and the sampled history come
 * from the same repository.
 */
export function readLifecycleReading(
  repoDir: string,
  selectionLogPath: string,
  strategyId: string = BACKLOG_STRATEGY_ID,
): string {
  const storeDir = join(repoDir, "intentions");
  return (
    `lifecycle: ${readLifecyclePhaseHistory(repoDir)}; ` +
    `router selections: ${readSelectionLog(selectionLogPath)}; ` +
    `backlog: ${readBacklogBand(storeDir, strategyId)}; ` +
    `backlog series ${BACKLOG_SERIES_WINDOW_DAYS}d: ${readBacklogSeries(repoDir, strategyId)}`
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
//
// The caught error is NEVER interpolated into the returned reading. `main()`
// persists every reading into the node's `reading` field (and quotes it again
// in the derived `gap`), and those nodes are committed and pushed to a PUBLIC
// repository — so an environment-specific error string would publish local
// filesystem detail. The failure collapses to the same kind of fixed status
// token every other sensor in this file uses ("unknown"), and the detail goes
// to stderr, which the driver does not persist.

/** The verbatim `success_signal.sensor` name strategy-owned-web-platform declares. */
const DEPENDENCY_AUDIT_SENSOR_NAME =
  "dependency audit script over the workspace manifests (extending the knip ratchet), reviewed at office-hours";

const dependencyAuditSensor: Sensor = {
  name: DEPENDENCY_AUDIT_SENSOR_NAME,
  read(): string {
    try {
      return computeDependencyAudit(repoRoot).summaryLine;
    } catch (err) {
      // stderr only — not persisted into the node, so it may carry detail.
      console.error(`dependency audit sensor: read error — ${String(err)}`);
      return "dependency audit: unknown";
    }
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
    if (!isPlainObject(irreversibility)) {
      throw new IntentionSchemaError(
        `Delegation record "${node.id}" attributes.irreversibility must be an object.`,
      );
    }
    if (!("last_exercised" in irreversibility)) {
      throw new IntentionSchemaError(
        `Delegation record "${node.id}" attributes.irreversibility is missing last_exercised.`,
      );
    }
    const rawLastExercised = irreversibility.last_exercised;
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

// `readDelegationRecordsReading` lived here: a second, id-blind aggregate over
// the same records that no production path ever called. Its one live idea — the
// declined-origin class — now lives in `readExerciseRecoveryPathsReading` below,
// which is the reading that actually lands on a node. Deleted rather than kept
// as a spare renderer: two functions computing "how exercised is the portfolio"
// is two answers that can drift.

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

/**
 * The canonical MET reading for `strategy-exercise-recovery-paths` — the exact
 * string a satisfied threshold must equal.
 *
 * `deriveGap` (`src/sensors.ts`) is trimmed, case-insensitive STRING EQUALITY
 * and nothing else ("Equality is the only 'met' condition — no numeric or fuzzy
 * parsing"). So a reading that always carries live counts and the read date can
 * never equal any fixed threshold, and the strategy's gap would stay non-null
 * however complete the underlying work got. The met state therefore gets its
 * own frozen, DATE-FREE, COUNT-FREE literal — the same shape
 * `strategy-main-health` and `tactic-main-red-<sha>` use for their green
 * readings (`readMainHealth` above), and for the same reason.
 *
 * Copy this literal verbatim into the node's `success_signal.threshold`; do not
 * re-compose it by hand, or the equality silently never fires.
 *
 * On the missing date: the router's fresh-reading gate (`readingDate`,
 * `src/router.ts`) drops a strategy whose reading carries no parseable date,
 * but only once `rounds.last_aligned` is stamped, and only from ALIGN
 * SELECTION — the queue of strategies still owing decomposition rounds. A met
 * signal has no gap to decompose, so being passed over there is the correct
 * outcome, not starvation. The UNMET reading below keeps the date clause,
 * which is the state where selection matters.
 */
export const EXERCISE_RECOVERY_PATHS_MET_READING =
  "exercised: every non-declined delegation record has last_exercised set; " +
  "review_trigger firing not recorded";

/**
 * The `strategy-exercise-recovery-paths` branch, in two states.
 *
 * DECLINED-ORIGIN RECORDS ARE THEIR OWN CLASS and are never counted as
 * unexercised. Per `kind-delegation`'s abstention doctrine and this strategy's
 * 2026-07-11 clarification, a `origin: declined` delegation was never entered,
 * so there is no recovery path to walk and its `last_exercised` can never be
 * set. Counting it as unexercised makes the strategy's absolute threshold ("no
 * record's `last_exercised` is null") permanently unsatisfiable — the rule is
 * load-bearing, not a nicety. An earlier revision of this docstring rationalized
 * dropping it here ("this strategy's threshold just asks how many records have
 * `last_exercised` set"); that reasoning is overturned and must not come back.
 *
 * - MET (at least one active record, and no active record with a null
 *   `last_exercised`): the frozen `EXERCISE_RECOVERY_PATHS_MET_READING` literal
 *   above — no counts, no date, so it can equal a fixed threshold.
 *   The "at least one active record" conjunct is deliberate: an empty or
 *   all-declined store satisfies "every active record is exercised" vacuously,
 *   and reporting green off zero measured paths would be a false all-clear on
 *   exactly the condition this strategy exists to detect.
 * - UNMET: the live counts, over ACTIVE (non-declined) records with the declined
 *   class broken out, plus the read date the router's fresh-reading gate parses.
 *
 * The `review_trigger firing not recorded` clause is fixed prose in both states:
 * there is no firing/actioned surface on the records to mechanically detect a
 * "fired review_trigger left unactioned", so the reading says so rather than
 * guessing.
 */
export function readExerciseRecoveryPathsReading(dir: string, today: Date): string {
  const records = readDelegationRecords(dir);
  const declined = records.filter((r) => r.origin === "declined");
  const active = records.filter((r) => r.origin !== "declined");
  const exercised = active.filter((r) => r.lastExercised !== null);
  const unexercised = active.length - exercised.length;

  if (active.length > 0 && unexercised === 0) {
    return EXERCISE_RECOVERY_PATHS_MET_READING;
  }

  const readDate = today.toISOString().slice(0, 10);
  return (
    `exercised: ${exercised.length}/${active.length} active records ` +
    `(${declined.length} declined-origin excluded); ${unexercised} null last_exercised; ` +
    `review_trigger firing not recorded (sensor read ${readDate})`
  );
}

/**
 * The divergence levels `kind-delegation` declares for
 * `attributes.divergence.level` (`intentions/kind-delegation.md`:
 * `"divergence: {level: low|moderate|high, ...}"`).
 */
const DIVERGENCE_LEVELS = ["low", "moderate", "high"] as const;

/**
 * The declared divergence levels a `kind: delegation` node's
 * `attributes.divergence.level` names — or a HALT naming the record.
 *
 * The live corpus authors this field as compound free prose AROUND the declared
 * vocabulary (`low-moderate`, `moderate — would-be`), so the value is tokenized
 * on non-letter runs and each token matched against `DIVERGENCE_LEVELS` rather
 * than compared whole. A value naming NO declared level (`critical`, an empty
 * string, a restructured `divergence` object, a missing `divergence`) is a
 * schema-invalid delegation record — not a not-high-divergence one — and throws
 * `IntentionSchemaError` naming the record, exactly as `readDelegationRecords`
 * above does for the other delegation attributes.
 *
 * Deliberately fail-loud rather than defensively parsed: reading an
 * unrecognized level as "not high" would drop the record from both numerator
 * and denominator of `strategy-realign-attachments`' reading, turning a
 * one-word edit in an unprivileged data file into a silent all-clear on the
 * exact condition that strategy exists to detect — a fail-open measurement on
 * its own control (`.claude/rules/code-style.md`).
 */
function divergenceLevels(node: IntentionNode): Set<string> {
  const attrs = node.attributes;
  const divergence = isPlainObject(attrs) ? attrs.divergence : undefined;
  if (!isPlainObject(divergence)) {
    throw new IntentionSchemaError(
      `Delegation record "${node.id}" attributes.divergence must be an object naming a ` +
        `level in {${DIVERGENCE_LEVELS.join(", ")}}.`,
    );
  }
  const level = divergence.level;
  if (typeof level !== "string") {
    throw new IntentionSchemaError(
      `Delegation record "${node.id}" attributes.divergence.level must be a string, ` +
        `got ${typeof level}.`,
    );
  }
  const recognized = new Set(
    level
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((token): token is (typeof DIVERGENCE_LEVELS)[number] =>
        (DIVERGENCE_LEVELS as readonly string[]).includes(token),
      ),
  );
  if (recognized.size === 0) {
    throw new IntentionSchemaError(
      `Delegation record "${node.id}" attributes.divergence.level "${level}" names none of ` +
        `the declared levels {${DIVERGENCE_LEVELS.join(", ")}}.`,
    );
  }
  return recognized;
}

/**
 * True when a `kind: delegation` node's divergence level names `high` at all —
 * a compound value like `moderate-high` counts as high. Over-inclusion is the
 * safe direction for a monitoring control: a record that might be high belongs
 * in the uncovered list, never silently outside it.
 */
function isHighDivergence(node: IntentionNode): boolean {
  return divergenceLevels(node).has("high");
}

/**
 * The `strategy-realign-attachments` branch: over `kind: delegation` nodes with
 * high divergence, how many are covered by ANY node's `recovers` edge naming
 * that record's id. There is no "recorded re-alignment" attribute convention on
 * the ledger yet (per the strategy's own 2026-07-11-era clarification 7), so
 * only the `recovers`-edge half is mechanically checked — the reading does not
 * invent a convention that doesn't exist.
 *
 * Ends with `(sensor read <YYYY-MM-DD>)` for the same fresh-reading-gate reason
 * documented on `readExerciseRecoveryPathsReading` above: a reading with no
 * parseable date is dropped by the router's gate once `rounds.last_aligned` is
 * stamped, silently starving the strategy out of align selection.
 */
function readRealignAttachmentsReading(nodes: IntentionNode[], today: Date): string {
  const recoveredIds = new Set<string>();
  for (const node of nodes) {
    for (const id of node.recovers) {
      recoveredIds.add(id);
    }
  }
  const highDivergenceIds = nodes
    .filter((node) => node.kind === "delegation" && isHighDivergence(node))
    .map((node) => node.id);
  const h = highDivergenceIds.length;
  const covered = highDivergenceIds.filter((id) => recoveredIds.has(id));
  const c = covered.length;
  const uncovered = highDivergenceIds.filter((id) => !recoveredIds.has(id)).sort();
  const uncoveredList = uncovered.length > 0 ? uncovered.join(", ") : "none";
  const readDate = today.toISOString().slice(0, 10);
  return (
    `high-divergence: ${h} records; ${c} covered by recovers; ` +
    `uncovered: ${uncoveredList} (sensor read ${readDate})`
  );
}

/**
 * Build the delegation-records sensor. Dispatches on the asking node's `id`:
 * `strategy-exercise-recovery-paths` gets the plain exercised/null count,
 * `strategy-realign-attachments` gets the high-divergence/recovers-coverage
 * count, and any other id gets a total fallback string (never throws) rather
 * than the old id-blind generic aggregate — the two strategies' thresholds
 * measure different things and neither matched the old shared reading.
 * Both store reads are injected so unit tests never touch the live store:
 * `loadNodes` (same pattern as `makeIntentionStoreSensor`) feeds the
 * realign-attachments branch, and `recordsDir` — defaulting to the real
 * `intentionsDir` for production callers — feeds the exercise-recovery-paths
 * branch, which reads `readDelegationRecords` directly since its narrower
 * `DelegationRecordReading` shape is sufficient there (it doesn't need
 * `divergence`, which isn't in that shape).
 *
 * `now` is the third injection point: both readings stamp the read date the
 * router's fresh-reading gate parses, and it is read at `read()` time (not
 * build time) so a long-lived registry never stamps a stale date. Tests pin it
 * to a fixed clock so the asserted date clause cannot flake across UTC
 * midnight.
 */
export function makeDelegationRecordsSensor(
  loadNodes: () => IntentionNode[],
  recordsDir: string = intentionsDir,
  now: () => Date = () => new Date(),
): Sensor {
  return {
    name: DELEGATION_RECORDS_SENSOR_NAME,
    read(node): string {
      if (node.id === "strategy-exercise-recovery-paths") {
        return readExerciseRecoveryPathsReading(recordsDir, now());
      }
      if (node.id === "strategy-realign-attachments") {
        return readRealignAttachmentsReading(loadNodes(), now());
      }
      return `no per-node rule for ${node.id}`;
    },
  };
}

// --- ladder-terminus census sensor -------------------------------------------
// Measures the ladder-terminus predicate (tactic-ladder-terminus-owns-main-qa,
// `../src/terminus.ts`) over the whole store: how many merged-but-not-done
// nodes exist, split into legitimately excused (parked or blocked) and
// violation. STORE-WIDE like `makeIntentionStoreSensor` and
// `makeDelegationRecordsSensor` above — it counts over every node in the
// store, not one node's own fields — so it is built the same way, as a
// factory taking an injected `loadNodes` rather than a plain `Sensor`
// constant.
//
// Error discipline follows `dependencyAuditSensor` above, not the silent
// `"unknown"` degrade `makeIntentionStoreSensor` uses: `ladderTerminusCensus`
// itself is a pure function over an already-loaded node array and cannot
// throw, but the injected `loadNodes` call (a real store read in production)
// can — a missing/corrupt intentions dir, or a node `listNodes` cannot parse.
// That failure is caught here and degrades to a fixed status token; the
// caught error goes to stderr ONLY, never into the returned reading, because
// readings are committed to a public repo and an error string can carry a
// local filesystem path or stack trace.

/**
 * The verbatim `success_signal.sensor` string this sensor is registered
 * under. A later, separate step places this exact string as
 * `success_signal.sensor` on the tactic node that measures
 * tactic-ladder-terminus-owns-main-qa — not this file's job to edit that
 * node. Registry resolution is a verbatim string match
 * (`SensorRegistry.resolve` in `../src/sensors.ts`), so any drift — even
 * whitespace — silently de-registers this sensor.
 */
export const LADDER_TERMINUS_SENSOR_NAME =
  "ladder-terminus census over the intention store (merged-but-not-terminal count)";

/**
 * Build the ladder-terminus census sensor. `loadNodes` is injected — the same
 * pattern `makeDelegationRecordsSensor`/`makeIntentionStoreSensor` use — so
 * unit tests supply fixture arrays without touching the live store.
 */
export function makeLadderTerminusSensor(loadNodes: () => IntentionNode[]): Sensor {
  return {
    name: LADDER_TERMINUS_SENSOR_NAME,
    read(): string {
      try {
        const census = ladderTerminusCensus(loadNodes());
        return (
          `ladder terminus: ${census.mergedNotDone} merged-not-done, ` +
          `${census.excused} excused, ${census.violations} violations`
        );
      } catch (err) {
        // stderr only — not persisted into the node, so it may carry detail.
        console.error(`ladder terminus sensor: read error — ${String(err)}`);
        return "ladder terminus: unknown";
      }
    },
  };
}

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

// --- rsi sensor --------------------------------------------------------------
// Name is the exact `success_signal.sensor` string
// `strategy-recursive-self-improvement` declares — same match-the-declared-name
// contract as `token-economy`/lifecycle above.
//
// Why it is registered HERE rather than in a metrics registry of its own: that
// strategy's condition 8 says rsi metrics are "sensors registered in the graph's
// existing success_signal/readings machinery on their owning strategies — never
// a parallel metric registry". Registering here is what makes the strategy's own
// dated reading the measurement of record rather than a side system, and it
// drops the graph's standing unregistered-sensor count by one.
//
// Reading format (stable and parseable), one segment per IMPLEMENTED source the
// declared sensor names, plus the token attribution the fitness function needs:
//   `pause: <state>; backlog: <B>/<T> = <P>% (band ≤35%); parked: <N> (<M> blocked); worktrees: <W>; tokens <window>: dispatch <x>% / office-hours <y>% / rsi <z>%`
// Every segment degrades independently to `unknown` and never throws (the
// total-sensor contract at the top of this file).
//
// The declared name also carries three instruments that are NOT implemented and
// so contribute no segment: the find-or-recur write-surface lint, the
// sessions-per-invalid-state-episode reading, and the declared-remediation-list
// check. They are named in the constant deliberately — writing the final string
// once means each instrument can land later as a pure `read()` change, without
// re-touching the node prose and re-opening the de-registration window this
// file's RSI_SENSOR_NAME docstring describes. Until they land, the three
// matching `success_signal.threshold` clauses on
// `strategy-recursive-self-improvement` are registered and unread; the work is
// owed by `tactic-rsi-intervention-special-cases`.

/**
 * The verbatim `success_signal.sensor` name strategy-recursive-self-improvement
 * declares.
 *
 * The registry matches this against the node's prose character-for-character, so
 * any `/align` round that rewords the sensor field silently de-registers this
 * sensor — the node stops getting a reading and only shows up in read-sensors'
 * "skipped (unregistered sensor)" tail, which already runs 57 entries deep. That
 * is exactly what happened when the research lane was appended in `47219a1a`;
 * the trailing clause below is that amendment. Re-read the node's sensor field
 * before trusting a null reading here.
 *
 * LAND BOTH HALVES IN ONE COMMIT. An earlier version of this docstring said the
 * lockstep was "split across two commits, by construction" — this constant in a
 * code commit, the node prose separately through `graph-commit` — and called the
 * window between them expected rather than a defect. That was written before
 * `validateRegisteredSensorNames` existed. It is now wrong, and following it is
 * how the repo lost 54 minutes of graph writes on 2026-08-14: the rule then ran
 * FATALLY in the `guard` job of `graph-fast-path.yml`, every other required
 * context in that workflow carries `needs: guard`, so ONE unbound registered
 * name left four required checks non-success and `graph-commit` refused to land
 * — for every writer in the repo, on content that had nothing to do with
 * sensors. See
 * `tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes`.
 *
 * Both orderings break: prose-first leaves a registered name no node records,
 * constant-first leaves a node whose sensor matches nothing. `graph-commit`
 * cannot land the pair — it rebuilds on an `intentions/`-only base and strips
 * non-intentions changes. An ordinary PR touching both files can, and is the
 * only atomic path.
 *
 * Where an open window is now caught — and, just as important, where it is NOT.
 * `validate-graph.ts` REPORTS an unbound registered name and exits 0, so the
 * graph write path is no longer denied over it; it follows that the
 * `graph-validate` job, which runs that same script, can never go red on this
 * condition either. The ONE fatal gate is the unit suite
 * `test/lifecycle-sensor.test.ts` (against the live store), in the `unit-tests`
 * job. So the half of the pairing caught is a CONSTANT edit: a PR touching
 * `packages/intentionsutil` runs that suite and goes red.
 *
 * The other half is NOT caught. A node PROSE reword — an `/align` round
 * rewriting some node's `success_signal.sensor` — lands through a `graph/**`
 * push, and `unit-tests.yml` declares `branches-ignore: ['graph/**']`, so
 * neither the unit suite nor `graph-validate` ever runs for it. (`main` was in
 * that ignore list when this note was written; #3108 removed it, so the suite
 * DOES now run on `main` — the `graph/**` half, which is the half this note
 * turns on, is unchanged.) The reword
 * lands, CI is green, and the sensor reads `null` from then on with only a
 * stderr line in the fast path's `guard` log. Restoring a failing gate on that
 * half is deliberately deferred, not overlooked: the shape has to be ruled
 * (node-scoped fatal in `guard`, vs a post-merge check on `main`), and a
 * careless answer re-arms the repo-wide denial described above. Until it is
 * ruled, the UNREGISTERED-SENSOR COUNT below is the backstop for this half.
 * Locally, against the merged state:
 * `npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions`.
 *
 * If a window is ever open anyway, the check for it is read-sensors'
 * UNREGISTERED-SENSOR COUNT (the `skipped (unregistered sensor)` figure and its
 * named tail), never the readings count — a de-registered sensor keeps its last
 * written reading forever, and the readings count moves for unrelated reasons on
 * every run.
 */
export const RSI_SENSOR_NAME =
  "sensors registered in the graph's existing success_signal/readings " +
  "machinery on their owning strategies (backlog band, parked critical-path " +
  "count, held-session/worktree census, pause state), plus per-workflow token " +
  "attribution across dispatch, office-hours, and rsi reported by /rsi-audit; " +
  "plus the research lane's weekly dated readings on this strategy " +
  "(research-cycle landings); plus three instruments for the evaluation-core " +
  "readings recorded 2026-08-14 — a write-path lint counting the scripts that " +
  "implement a mint-or-reuse follow-up write (find-or-recur surface count), " +
  "aggregate-usage.sh at node scope for sessions per invalid-state episode " +
  "(degrading to sessions-per-node-per-day if that instrument cannot express " +
  "an episode), and the per-session decision log checked against each lane's " +
  "declared frontmatter remediation list (remediation acts outside a declared " +
  "list)";

/**
 * Dispatch pause state, delegated to the canonical shell helper
 * (`lib-pause-state.sh`'s `dispatch_pause_state`) rather than re-testing the
 * sentinel path here. The helper already distinguishes `paused` /`not-paused` /
 * `unknown` — an unsearchable state directory means the sentinel's presence
 * cannot be determined, and a second implementation of that logic would drift
 * from the gate the tick itself consults.
 */
export function readPauseState(repoDir: string): string {
  const lib = join(
    repoDir,
    ".claude/skills/dispatch-propagate/scripts/lib-pause-state.sh",
  );
  try {
    return execFileSync(
      "bash",
      ["-c", `source ${JSON.stringify(lib)} && dispatch_pause_state`],
      execOpts,
    ).trim();
  } catch {
    return "unknown";
  }
}

/** Count of provisioned worktrees under `.claude/worktrees/`. */
function readWorktreeCount(repoDir: string): string {
  try {
    const out = execFileSync(
      "git",
      ["-C", repoDir, "worktree", "list", "--porcelain"],
      execOpts,
    );
    return String(out.split("\n").filter((l) => l.startsWith("worktree ")).length);
  } catch {
    return "unknown";
  }
}

/**
 * Parked-node census over a node set: how many nodes are parked, and how many
 * OPEN nodes are held by a `blocked_by` edge onto one of them. The second
 * number is the critical-path one — a park nothing depends on costs nothing,
 * whereas a park holding open work is the one the author has to clear.
 *
 * DENOMINATOR, chosen deliberately: `blocked` counts HELD NODES (open nodes
 * with at least one `blocked_by` edge onto a parked node), not the number of
 * DISTINCT parked nodes doing the blocking. The two disagree whenever one
 * park blocks several open nodes, or several parks together block one node.
 * This function used to compute the other denominator (distinct blocking
 * parks) while the retired `rsi-plan.md` renderer's `countBlockedByParked`
 * computed this one on the same input — a real divergence between two
 * implementations of "what does a park block?", caught when
 * `/rsi-audit`'s parked-population lens (`.claude/skills/rsi-audit/SKILL.md`)
 * was re-homed onto this sensor. Held-node is the one kept: it answers "how
 * much open work is stuck," which is what
 * `strategy-recursive-self-improvement`'s own declared sensor name means by
 * "parked critical-path count" (see `RSI_SENSOR_NAME` above). This is now the
 * ONE place that count is computed — `readParkedCensus` below and the audit
 * lens both read it from here, so the two can no longer drift apart.
 */
export function parkedCensus(nodes: IntentionNode[]): { parked: number; blocked: number } {
  const parkedIds = new Set(nodes.filter((n) => n.office_hours !== null).map((n) => n.id));
  const blocked = nodes.filter(
    (n) =>
      n.office_hours === null &&
      n.phase !== null &&
      n.phase !== "done" &&
      n.blocked_by.some((b) => parkedIds.has(b)),
  ).length;
  return { parked: parkedIds.size, blocked };
}

/**
 * Parked-node census over the store, formatted for the rsi sensor reading.
 * Delegates to `parkedCensus` — see its doc comment for the denominator this
 * reports.
 */
export function readParkedCensus(storeDir: string): string {
  let nodes: IntentionNode[];
  try {
    nodes = listNodes(storeDir);
  } catch {
    return "unknown";
  }
  const { parked, blocked } = parkedCensus(nodes);
  return `${parked} (${blocked} blocked)`;
}

/**
 * Per-workflow token shares from an already-produced usage aggregate.
 *
 * The aggregate is NOT produced here. `aggregate-usage.sh` parses every session
 * transcript in the window — far too heavy for a batch sensor driver that runs
 * over the whole store. `/rsi-audit` produces one per audit and this sensor
 * reads the artifact, reporting `unavailable` when there is none. Reporting
 * absence honestly matters more than usual here: a fabricated 0% for rsi would
 * silently satisfy the recorded "dispatch dominates spend" expectation, which is
 * a review trigger, not a formality.
 */
export function readWorkflowSpend(usagePath: string): string {
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(usagePath, "utf8"));
  } catch {
    return "unavailable";
  }
  const buckets = spendBucketsFrom(doc);
  if (buckets === null) return "unavailable";
  const spend = attributeSpend(buckets);
  return spend
    .map((s) => `${s.workflow} ${(s.share * 100).toFixed(0)}%`)
    .join(" / ");
}

/**
 * Compose the full rsi reading from its segments. Exported for unit tests,
 * which inject a fixture repo, a fixture store and a fixture usage aggregate.
 */
export function readRsiReading(
  repoDir: string,
  storeDir: string,
  usagePath: string,
  window: string,
): string {
  return (
    `pause: ${readPauseState(repoDir)}; ` +
    `backlog: ${readBacklogBand(storeDir, BACKLOG_STRATEGY_ID)}; ` +
    `parked: ${readParkedCensus(storeDir)}; ` +
    `worktrees: ${readWorktreeCount(repoDir)}; ` +
    `tokens ${window}: ${readWorkflowSpend(usagePath)}`
  );
}

const rsiSensor: Sensor = {
  name: RSI_SENSOR_NAME,
  read(): string {
    const usagePath =
      process.env.RSI_USAGE_AGGREGATE_PATH ?? join(repoRoot, "tmp", "usage-audit.json");
    const window = process.env.RSI_USAGE_WINDOW ?? "7d";
    return readRsiReading(repoRoot, intentionsDir, usagePath, window);
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
  registry.register(mainHealthSensor);
  registry.register(tokenEconomySensor);
  registry.register(lifecycleSensor);
  registry.register(dependencyAuditSensor);
  registry.register(rsiSensor);
  registry.register(makeDelegationRecordsSensor(() => listNodes(intentionsDir)));
  registry.register(makeLadderTerminusSensor(() => listNodes(intentionsDir)));
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

/**
 * The names the default registry resolves — the set a consumer needs to answer
 * "is this node's declared sensor actually measured?".
 *
 * Consumers use it to separate real metrics (measured, with a threshold) from
 * declared-but-unread aspirations — the same split the driver's own
 * unregistered-sensor tail reports. Derived
 * from the registry itself, never hand-listed, for the same reason
 * `makeIntentionStoreSensor` derives its set: a hand-list silently drifts the
 * moment a sensor is added above.
 */
export function registeredSensorNames(): ReadonlySet<string> {
  return buildDefaultRegistry().names();
}

/**
 * The registered names that are deliberately NODE-AGNOSTIC: short generic
 * adapters any node may adopt by naming them, which no node names today. They
 * are exempt from validate-graph's registered-sensor rule
 * (`validateRegisteredSensorNames`), which otherwise requires every registered
 * name to be some node's recorded `success_signal.sensor`.
 *
 * Every other registered sensor is node-bound: its name is a verbatim copy of
 * one node's recorded sensor prose, so a reword on either side de-registers it.
 * Do not park a node-bound name here to quiet the rule — that is the drift the
 * rule exists to catch.
 */
export const UNBOUND_SENSOR_NAMES: ReadonlySet<string> = new Set([
  VITEST_SENSOR_NAME,
  GIT_SENSOR_NAME,
]);

// --- Core driver -----------------------------------------------------------

/** Summary of one store-sensor pass, returned for testability and printing. */
export interface ReadSummary {
  read: number; // nodes whose sensor was read (counted in the READ pass, write or not)
  written: number; // nodes whose fresh reading was persisted; 0 under `write: false`
  skippedNoSignal: number; // store nodes with no success_signal (nothing to read)
  unregistered: { id: string; sensor: string }[]; // named a sensor not in the registry
}

/**
 * Walk EVERY node in the store and, for each that names a registered sensor,
 * read the sensor and write the node back with the fresh `reading`, preserving
 * all other fields. `gap` is derived on read (`deriveGap`) from `reading` vs
 * `success_signal.threshold` — it is never computed or persisted here. Nodes
 * with no signal are skipped silently;
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
export function readStoreSensors(
  dir: string,
  registry: SensorRegistry,
  options: { write?: boolean } = {},
): ReadSummary {
  // Optional third parameter, defaulting to the historical write-through
  // behavior, so every existing two-argument caller is unchanged.
  const write = options.write ?? true;
  const summary: ReadSummary = { read: 0, written: 0, skippedNoSignal: 0, unregistered: [] };

  // READ pass: compute every node's fresh reading against a single consistent
  // pre-run store snapshot, accumulating the updated nodes without writing any.
  // Deferring all writes to a second pass is what keeps a whole-store sensor
  // honest: the intention-store sensor re-reads the store while computing its
  // reading, and if writes happened inline here it would observe a store
  // partially mutated by earlier iterations — its serves/readings counts would
  // be an artifact of node iteration order rather than a clean snapshot. With
  // no writes during this pass, every such re-read sees the same unmutated
  // pre-run store.
  //
  // Under `write: false` the WRITE pass below is skipped entirely and this READ
  // pass is byte-for-byte the same work, so the reported counts are identical to
  // a real run's — a dry run is a truthful preview, not a different measurement.
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
    updates.push({ ...node, reading });
    // Counted here, not in the WRITE loop below: a dry run reads exactly as
    // much as a real one, and reporting `0 read` for it would be the same
    // plausible-but-false summary this driver's argument handling exists to
    // prevent.
    summary.read += 1;
  }

  // WRITE pass: persist every updated node now that all readings are computed.
  if (write) {
    for (const updated of updates) {
      writeNode(dir, updated);
      summary.written += 1;
    }
  }

  return summary;
}

// --- Main ------------------------------------------------------------------

const USAGE =
  "usage: read-sensors.ts [--dry-run | --check | --report | --help]\n" +
  "  (no flag)   Read every registered sensor and WRITE each fresh reading back\n" +
  "              into the store. This is the only form that mutates the store.\n" +
  "  --dry-run   Pure read: same sensors, same reported counts, NO write.\n" +
  "  --check     Synonym for --dry-run.\n" +
  "  --report    Pure read: print the delegation portfolio table. NO write.\n" +
  "  --help, -h  Print this usage on stdout and exit 0.\n" +
  "\n" +
  "  There is deliberately NO --dir. This driver's store is fixed to the\n" +
  "  checkout the script file lives in, because buildDefaultRegistry takes no\n" +
  "  parameters and four registered sensors close over the module-level\n" +
  "  intentionsDir/repoRoot constants; a --dir threaded only through\n" +
  "  readStoreSensors would read one store and write another. The store in\n" +
  "  effect is printed on every run. See the file header for the full note.\n";

/**
 * The flags this driver accepts. Exported so the happy paths are unit-testable
 * — the failure paths below call `process.exit` and are covered by spawning the
 * CLI instead.
 *
 * Rejection is by ALLOWLIST, not by `arg.startsWith("-")`: read-sensors takes no
 * positional arguments, so ANY token outside the known set is an error. That is
 * what makes `--dir intentions` fail loudly on `--dir` rather than swallowing
 * both tokens and writing the wrong store — the defect this parser exists to
 * close.
 */
export function parseArgs(args: string[]): { report: boolean; dryRun: boolean } {
  let report = false;
  let dryRun = false;
  for (const arg of args) {
    if (arg === "--report") {
      report = true;
      continue;
    }
    if (arg === "--dry-run" || arg === "--check") {
      dryRun = true;
      continue;
    }
    process.stderr.write(`read-sensors: unknown argument '${arg}'\n` + USAGE);
    process.exit(1);
  }
  if (report && dryRun) {
    // Neither may silently win: silent precedence between two read-only modes
    // is the same "plausible summary for work that did not happen" family the
    // unknown-argument rejection above closes.
    process.stderr.write("read-sensors: --report and --dry-run are mutually exclusive\n" + USAGE);
    process.exit(1);
  }
  return { report, dryRun };
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE);
    return;
  }

  const { report, dryRun } = parseArgs(args);

  // `--report`: print the per-record delegation portfolio table and exit. No
  // frontier read, no writes — a read-only view for the human portfolio review.
  if (report) {
    // The store goes to stderr, not stdout: "the store in effect is printed on
    // every run" is the property that makes the no-`--dir` decision safe, and
    // the summary line that carries it on the other paths is never reached
    // here. stderr keeps the stdout table pipeable as-is.
    process.stderr.write(`read-sensors: --report over [store: ${intentionsDir}]\n`);
    process.stdout.write(renderDelegationRecordsReport(intentionsDir) + "\n");
    return;
  }

  const registry = buildDefaultRegistry();
  const summary = readStoreSensors(intentionsDir, registry, { write: !dryRun });

  process.stdout.write(
    `read-sensors: ${summary.read} read, ${summary.written} written, ` +
      `${summary.skippedNoSignal} skipped (no signal), ` +
      `${summary.unregistered.length} skipped (unregistered sensor)` +
      (dryRun ? ` (--dry-run: nothing written to ${intentionsDir})` : ` [store: ${intentionsDir}]`) +
      "\n",
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
