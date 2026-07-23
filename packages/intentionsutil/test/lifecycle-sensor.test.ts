import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDefaultRegistry,
  readLifecyclePhaseHistory,
  readLifecycleReading,
  readSelectionLog,
} from "../scripts/read-sensors.js";

const LIFECYCLE_SENSOR_NAME = "the intention store and the router's selection log";

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
      "lifecycle: tactic-full implement→qa→review→done (2026-07-05); router selections: 1 records, 1 nodes",
    );
    rmSync(repo, { recursive: true, force: true });
  });

  it("degrades each half independently (no lifecycle, missing log)", () => {
    const repo = initRepo();
    writeFileSync(join(repo, "intentions", "tactic-open.md"), tacticFile("tactic-open", { phase: "implement" }));
    commitAll(repo, "add tactic-open");
    expect(readLifecycleReading(repo, join(tempDir(), "absent.jsonl"))).toBe(
      "lifecycle: none yet; router selections: unknown",
    );
    rmSync(repo, { recursive: true, force: true });
  });
});

describe("buildDefaultRegistry", () => {
  it("registers the lifecycle sensor under the name the strategy declares", () => {
    const registry = buildDefaultRegistry();
    expect(registry.resolve(LIFECYCLE_SENSOR_NAME).name).toBe(LIFECYCLE_SENSOR_NAME);
  });
});
