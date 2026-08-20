// The required-explicit-tree contract for the graph READERS
// (strategy-graph-native-dispatch clarification 194, ADOPTED 2026-08-05; scoped
// by clarification 242 to validate-graph.ts / write-node.ts / dump-node.ts /
// clear-park — clear-park's own arm lives in scripts/test-park-node.sh case 25).
//
// These three scripts used to infer the tree they operated on: validate-graph.ts
// from cwd (defaulting to the literal `intentions`), write-node.ts and
// dump-node.ts from `import.meta.url`. Both shapes made the store a property of
// WHERE or WHICH COPY ran rather than of what the caller asked for, and both
// failed silently:
//
//   - validate-graph.ts run where no `intentions/` exists validated nothing and
//     could report a clean graph (the vacuous pass).
//   - write-node.ts invoked by absolute path from a worktree wrote into the
//     SCRIPT's checkout, not the caller's — the 2026-08-05 incident in which the
//     session recording clarification 194 landed its own amendment in the shared
//     main checkout.
//
// So these cases assert the REFUSALS, not just the happy paths: a missing tree
// argument must be a usage error, never a fallback (.claude/rules/code-style.md).
// They spawn the real CLIs, because the defect lives in `main()`'s argument
// handling — the exported core functions (`writeNodeFromJson`, `dumpNodes`) have
// always taken the directory as a parameter and are covered elsewhere.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts");

/** Run one of the reader CLIs through tsx and capture its exit code + stderr. */
function runScript(script: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, ["--import", "tsx/esm", join(scriptsDir, script), ...args], {
    encoding: "utf8",
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** A scratch git repo with an empty `intentions/` store. */
function fixtureRepo(): { repoRoot: string; intentionsDir: string } {
  const repoRoot = mkdtempSync(join(tmpdir(), "reader-dir-"));
  spawnSync("git", ["-C", repoRoot, "init", "-q", "-b", "main"]);
  const intentionsDir = join(repoRoot, "intentions");
  mkdirSync(intentionsDir, { recursive: true });
  return { repoRoot, intentionsDir };
}

const NODE_JSON = JSON.stringify({
  id: "tactic-required-dir",
  kind: "tactic",
  statement: "Fixture node for the required-tree-argument contract.",
  owner: "ai",
  status: "codified",
  parent: null,
});

describe("validate-graph.ts requires an explicit intentions directory", () => {
  it("refuses a bare invocation instead of defaulting to cwd's `intentions`", { timeout: 30_000 }, () => {
    const run = runScript("validate-graph.ts", []);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("<intentionsDir> is required");
    // The old default is what made a wrong cwd survivable; it must be gone.
    expect(run.stdout).not.toContain("ok —");
  });

  it("refuses a directory that does not exist rather than validating nothing", { timeout: 30_000 }, () => {
    const { repoRoot } = fixtureRepo();
    const run = runScript("validate-graph.ts", [join(repoRoot, "no-such-store")]);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("does not exist");
    expect(run.stderr).toContain("NOT a clean graph");
    expect(run.stdout).not.toContain("ok —");
  });

  it("validates a directory the caller named, even an empty one", { timeout: 30_000 }, () => {
    const { intentionsDir } = fixtureRepo();
    const run = runScript("validate-graph.ts", [intentionsDir]);
    expect(run.status).toBe(0);
    // An empty store the caller NAMED is a legitimate (if empty) graph; the
    // defect was reporting that verdict for a directory nobody named.
    expect(run.stdout).toContain("ok — 0 nodes");
  });
});

describe("write-node.ts requires an explicit --dir", () => {
  it("refuses a write with no --dir instead of resolving one from its own location", { timeout: 30_000 }, () => {
    const { repoRoot, intentionsDir } = fixtureRepo();
    const jsonPath = join(repoRoot, "node.json");
    writeFileSync(jsonPath, NODE_JSON);

    const run = runScript("write-node.ts", ["--file", jsonPath]);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("--dir <intentions-dir> is required");
    // Nothing may be written anywhere as a side effect of the refusal.
    expect(existsSync(join(intentionsDir, "tactic-required-dir.md"))).toBe(false);
  });

  it("writes into the directory the caller named", { timeout: 30_000 }, () => {
    const { repoRoot, intentionsDir } = fixtureRepo();
    const jsonPath = join(repoRoot, "node.json");
    writeFileSync(jsonPath, NODE_JSON);

    const run = runScript("write-node.ts", ["--dir", intentionsDir, "--file", jsonPath]);
    expect(run.status).toBe(0);
    expect(existsSync(join(intentionsDir, "tactic-required-dir.md"))).toBe(true);
  });
});

describe("dump-node.ts requires an explicit --dir", () => {
  it("refuses a dump with no --dir instead of resolving one from its own location", { timeout: 30_000 }, () => {
    const { repoRoot } = fixtureRepo();
    const run = runScript("dump-node.ts", ["--out-dir", join(repoRoot, "out"), "tactic-required-dir"]);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("--dir <intentions-dir> is required");
  });

  it("pins base blobs in the repository that owns the named --dir", { timeout: 30_000 }, () => {
    const { repoRoot, intentionsDir } = fixtureRepo();
    const jsonPath = join(repoRoot, "node.json");
    writeFileSync(jsonPath, NODE_JSON);
    runScript("write-node.ts", ["--dir", intentionsDir, "--file", jsonPath]);

    const outDir = join(repoRoot, "out");
    const run = runScript("dump-node.ts", ["--dir", intentionsDir, "--out-dir", outDir, "tactic-required-dir"]);
    expect(run.status).toBe(0);

    // The manifest blob must be THIS repo's blob — the whole point of pinning a
    // compare-and-swap token to the tree that was actually read.
    const expected = spawnSync("git", ["-C", repoRoot, "hash-object", "intentions/tactic-required-dir.md"], {
      encoding: "utf8",
    }).stdout.trim();
    const manifest = readFileSync(join(outDir, "base-manifest.txt"), "utf8").trim();
    expect(manifest).toBe(`tactic-required-dir=${expected}`);
  });

  it("does not mistake the --dir value for a node id", { timeout: 30_000 }, () => {
    const { repoRoot, intentionsDir } = fixtureRepo();
    // No ids at all: the old index-arithmetic parser filtered on a leading `-`,
    // so `--dir <path>`'s PATH would have been collected as a node id and the
    // call would have failed with an unreadable-node error instead.
    const run = runScript("dump-node.ts", ["--dir", intentionsDir, "--out-dir", join(repoRoot, "out")]);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("at least one node id is required");
  });
});
