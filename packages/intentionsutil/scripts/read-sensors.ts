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

/**
 * Build the default registry of local-first own-execution sensors. Exported so
 * the registration set can be unit-tested (verification deferred to #2372/QA).
 */
export function buildDefaultRegistry(): SensorRegistry {
  const registry = new SensorRegistry();
  registry.register(vitestSensor);
  registry.register(gitSensor);
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
