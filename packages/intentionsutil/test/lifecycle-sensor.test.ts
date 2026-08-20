import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BACKLOG_BAND_PCT,
  LIFECYCLE_SENSOR_NAME,
  UNBOUND_SENSOR_NAMES,
  buildDefaultRegistry,
  readBacklogBand,
  readBacklogSeries,
  readLifecyclePhaseHistory,
  readLifecycleReading,
  readSelectionLog,
  registeredSensorNames,
} from "../scripts/read-sensors.js";
import { writeNodeFromJson } from "../scripts/write-node.js";
import { validateRegisteredSensorNames } from "../src/sensors.js";
import { listNodesStrict, readNode } from "../src/store.js";

const STRATEGY_ID = "strategy-graph-native-dispatch";
const EMPTY_BAND = `0/0 = n/a (band ≤${BACKLOG_BAND_PCT}%)`;

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "lifecycle-sensor-"));
}

function git(repo: string, args: string[], env: Record<string, string> = {}): void {
  execFileSync("git", args, {
    cwd: repo,
    stdio: "ignore",
    env: { ...process.env, ...env },
  });
}

/** Init a fixture repo with an intentions/ dir and deterministic config. */
function initRepo(): string {
  const repo = tempDir();
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["config", "commit.gpgsign", "false"]);
  mkdirSync(join(repo, "intentions"));
  return repo;
}

/** Commit everything, optionally backdating both author and committer dates. */
function commitAll(repo: string, message: string, isoDate?: string): void {
  git(repo, ["add", "-A"]);
  const env: Record<string, string> =
    isoDate === undefined ? {} : { GIT_AUTHOR_DATE: isoDate, GIT_COMMITTER_DATE: isoDate };
  git(repo, ["commit", "-q", "-m", message], env);
}

/** Minimal tactic-node frontmatter fixture with a top-level phase field. */
function tacticFile(id: string, opts: { owner?: string; phase?: string } = {}): string {
  const owner = opts.owner ?? "ai";
  const phase = opts.phase === undefined ? "" : `phase: ${opts.phase}\n`;
  return `---\nid: ${id}\nkind: tactic\nstatement: s\nowner: ${owner}\nstatus: raw\nparent: null\n${phase}---\n# ${id}\n`;
}

/** Drive a tactic file through a sequence of phases, one commit per phase. */
function driveLifecycle(
  repo: string,
  id: string,
  phases: string[],
  owner = "ai",
  isoDate?: string,
): void {
  const path = join(repo, "intentions", `${id}.md`);
  for (const phase of phases) {
    writeFileSync(path, tacticFile(id, { owner, phase }));
    commitAll(repo, `${id} -> ${phase}`, isoDate);
  }
}

/** Write a fixture selection-log JSONL file and return its path. */
function selectionLogFile(lines: string[]): string {
  const path = join(tempDir(), "graph-selection.jsonl");
  writeFileSync(path, lines.join("\n") + (lines.length > 0 ? "\n" : ""));
  return path;
}

describe("readLifecyclePhaseHistory", () => {
  it("reports the latest owner: ai tactic that observed the full lifecycle", () => {
    const repo = initRepo();
    driveLifecycle(repo, "tactic-full", ["implement", "qa", "review", "done"], "ai", "2026-07-05T12:00:00Z");
    expect(readLifecyclePhaseHistory(repo)).toBe(
      "tactic-full implement→qa→review→done (2026-07-05)",
    );
    rmSync(repo, { recursive: true, force: true });
  });

  it("reads none yet when a node reaches done without passing every phase", () => {
    const repo = initRepo();
    // implement -> done, skipping qa and review: not a full lifecycle.
    driveLifecycle(repo, "tactic-partial", ["implement", "done"]);
    expect(readLifecyclePhaseHistory(repo)).toBe("none yet");
    rmSync(repo, { recursive: true, force: true });
  });

  it("reads none yet when a node runs the phases but never reaches done", () => {
    const repo = initRepo();
    driveLifecycle(repo, "tactic-open", ["implement", "qa", "review"]);
    expect(readLifecyclePhaseHistory(repo)).toBe("none yet");
    rmSync(repo, { recursive: true, force: true });
  });

  it("does not count a human-owned node that completes the lifecycle", () => {
    const repo = initRepo();
    driveLifecycle(repo, "tactic-human", ["implement", "qa", "review", "done"], "human");
    expect(readLifecyclePhaseHistory(repo)).toBe("none yet");
    rmSync(repo, { recursive: true, force: true });
  });

  it("picks the node with the latest done date among multiple full lifecycles", () => {
    const repo = initRepo();
    driveLifecycle(repo, "tactic-early", ["implement", "qa", "review", "done"], "ai", "2026-06-01T12:00:00Z");
    driveLifecycle(repo, "tactic-late", ["implement", "qa", "review", "done"], "ai", "2026-07-01T12:00:00Z");
    expect(readLifecyclePhaseHistory(repo)).toBe(
      "tactic-late implement→qa→review→done (2026-07-01)",
    );
    rmSync(repo, { recursive: true, force: true });
  });

  it("reads unknown when git history is unavailable (not a repo)", () => {
    expect(readLifecyclePhaseHistory(tempDir())).toBe("unknown");
  });
});

describe("readSelectionLog", () => {
  it("counts records and the distinct selected node ids", () => {
    const path = selectionLogFile([
      JSON.stringify({ site: "graph-select-target", disposition: "node", selected: ["tactic-a"] }),
      JSON.stringify({ site: "graph-select-target", disposition: "node", selected: ["tactic-b", "tactic-a"] }),
      JSON.stringify({ site: "graph-select-target", disposition: "empty", selected: [] }),
    ]);
    expect(readSelectionLog(path)).toBe("3 records, 2 nodes");
  });

  it("skips malformed lines without failing the whole read", () => {
    const path = selectionLogFile([
      JSON.stringify({ selected: ["tactic-a"] }),
      "{ not valid json",
      JSON.stringify({ selected: ["tactic-b"] }),
    ]);
    expect(readSelectionLog(path)).toBe("2 records, 2 nodes");
  });

  it("reads unknown when the selection log is missing", () => {
    expect(readSelectionLog(join(tempDir(), "absent.jsonl"))).toBe("unknown");
  });
});

describe("readLifecycleReading", () => {
  it("composes the dual reading from history and the selection log", () => {
    const repo = initRepo();
    driveLifecycle(repo, "tactic-full", ["implement", "qa", "review", "done"], "ai", "2026-07-05T12:00:00Z");
    const log = selectionLogFile([
      JSON.stringify({ selected: ["tactic-full"] }),
    ]);
    expect(readLifecycleReading(repo, log)).toBe(
      "lifecycle: tactic-full implement→qa→review→done (2026-07-05); " +
        "router selections: 1 records, 1 nodes; " +
        `backlog: ${EMPTY_BAND}; ` +
        "backlog series 28d: insufficient history",
    );
    rmSync(repo, { recursive: true, force: true });
  });

  it("degrades each half independently (no lifecycle, missing log)", () => {
    const repo = initRepo();
    writeFileSync(join(repo, "intentions", "tactic-open.md"), tacticFile("tactic-open", { phase: "implement" }));
    commitAll(repo, "add tactic-open");
    expect(readLifecycleReading(repo, join(tempDir(), "absent.jsonl"))).toBe(
      "lifecycle: none yet; router selections: unknown; " +
        `backlog: ${EMPTY_BAND}; ` +
        "backlog series 28d: insufficient history",
    );
    rmSync(repo, { recursive: true, force: true });
  });
});

/** A schema-valid tactic node JSON serving the strategy under test. */
function nodeJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id: "tactic-fixture",
    kind: "tactic",
    statement: "A fixture tactic node.",
    owner: "ai",
    status: "draft",
    parent: null,
    serves: [STRATEGY_ID],
    ...overrides,
  });
}

/** ISO timestamp `n` days before now, for backdating fixture commits. */
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400 * 1000).toISOString();
}

describe("readBacklogBand", () => {
  it("counts open + born-parked over the whole served tactic population", () => {
    const repo = initRepo();
    const store = join(repo, "intentions");
    writeNodeFromJson(store, nodeJson({ id: "tactic-draft", phase: null, office_hours: null }));
    writeNodeFromJson(
      store,
      nodeJson({
        id: "tactic-parked",
        phase: null,
        office_hours: { reason: "needs a call", since: "2026-07-01", recommendation: null },
      }),
    );
    writeNodeFromJson(store, nodeJson({ id: "tactic-open", phase: "implement" }));
    writeNodeFromJson(store, nodeJson({ id: "tactic-done", phase: "done" }));
    expect(readBacklogBand(store, STRATEGY_ID)).toBe(
      `2/4 = 50.0% (band ≤${BACKLOG_BAND_PCT}%)`,
    );
    rmSync(repo, { recursive: true, force: true });
  });

  it("reads n/a rather than dividing by zero when no tactic serves the strategy", () => {
    const repo = initRepo();
    const store = join(repo, "intentions");
    writeNodeFromJson(store, nodeJson({ id: "tactic-other", serves: ["strategy-other"] }));
    expect(readBacklogBand(store, STRATEGY_ID)).toBe(EMPTY_BAND);
    rmSync(repo, { recursive: true, force: true });
  });

  it("reads unknown when the store dir does not exist", () => {
    expect(readBacklogBand(join(tempDir(), "absent"), STRATEGY_ID)).toBe("unknown");
  });
});

describe("readBacklogSeries", () => {
  /**
   * A repo with three day-spaced committed store states. Each entry is the set
   * of `{ id, phase }` served tactics present at that commit; `extraFiles` lets
   * a commit introduce a raw (possibly invalid) file.
   */
  function seriesRepo(
    states: { phases: (string | null)[]; date: string; badFile?: boolean }[],
  ): string {
    const repo = initRepo();
    const store = join(repo, "intentions");
    for (const [index, state] of states.entries()) {
      rmSync(store, { recursive: true, force: true });
      mkdirSync(store);
      state.phases.forEach((phase, i) => {
        writeNodeFromJson(
          store,
          nodeJson({ id: `tactic-${i}`, phase, office_hours: null }),
        );
      });
      if (state.badFile === true) {
        writeFileSync(join(store, "tactic-broken.md"), "---\nid: tactic-broken\n---\nno kind\n");
      }
      commitAll(repo, `state ${index}`, state.date);
    }
    return repo;
  }

  it("renders a falling series as non-increasing", () => {
    const repo = seriesRepo([
      { phases: ["implement", "implement", "implement"], date: daysAgo(5) },
      { phases: ["done", "done", "implement"], date: daysAgo(1.5) },
      { phases: ["done", "done", "done"], date: daysAgo(0.2) },
    ]);
    expect(readBacklogSeries(repo, STRATEGY_ID, 3, 1)).toBe(
      "100.0% → 33.3% → 0.0% (non-increasing)",
    );
    rmSync(repo, { recursive: true, force: true });
  });

  it("renders a series that rises at any step as increasing", () => {
    const repo = seriesRepo([
      { phases: ["done", "done", "done"], date: daysAgo(5) },
      { phases: ["implement", "done", "done"], date: daysAgo(1.5) },
      { phases: ["done", "done", "done"], date: daysAgo(0.2) },
    ]);
    expect(readBacklogSeries(repo, STRATEGY_ID, 3, 1)).toBe(
      "0.0% → 33.3% → 0.0% (increasing)",
    );
    rmSync(repo, { recursive: true, force: true });
  });

  it("renders skipped for a ref whose store does not validate, without throwing", () => {
    const repo = seriesRepo([
      { phases: ["implement", "implement", "implement"], date: daysAgo(5) },
      { phases: ["done", "done", "implement"], date: daysAgo(1.5), badFile: true },
      { phases: ["done", "done", "done"], date: daysAgo(0.2) },
    ]);
    expect(readBacklogSeries(repo, STRATEGY_ID, 3, 1)).toBe(
      "100.0% → skipped → 0.0% (non-increasing)",
    );
    rmSync(repo, { recursive: true, force: true });
  });

  it("reads unknown when git history is unavailable (not a repo)", () => {
    expect(readBacklogSeries(tempDir(), STRATEGY_ID, 3, 1)).toBe("unknown");
  });

  it("reads insufficient history from a single distinct sampled store state", () => {
    const repo = seriesRepo([
      { phases: ["implement", "done"], date: daysAgo(0.2) },
    ]);
    expect(readBacklogSeries(repo, STRATEGY_ID, 3, 1)).toBe("insufficient history");
    rmSync(repo, { recursive: true, force: true });
  });
});

describe("buildDefaultRegistry", () => {
  it("registers the lifecycle sensor under the name the strategy declares", () => {
    const registry = buildDefaultRegistry();
    expect(registry.resolve(LIFECYCLE_SENSOR_NAME).name).toBe(LIFECYCLE_SENSOR_NAME);
  });
});

// Anti-drift guard: registry resolution is verbatim string match, so the
// registered name must equal the recorded `success_signal.sensor` exactly.
// Skips cleanly when the store is absent (same posture as committed-store.test.ts).
const testDir = dirname(fileURLToPath(import.meta.url));
const intentionsDir = join(dirname(dirname(dirname(testDir))), "intentions");

describe.skipIf(!existsSync(intentionsDir))("recorded sensor name", () => {
  it("LIFECYCLE_SENSOR_NAME equals strategy-graph-native-dispatch's success_signal.sensor", () => {
    const node = readNode(intentionsDir, STRATEGY_ID);
    expect(node.success_signal?.sensor).toBe(LIFECYCLE_SENSOR_NAME);
  });

  // The same guard generalized over the whole registry — the rule
  // validate-graph.ts runs on the graph write path, exercised here against the
  // live store so a drift shows up in unit CI too.
  it("every registered sensor name is recorded verbatim by some node", () => {
    const nodes = listNodesStrict(intentionsDir);
    expect(() =>
      validateRegisteredSensorNames(nodes, registeredSensorNames(), UNBOUND_SENSOR_NAMES),
    ).not.toThrow();
  });
});
