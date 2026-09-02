// Coverage for the consolidate-node CLI, following merge-node-cli.test.ts /
// deferred-queue-cli.test.ts's shape: the pure-ish core helpers
// (`runConsolidation`, `parseRestatementFile`, `resolveDispositions`,
// `gitBlobSha1`) are imported and exercised directly, and a small spawned
// block covers what only a real process boundary can pin — argv parsing, the
// three-way exit-code contract, and the report text on stdout.

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { describe, expect, it } from "vitest";
import {
  gitBlobSha1,
  parseRestatementFile,
  resolveDispositions,
  rulesSizeRecords,
  runConsolidation,
  runRulesCorpus,
} from "../scripts/consolidate-node.js";
import type { IntentionNode } from "../src/schema.js";

/** Build a full IntentionNode fixture, filling required/default fields. */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
    status: partial.status ?? "raw",
    parent: partial.parent ?? null,
    serves: partial.serves ?? [],
    recovers: partial.recovers ?? [],
    rationale: partial.rationale ?? null,
    reading: partial.reading ?? null,
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attention: partial.attention ?? null,
    phase: partial.phase ?? null,
    execution: partial.execution ?? null,
    validates: partial.validates ?? [],
    blocked_by: partial.blocked_by ?? [],
    superseded_by: partial.superseded_by ?? [],
    supersession_expiry: partial.supersession_expiry ?? null,
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/** A body long enough that a restated body + citation is strictly smaller. */
const BIG_BODY =
  "# Statement\n\n" +
  "This is repeated verbose prose that piles up over many appends and needs consolidating away eventually. ".repeat(
    30,
  ) +
  "\n";

/** Write a node fixture directly to `dir/<id>.md`, body appended verbatim. */
function seed(dir: string, node: IntentionNode, body: string = BIG_BODY): string {
  const path = join(dir, `${node.id}.md`);
  writeFileSync(path, `---\n${stringify(node)}---\n${body}`);
  return path;
}

function fixtureDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "consolidate-node-cli-"));
  mkdirSync(dir, { recursive: true });
  return dir;
}

const DEFERRED_STAMP = "(decision: deferred, delegation-anthropic-claude, 2026-08-30)";
const RATIFIED_STAMP = "(decision: author-ratified, 2026-08-30)";

describe("parseRestatementFile", () => {
  it("parses a well-formed --file payload", () => {
    const input = parseRestatementFile(
      JSON.stringify({
        dispositionKeys: ["tactic-x#1"],
        foldedClarifications: [1],
        restatedBody: "# Short\n\nSummary.\n",
        restatedClarifications: [{ question: "q", answer: "a" }],
        foldDate: "2026-09-02",
        foldDelegatee: "delegation-anthropic-claude",
        allowGrowth: null,
      }),
    );
    expect(input.dispositionKeys).toEqual(["tactic-x#1"]);
    expect(input.foldDelegatee).toBe("delegation-anthropic-claude");
    expect(input.allowGrowth).toBeNull();
  });

  it("throws on malformed JSON", () => {
    expect(() => parseRestatementFile("{ not json")).toThrow();
  });

  it("throws when a required field is the wrong type", () => {
    expect(() =>
      parseRestatementFile(
        JSON.stringify({
          dispositionKeys: ["tactic-x#1"],
          foldedClarifications: [1],
          restatedBody: 12345, // wrong type — should be a string
          restatedClarifications: [],
          foldDate: "2026-09-02",
          foldDelegatee: null,
        }),
      ),
    ).toThrow(/restatedBody/);
  });
});

describe("resolveDispositions", () => {
  it("resolves a requested key against the node's own parsed stamps", () => {
    const corpus = DEFERRED_STAMP;
    const records = resolveDispositions("tactic-x", "tactic", corpus, ["tactic-x#1"]);
    expect(records).toHaveLength(1);
    expect(records[0]?.state).toBe("deferred");
  });

  it("throws naming the missing key and listing what is available", () => {
    const corpus = DEFERRED_STAMP;
    expect(() => resolveDispositions("tactic-x", "tactic", corpus, ["tactic-x#7"])).toThrow(/tactic-x#7/);
  });
});

describe("runConsolidation", () => {
  it("dry-run prints the plan and citation and writes nothing", () => {
    const dir = fixtureDir();
    const node = anode({
      id: "tactic-dryrun",
      kind: "tactic",
      clarifications: [{ question: "q1", answer: DEFERRED_STAMP }],
    });
    const path = seed(dir, node);
    const before = readFileSync(path, "utf8");

    const fileRaw = JSON.stringify({
      dispositionKeys: ["tactic-dryrun#1"],
      foldedClarifications: [1],
      restatedBody: "# Statement\n\nConsolidated summary.\n",
      restatedClarifications: [],
      foldDate: "2026-09-02",
      foldDelegatee: "delegation-anthropic-claude",
      allowGrowth: null,
    });

    const report = runConsolidation(dir, node.id, fileRaw, true);

    expect(report).toContain("verdict: permitted");
    expect(report).toContain("mode: dry-run");
    expect(report).toContain("## Consolidation record");
    // Nothing written: the file on disk is byte-identical to before the call.
    expect(readFileSync(path, "utf8")).toBe(before);
    // A dry run never prints a blob sha or a landing command.
    expect(report).not.toContain("pre-edit blob sha");
    expect(report).not.toContain("graph-commit");
  });

  it("a ratified stamp is refused, verdict rendered, and the file is untouched", () => {
    const dir = fixtureDir();
    const node = anode({
      id: "tactic-refused",
      kind: "tactic",
      clarifications: [{ question: "q1", answer: RATIFIED_STAMP }],
    });
    const path = seed(dir, node);
    const before = readFileSync(path, "utf8");

    const fileRaw = JSON.stringify({
      dispositionKeys: ["tactic-refused#1"],
      foldedClarifications: [1],
      restatedBody: "# Statement\n\nConsolidated summary.\n",
      restatedClarifications: [],
      foldDate: "2026-09-02",
      foldDelegatee: null,
      allowGrowth: null,
    });

    const report = runConsolidation(dir, node.id, fileRaw, false);

    expect(report).toContain("verdict: refused");
    expect(report).toMatch(/rule \(1\)/);
    expect(readFileSync(path, "utf8")).toBe(before);
  });

  it("a permitted non-dry-run plan rewrites the file and reports the pre-edit blob sha", () => {
    const dir = fixtureDir();
    const node = anode({
      id: "tactic-write",
      kind: "tactic",
      clarifications: [{ question: "q1", answer: DEFERRED_STAMP }],
    });
    const path = seed(dir, node);

    // Snapshot the pre-edit bytes to an independent copy BEFORE the CLI
    // mutates the original — `git hash-object` on the live path after the
    // write would hash the wrong (post-edit) content.
    const preEditCopy = join(dir, "pre-edit-copy.md");
    copyFileSync(path, preEditCopy);
    const expectedSha = spawnSync("git", ["hash-object", preEditCopy], { encoding: "utf8" }).stdout.trim();
    expect(expectedSha).toMatch(/^[0-9a-f]{40}$/);
    // Cross-check the in-process implementation against the same fixture,
    // independent of the CLI run below.
    expect(gitBlobSha1(readFileSync(preEditCopy))).toBe(expectedSha);

    const fileRaw = JSON.stringify({
      dispositionKeys: ["tactic-write#1"],
      foldedClarifications: [1],
      restatedBody: "# Statement\n\nConsolidated summary.\n",
      restatedClarifications: [],
      foldDate: "2026-09-02",
      foldDelegatee: "delegation-anthropic-claude",
      allowGrowth: null,
    });

    const report = runConsolidation(dir, node.id, fileRaw, false);

    expect(report).toContain("verdict: permitted");
    expect(report).toContain("mode: write");
    expect(report).toContain(`pre-edit blob sha: ${expectedSha}`);
    expect(report).toContain("graph-commit -C");
    expect(report).toContain(`--base ${node.id}=${expectedSha} ${node.id}`);
    expect(report).toContain(`-m 'graph: consolidate ${node.id}'`);

    // The file on disk actually changed: it now carries the restated prose
    // and the citation heading, and it no longer carries the big pre-fold body.
    const after = readFileSync(path, "utf8");
    expect(after).toContain("Consolidated summary.");
    expect(after).toContain("## Consolidation record");
    expect(after).not.toContain("piles up over many appends");
  });

  it("a permitted plan with an empty dispositionKeys list refuses (unrecoverable provenance)", () => {
    const dir = fixtureDir();
    const node = anode({ id: "tactic-nostamp", kind: "tactic" });
    seed(dir, node);

    const fileRaw = JSON.stringify({
      dispositionKeys: [],
      foldedClarifications: [],
      restatedBody: "# Statement\n\nConsolidated summary.\n",
      restatedClarifications: [],
      foldDate: "2026-09-02",
      foldDelegatee: null,
      allowGrowth: null,
    });

    const report = runConsolidation(dir, node.id, fileRaw, true);
    expect(report).toContain("verdict: refused");
    expect(report).toMatch(/authority is unknown/);
  });
});

// --- `--corpus rules` mode -------------------------------------------------

/** Write a small rules-shaped fixture directory of `.md` files. */
function rulesFixtureDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "consolidate-node-rules-"));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

describe("rulesSizeRecords", () => {
  it("builds one SizeRecord per .md file, bytes from the file and units from ## headings", () => {
    const dir = rulesFixtureDir({
      "a.md": "# A\n\n## one\n\n## two\ntext\n",
      "b.md": "# B\nno headings here\n",
      "not-a-rule.txt": "ignored",
    });
    const records = rulesSizeRecords(dir);
    expect(records).toHaveLength(2);
    const byId = new Map(records.map((r) => [r.id, r]));
    expect(byId.get("a.md")?.units).toBe(2);
    expect(byId.get("b.md")?.units).toBe(0);
    expect(byId.get("a.md")?.bytes).toBe(Buffer.byteLength("# A\n\n## one\n\n## two\ntext\n", "utf8"));
    expect(byId.get("a.md")?.latestDate).toBeNull();
  });
});

describe("runRulesCorpus", () => {
  it("is read-only and ranks files by bytes descending", () => {
    const dir = rulesFixtureDir({
      "small.md": "short\n",
      "big.md": "x".repeat(500) + "\n",
    });
    const before = { small: readFileSync(join(dir, "small.md"), "utf8"), big: readFileSync(join(dir, "big.md"), "utf8") };

    const report = runRulesCorpus(dir);

    expect(report).toContain("bytes total across 2 files");
    const lines = report.trimEnd().split("\n");
    const bigLine = lines.findIndex((l) => l.includes("big.md"));
    const smallLine = lines.findIndex((l) => l.includes("small.md"));
    expect(bigLine).toBeGreaterThan(-1);
    expect(bigLine).toBeLessThan(smallLine);

    // Nothing written.
    expect(readFileSync(join(dir, "small.md"), "utf8")).toBe(before.small);
    expect(readFileSync(join(dir, "big.md"), "utf8")).toBe(before.big);
  });

  it("is deterministic — two calls over the same directory are byte-identical", () => {
    const dir = rulesFixtureDir({ "a.md": "## h\ntext\n", "b.md": "more text\n" });
    expect(runRulesCorpus(dir)).toBe(runRulesCorpus(dir));
  });
});

describe("consolidate-node CLI --corpus rules", () => {
  it("exits 0 with the shortlist and requires no --id/--file", () => {
    const dir = rulesFixtureDir({
      "sandbox.md": "x".repeat(200) + "\n## heading\n",
      "small.md": "y\n",
    });

    const run = runCli(["--corpus", "rules", "--rules-dir", dir]);

    expect(run.status).toBe(0);
    expect(run.stdout).toContain("sandbox.md");
    expect(run.stdout).toContain("small.md");
    expect(run.stdout).toContain("bytes total across 2 files");
  });

  it("exits 3 when --rules-dir is missing", () => {
    const run = runCli(["--corpus", "rules"]);
    expect(run.status).toBe(3);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("--rules-dir requires a value argument");
  });

  it("exits 3 when --corpus rules is combined with --dir", () => {
    const dir = rulesFixtureDir({ "a.md": "text\n" });
    const run = runCli(["--corpus", "rules", "--rules-dir", dir, "--dir", dir]);
    expect(run.status).toBe(3);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("does not take --dir/--id/--file");
  });

  it("exits 3 on an unrecognized --corpus value", () => {
    const run = runCli(["--corpus", "bogus"]);
    expect(run.status).toBe(3);
    expect(run.stderr).toContain('unrecognized --corpus value "bogus"');
  });
});

// --- the CLI's process contract, which only a SPAWNED run can observe ------

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts");

function runCli(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx/esm", join(scriptsDir, "consolidate-node.ts"), ...args],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("consolidate-node CLI", () => {
  it("exits 0 with the dry-run report over a permitted plan", () => {
    const dir = fixtureDir();
    const node = anode({
      id: "tactic-cli-dryrun",
      kind: "tactic",
      clarifications: [{ question: "q1", answer: DEFERRED_STAMP }],
    });
    seed(dir, node);

    const filePath = join(dir, "restatement.json");
    writeFileSync(
      filePath,
      JSON.stringify({
        dispositionKeys: ["tactic-cli-dryrun#1"],
        foldedClarifications: [1],
        restatedBody: "# Statement\n\nConsolidated summary.\n",
        restatedClarifications: [],
        foldDate: "2026-09-02",
        foldDelegatee: "delegation-anthropic-claude",
        allowGrowth: null,
      }),
    );

    const run = runCli(["--dir", dir, "--id", node.id, "--file", filePath, "--dry-run"]);

    expect(run.status).toBe(0);
    expect(run.stdout).toContain("verdict: permitted");
    expect(run.stdout).toContain("mode: dry-run");
  });

  it("exits 3 with a usage error and no report when --dir is missing", () => {
    const run = runCli(["--id", "tactic-x", "--file", "/dev/null"]);

    expect(run.status).toBe(3);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("--dir requires a value argument");
  });

  it("exits 3 with a usage error and no report when --id is missing", () => {
    const dir = fixtureDir();
    const run = runCli(["--dir", dir, "--file", "/dev/null"]);

    expect(run.status).toBe(3);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("--id requires a value argument");
  });

  it("exits 3 with a usage error and no report when --file is missing", () => {
    const dir = fixtureDir();
    const run = runCli(["--dir", dir, "--id", "tactic-x"]);

    expect(run.status).toBe(3);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("--file requires a value argument");
  });

  it("exits 3 on malformed --file JSON", () => {
    const dir = fixtureDir();
    const node = anode({ id: "tactic-cli-malformed", kind: "tactic" });
    seed(dir, node);

    const filePath = join(dir, "bad.json");
    writeFileSync(filePath, "{ this is not json");

    const run = runCli(["--dir", dir, "--id", node.id, "--file", filePath, "--dry-run"]);

    expect(run.status).toBe(3);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("not valid JSON");
  });

  it("a permitted, non-dry-run CLI run rewrites the node file on disk", () => {
    const dir = fixtureDir();
    const node = anode({
      id: "tactic-cli-write",
      kind: "tactic",
      clarifications: [{ question: "q1", answer: DEFERRED_STAMP }],
    });
    const path = seed(dir, node);

    const filePath = join(dir, "restatement.json");
    writeFileSync(
      filePath,
      JSON.stringify({
        dispositionKeys: ["tactic-cli-write#1"],
        foldedClarifications: [1],
        restatedBody: "# Statement\n\nConsolidated summary.\n",
        restatedClarifications: [],
        foldDate: "2026-09-02",
        foldDelegatee: "delegation-anthropic-claude",
        allowGrowth: null,
      }),
    );

    const run = runCli(["--dir", dir, "--id", node.id, "--file", filePath]);

    expect(run.status).toBe(0);
    expect(run.stdout).toContain("mode: write");
    expect(run.stdout).toContain("pre-edit blob sha:");
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8")).toContain("Consolidated summary.");
  });
});
