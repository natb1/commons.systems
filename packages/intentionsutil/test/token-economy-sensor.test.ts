import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDefaultRegistry,
  readTacticVelocity,
  readTokenEconomy,
  readWeeklyUtilization,
} from "../scripts/read-sensors.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "token-economy-"));
}

/** Write a fixture rate_limits.json and return its path. */
function telemetryFile(content: unknown): string {
  const path = join(tempDir(), "rate_limits.json");
  writeFileSync(path, JSON.stringify(content));
  return path;
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

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Minimal tactic-node frontmatter fixture. */
function tacticFile(id: string, opts: { owner?: string; phase?: string } = {}): string {
  const owner = opts.owner ?? "ai";
  const attrs = opts.phase === undefined ? "" : `attributes:\n  phase: ${opts.phase}\n`;
  return `---\nid: ${id}\nkind: tactic\nstatement: s\nowner: ${owner}\nstatus: raw\nparent: null\n${attrs}---\n# ${id}\n`;
}

describe("readWeeklyUtilization", () => {
  it("reads the pre-computed weekly percentage from .seven_day.used_percentage", () => {
    const path = telemetryFile({ seven_day: { used_percentage: 42 } });
    expect(readWeeklyUtilization(path)).toBe("42% weekly");
  });

  it("accepts a numeric-string percentage (telemetry passes through jq)", () => {
    const path = telemetryFile({ seven_day: { used_percentage: "3.5" } });
    expect(readWeeklyUtilization(path)).toBe("3.5% weekly");
  });

  it("reads unknown when the telemetry file is missing", () => {
    expect(readWeeklyUtilization(join(tempDir(), "absent.json"))).toBe("unknown");
  });

  it("reads unknown when the seven_day field is missing", () => {
    const path = telemetryFile({ five_hour: { used_percentage: 10 } });
    expect(readWeeklyUtilization(path)).toBe("unknown");
  });

  it("sanitizes a non-numeric percentage to unknown", () => {
    const path = telemetryFile({ seven_day: { used_percentage: "abc" } });
    expect(readWeeklyUtilization(path)).toBe("unknown");
  });

  it("sanitizes an out-of-range percentage (>100) to unknown", () => {
    const path = telemetryFile({ seven_day: { used_percentage: 150 } });
    expect(readWeeklyUtilization(path)).toBe("unknown");
  });
});

describe("readTacticVelocity", () => {
  it("counts owner: ai tactic additions as created and phase: done as closed", () => {
    const repo = initRepo();
    writeFileSync(join(repo, "intentions", "tactic-a.md"), tacticFile("tactic-a"));
    commitAll(repo, "add tactic-a");
    writeFileSync(
      join(repo, "intentions", "tactic-b.md"),
      tacticFile("tactic-b", { phase: "implement" }),
    );
    commitAll(repo, "add tactic-b");
    writeFileSync(
      join(repo, "intentions", "tactic-b.md"),
      tacticFile("tactic-b", { phase: "done" }),
    );
    commitAll(repo, "close tactic-b");
    expect(readTacticVelocity(repo)).toBe("2 created / 1 closed (net +1)");
    rmSync(repo, { recursive: true, force: true });
  });

  it("does not count a non-ai-owned tactic as created", () => {
    const repo = initRepo();
    writeFileSync(
      join(repo, "intentions", "tactic-h.md"),
      tacticFile("tactic-h", { owner: "human" }),
    );
    commitAll(repo, "add human tactic");
    expect(readTacticVelocity(repo)).toBe("0 created / 0 closed (net +0)");
    rmSync(repo, { recursive: true, force: true });
  });

  it("counts deleting an owner: ai tactic as closed (negative net)", () => {
    const repo = initRepo();
    writeFileSync(join(repo, "intentions", "tactic-old.md"), tacticFile("tactic-old"));
    commitAll(repo, "add tactic-old long ago", daysAgo(60));
    rmSync(join(repo, "intentions", "tactic-old.md"));
    commitAll(repo, "prune tactic-old");
    expect(readTacticVelocity(repo)).toBe("0 created / 1 closed (net -1)");
    rmSync(repo, { recursive: true, force: true });
  });

  it("reads zero flow for an empty history window (all commits older)", () => {
    const repo = initRepo();
    writeFileSync(join(repo, "intentions", "tactic-old.md"), tacticFile("tactic-old"));
    commitAll(repo, "add tactic-old long ago", daysAgo(60));
    expect(readTacticVelocity(repo)).toBe("0 created / 0 closed (net +0)");
    rmSync(repo, { recursive: true, force: true });
  });

  it("reads unknown when git history is unavailable (not a repo)", () => {
    expect(readTacticVelocity(tempDir())).toBe("unknown");
  });
});

describe("readTokenEconomy", () => {
  it("composes the stable dual reading from fixture telemetry and history", () => {
    const telemetry = telemetryFile({ seven_day: { used_percentage: 42 } });
    const repo = initRepo();
    writeFileSync(join(repo, "intentions", "tactic-a.md"), tacticFile("tactic-a"));
    commitAll(repo, "add tactic-a");
    expect(readTokenEconomy(telemetry, repo)).toBe(
      "utilization: 42% weekly; tactics 28d: 1 created / 0 closed (net +1)",
    );
    rmSync(repo, { recursive: true, force: true });
  });

  it("degrades the utilization half to unknown on missing telemetry, keeping velocity", () => {
    const repo = initRepo();
    writeFileSync(join(repo, "README.md"), "fixture\n");
    commitAll(repo, "baseline outside the window", daysAgo(60));
    expect(readTokenEconomy(join(tempDir(), "absent.json"), repo)).toBe(
      "utilization: unknown; tactics 28d: 0 created / 0 closed (net +0)",
    );
    rmSync(repo, { recursive: true, force: true });
  });
});

describe("buildDefaultRegistry", () => {
  it("registers the token-economy sensor under the name the strategy uses", () => {
    const registry = buildDefaultRegistry();
    expect(registry.resolve("token-economy").name).toBe("token-economy");
  });
});
