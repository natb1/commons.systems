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
 *  - Closed = a commit setting such a node's phase to `done` (the added
 *    `phase: done` frontmatter line, nested under `attributes`) or deleting
 *    the file (gated on the removed `owner: ai` line, so only claude-eligible
 *    nodes count).
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

  const created = new Set<string>();
  const closed = new Set<string>();
  let path: string | null = null;
  let isNewFile = false;
  let isDeletedFile = false;

  for (const line of patch.split("\n")) {
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
    if (!isDeletedFile && /^\+\s*phase:\s*done\s*$/.test(line)) {
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

/**
 * Build the default registry of local-first own-execution sensors. Exported so
 * the registration set can be unit-tested (verification deferred to #2372/QA).
 */
export function buildDefaultRegistry(): SensorRegistry {
  const registry = new SensorRegistry();
  registry.register(vitestSensor);
  registry.register(gitSensor);
  registry.register(tokenEconomySensor);
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
