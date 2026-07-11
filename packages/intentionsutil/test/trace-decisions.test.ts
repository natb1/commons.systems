import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { nodeIdFromPath, parseArgs, scanDecisionTrace, type TraceClass } from "../scripts/trace-decisions.js";

// --- Fixture-repo helpers (temp-fixture-repo pattern of lifecycle-sensor.test) ---

const repos: string[] = [];

function git(repo: string, args: string[], env: Record<string, string> = {}): void {
  execFileSync("git", args, {
    cwd: repo,
    stdio: "ignore",
    env: { ...process.env, ...env },
  });
}

/** Init a fixture repo with an intentions/ dir and deterministic config. */
function initRepo(): string {
  const repo = mkdtempSync(join(tmpdir(), "trace-decisions-"));
  repos.push(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["config", "commit.gpgsign", "false"]);
  mkdirSync(join(repo, "intentions"));
  return repo;
}

/** Commit everything with a deterministic backdated author/committer date. */
function commitAll(repo: string, message: string, isoDate: string): void {
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-q", "-m", message], {
    GIT_AUTHOR_DATE: isoDate,
    GIT_COMMITTER_DATE: isoDate,
  });
}

function writeNodeFile(repo: string, id: string, body: string): void {
  writeFileSync(join(repo, "intentions", `${id}.md`), body);
}

afterEach(() => {
  while (repos.length > 0) {
    const repo = repos.pop();
    if (repo !== undefined) rmSync(repo, { recursive: true, force: true });
  }
});

/** Return the events of one class, for focused assertions. */
function ofClass(events: ReturnType<typeof scanDecisionTrace>, cls: TraceClass) {
  return events.filter((e) => e.eventClass === cls);
}

// --- Frontmatter fixtures --------------------------------------------------

function strategyBase(id: string): string {
  return [
    "---",
    `id: ${id}`,
    "kind: strategy",
    "statement: original statement",
    "owner: ai",
    "status: codified",
    "parent: null",
    "attention: null",
    "attributes:",
    "  conditions:",
    "    - the original world premise holds",
    "---",
    `# ${id}`,
    "",
  ].join("\n");
}

describe("scanDecisionTrace", () => {
  it("attributes one fixture commit per event class and a no-match control", () => {
    const repo = initRepo();

    // Baseline: a strategy and a tactic exist. (Adding files is not a trace event.)
    writeNodeFile(repo, "strategy-alpha", strategyBase("strategy-alpha"));
    writeNodeFile(
      repo,
      "tactic-beta",
      ["---", "id: tactic-beta", "kind: tactic", "statement: t", "owner: ai", "status: raw", "parent: null", "attention: null", "---", "# tactic-beta", ""].join("\n"),
    );
    commitAll(repo, "baseline", "2026-07-01T12:00:00Z");

    // Class 1 — dialectic cites node ids: add a clarifications entry to the strategy.
    writeNodeFile(
      repo,
      "strategy-alpha",
      strategyBase("strategy-alpha").replace(
        "attention: null\n",
        "attention: null\nclarifications:\n  - question: Does intent trace to nodes?\n    answer: Yes, via graph history.\n",
      ),
    );
    commitAll(repo, "clarify strategy-alpha", "2026-07-02T12:00:00Z");

    // Class 2 — a failed condition retires/re-derives: edit the strategy's conditions + statement.
    writeNodeFile(
      repo,
      "strategy-alpha",
      strategyBase("strategy-alpha")
        .replace("statement: original statement", "statement: re-derived statement")
        .replace("    - the original world premise holds", "    - the premise no longer holds; re-derived"),
    );
    commitAll(repo, "re-derive strategy-alpha", "2026-07-03T12:00:00Z");

    // Class 3 — a calibration challenge moves a node: inject an attention boost on the tactic.
    writeNodeFile(
      repo,
      "tactic-beta",
      ["---", "id: tactic-beta", "kind: tactic", "statement: t", "owner: ai", "status: raw", "parent: null", "attention:", "  boost: 5", "  rationale: bumped by calibration", "---", "# tactic-beta", ""].join("\n"),
    );
    commitAll(repo, "boost tactic-beta", "2026-07-04T12:00:00Z");

    // No-match control: a body-only edit changes nothing tracked by the heuristics.
    writeNodeFile(
      repo,
      "tactic-beta",
      ["---", "id: tactic-beta", "kind: tactic", "statement: t", "owner: ai", "status: raw", "parent: null", "attention:", "  boost: 5", "  rationale: bumped by calibration", "---", "# tactic-beta", "", "New body prose, no frontmatter change.", ""].join("\n"),
    );
    commitAll(repo, "body-only edit", "2026-07-05T12:00:00Z");

    const events = scanDecisionTrace(repo, "2026-06-01");

    const cite = ofClass(events, "dialectic-cites-node");
    expect(cite).toHaveLength(1);
    expect(cite[0].node).toBe("strategy-alpha");

    const condition = ofClass(events, "condition-retires-strategy");
    expect(condition).toHaveLength(1);
    expect(condition[0].node).toBe("strategy-alpha");

    const calibration = ofClass(events, "calibration-moves-node");
    expect(calibration).toHaveLength(1);
    expect(calibration[0].node).toBe("tactic-beta");

    // The no-match control commit contributed nothing.
    expect(events.some((e) => e.commit && e.summary.includes("New body prose"))).toBe(false);
    expect(events).toHaveLength(3);
  });

  it("treats a deleted strategy file as a condition-retires-strategy event", () => {
    const repo = initRepo();
    writeNodeFile(repo, "strategy-gamma", strategyBase("strategy-gamma"));
    commitAll(repo, "add strategy-gamma", "2026-07-01T12:00:00Z");

    unlinkSync(join(repo, "intentions", "strategy-gamma.md"));
    commitAll(repo, "retire strategy-gamma", "2026-07-02T12:00:00Z");

    const events = scanDecisionTrace(repo, "2026-06-01");
    const condition = ofClass(events, "condition-retires-strategy");
    expect(condition).toHaveLength(1);
    expect(condition[0].node).toBe("strategy-gamma");
    expect(condition[0].summary).toBe("strategy file deleted");
  });

  it("does not attribute a plain tactic conditions/statement edit to class 2 (strategy-only)", () => {
    const repo = initRepo();
    writeNodeFile(
      repo,
      "tactic-delta",
      ["---", "id: tactic-delta", "kind: tactic", "statement: original", "owner: ai", "status: raw", "parent: null", "attention: null", "---", "# tactic-delta", ""].join("\n"),
    );
    commitAll(repo, "add tactic-delta", "2026-07-01T12:00:00Z");

    writeNodeFile(
      repo,
      "tactic-delta",
      ["---", "id: tactic-delta", "kind: tactic", "statement: changed", "owner: ai", "status: raw", "parent: null", "attention: null", "---", "# tactic-delta", ""].join("\n"),
    );
    commitAll(repo, "edit tactic-delta statement", "2026-07-02T12:00:00Z");

    const events = scanDecisionTrace(repo, "2026-06-01");
    expect(ofClass(events, "condition-retires-strategy")).toHaveLength(0);
  });

  it("emits ISO date, short hash, node id, class and summary in JSON shape", () => {
    const repo = initRepo();
    writeNodeFile(repo, "strategy-epsilon", strategyBase("strategy-epsilon"));
    commitAll(repo, "add", "2026-07-01T12:00:00Z");
    writeNodeFile(
      repo,
      "strategy-epsilon",
      strategyBase("strategy-epsilon").replace(
        "attention: null\n",
        "attention: null\nclarifications:\n  - question: q?\n    answer: a.\n",
      ),
    );
    commitAll(repo, "clarify", "2026-07-02T12:00:00Z");

    const events = scanDecisionTrace(repo, "2026-06-01");
    expect(events).toHaveLength(1);
    const e = events[0];
    // git %aI renders the backdated UTC commit as strict ISO-8601.
    expect(e.date).toMatch(/^2026-07-02T12:00:00(Z|\+00:00)$/);
    expect(e.commit).toMatch(/^[0-9a-f]{7}$/);
    expect(e.node).toBe("strategy-epsilon");
    expect(e.eventClass).toBe("dialectic-cites-node");
    expect(typeof e.summary).toBe("string");
    // Serializes cleanly to a JSON array.
    expect(() => JSON.parse(JSON.stringify(events))).not.toThrow();
  });

  it("throws on a git failure (not a repo)", () => {
    const bogus = mkdtempSync(join(tmpdir(), "trace-decisions-nogit-"));
    repos.push(bogus);
    expect(() => scanDecisionTrace(bogus, "2026-06-01")).toThrow();
  });
});

describe("nodeIdFromPath", () => {
  it("derives the node id from an intentions path", () => {
    expect(nodeIdFromPath("intentions/strategy-explicit-intent.md")).toBe("strategy-explicit-intent");
    expect(nodeIdFromPath("intentions/tactic-x.md")).toBe("tactic-x");
  });
});

describe("parseArgs", () => {
  it("defaults to a 30-day window and human output", () => {
    expect(parseArgs([])).toEqual({ since: "30 days ago", json: false });
  });
  it("parses --since and --json", () => {
    expect(parseArgs(["--since", "2026-07-07", "--json"])).toEqual({ since: "2026-07-07", json: true });
  });
  it("rejects --since without a value", () => {
    expect(() => parseArgs(["--since"])).toThrow(/requires a git-date/);
  });
  it("rejects an unknown flag", () => {
    expect(() => parseArgs(["--bogus"])).toThrow(/unknown argument/);
  });
});
