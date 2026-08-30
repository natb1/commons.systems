// The `read-sensors.ts` CLI contract: strict unknown-argument rejection, and a
// `--dry-run` / `--check` mode that reads everything and writes nothing.
//
// A separate file from `reader-required-dir.test.ts` on purpose, even though the
// spawn helper below is copied from it. That file's header scopes it to
// `strategy-graph-native-dispatch` clarification 242's four scripts
// (validate-graph.ts / write-node.ts / dump-node.ts / clear-park), and
// read-sensors.ts is deliberately NOT one of them: this driver's store stays
// fixed to its own checkout because `buildDefaultRegistry` takes no parameters
// and four registered sensors close over the module-level
// `intentionsDir`/`repoRoot`. So the contract asserted here is a different one —
// "never silently swallow a flag", not "never infer the tree" — and the
// duplication is intentional rather than an oversight.
//
// WARNING — NEVER SPAWN A BARE OR OTHERWISE-VALID RUN FROM THIS SUITE. A valid
// run executes every registered real sensor against the LIVE `intentions/`
// store, shells out to `git`/`gh`, and WRITES fresh readings into the repo. Only
// invocations that exit during argument parsing (or `--help`) may be spawned.
// The `--dry-run` behavior is covered at the unit level below, against a fixture
// store and a hand-built registry, for exactly this reason.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SensorRegistry } from "../src/sensors.js";
import { readNode, writeNode } from "../src/store.js";
import { parseArgs, readStoreSensors } from "../scripts/read-sensors.js";
import type { IntentionNodeInput } from "../src/schema.js";

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts");

/** Run the read-sensors CLI through tsx and capture its exit code + streams. */
function runScript(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx/esm", join(scriptsDir, "read-sensors.ts"), ...args],
    { encoding: "utf8" },
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("read-sensors.ts rejects unrecognized arguments", () => {
  it("refuses --dir by name instead of swallowing it and writing its own store", { timeout: 30_000 }, () => {
    const run = runScript(["--dir", "intentions"]);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("unknown argument '--dir'");
    // The rejection must happen BEFORE any sensor runs: a summary line in
    // stdout would mean the write pass had already been reached.
    expect(run.stdout).not.toContain("read,");
    expect(run.stdout).not.toContain("written");
  });

  it("refuses a misspelled flag, naming the offending token", { timeout: 30_000 }, () => {
    const run = runScript(["--dryrun"]);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("unknown argument '--dryrun'");
    expect(run.stdout).not.toContain("written");
  });

  it("refuses a bare positional token — this driver takes no positional arguments", { timeout: 30_000 }, () => {
    const run = runScript(["intentions"]);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("unknown argument 'intentions'");
  });

  it("refuses --report and --dry-run together rather than letting one silently win", { timeout: 30_000 }, () => {
    const run = runScript(["--report", "--dry-run"]);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("mutually exclusive");
  });

  it("prints usage on stdout and exits 0 for --help", { timeout: 30_000 }, () => {
    const run = runScript(["--help"]);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("usage: read-sensors.ts");
    // The no---dir decision is stated in the usage itself, so a caller who
    // reaches for it is told why rather than left guessing.
    expect(run.stdout).toContain("NO --dir");
  });
});

describe("parseArgs accepts the flags that exist", () => {
  // Direct (non-spawn) cases on the happy paths only — the failure paths call
  // `process.exit`, which is why they are spawned above.
  it("defaults to write mode with no report", () => {
    expect(parseArgs([])).toEqual({ report: false, dryRun: false });
  });

  it("reads --dry-run", () => {
    expect(parseArgs(["--dry-run"])).toEqual({ report: false, dryRun: true });
  });

  it("reads --check as a synonym for --dry-run", () => {
    expect(parseArgs(["--check"])).toEqual({ report: false, dryRun: true });
  });

  it("reads --report", () => {
    expect(parseArgs(["--report"])).toEqual({ report: true, dryRun: false });
  });
});

function tempStore(): string {
  return mkdtempSync(join(tmpdir(), "read-sensors-cli-"));
}

const STUB_SENSOR_NAME = "stub-sensor";
const STUB_READING = "stub: measured";

/** A registry holding one total stub sensor — no git, no gh, no live store. */
function stubRegistry(): SensorRegistry {
  const registry = new SensorRegistry();
  registry.register({ name: STUB_SENSOR_NAME, read: () => STUB_READING });
  return registry;
}

/** A node naming the stub sensor, plus one with no signal at all. */
function signalNode(id: string): IntentionNodeInput {
  return {
    id,
    kind: "tactic",
    statement: `tactic ${id}`,
    owner: "ai",
    status: "raw",
    success_signal: {
      observable: "the stub",
      sensor: STUB_SENSOR_NAME,
      threshold: STUB_READING,
      is_proxy: false,
    },
  };
}

function silentNode(id: string): IntentionNodeInput {
  return { id, kind: "tactic", statement: `tactic ${id}`, owner: "ai", status: "raw" };
}

describe("readStoreSensors write: false", () => {
  it("reads every sensor and leaves every node file byte-identical", () => {
    const dir = tempStore();
    writeNode(dir, signalNode("tactic-has-signal"));
    writeNode(dir, silentNode("tactic-no-signal"));
    const before = {
      signal: readFileSync(join(dir, "tactic-has-signal.md"), "utf8"),
      silent: readFileSync(join(dir, "tactic-no-signal.md"), "utf8"),
    };

    const summary = readStoreSensors(dir, stubRegistry(), { write: false });

    // The READ pass is byte-for-byte the same work, so the counts a dry run
    // reports are a truthful preview, not a different measurement.
    expect(summary.read).toBe(1);
    expect(summary.written).toBe(0);
    expect(summary.skippedNoSignal).toBe(1);
    expect(summary.unregistered).toHaveLength(0);

    expect(readFileSync(join(dir, "tactic-has-signal.md"), "utf8")).toBe(before.signal);
    expect(readFileSync(join(dir, "tactic-no-signal.md"), "utf8")).toBe(before.silent);
    expect(readNode(dir, "tactic-has-signal").reading).toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });

  it("control: the default two-argument call DOES write, so the assertion above is not vacuous", () => {
    const dir = tempStore();
    writeNode(dir, signalNode("tactic-has-signal"));
    writeNode(dir, silentNode("tactic-no-signal"));
    const before = readFileSync(join(dir, "tactic-has-signal.md"), "utf8");

    const summary = readStoreSensors(dir, stubRegistry());

    expect(summary.read).toBe(1);
    expect(summary.written).toBe(1);
    expect(readFileSync(join(dir, "tactic-has-signal.md"), "utf8")).not.toBe(before);
    expect(readNode(dir, "tactic-has-signal").reading).toBe(STUB_READING);
    rmSync(dir, { recursive: true, force: true });
  });
});
