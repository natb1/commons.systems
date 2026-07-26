import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { tacticScopeFingerprint } from "../src/router.js";
import { readNode, parseNodeRaw } from "../src/store.js";
import { hasNeedsMainResidue, parseScopeStamp } from "../src/transitions.js";
import { restampScope, restampScopeFromRev } from "../scripts/restamp-scope-fingerprint.js";
import { writeNodeFromJson } from "../scripts/write-node.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-"));
}

// `restampScope` shells out to `git rev-parse origin/main`, so `repoRoot`
// must be a real checkout with a real `origin/main` — use this repo's own
// root rather than a fixture repo. `intentionsDir` and `mainRoot` stay
// scratch temp dirs so the test never touches the real
// `.claude/worktrees/` stamp directory.
const realRepoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

describe("restampScope", () => {
  it("writes a two-field stamp matching the recomputed fingerprint and current origin/main sha", () => {
    const intentionsDir = tempDir();
    const mainRoot = tempDir();
    const statement = "Restamp scope after a scope-inert align-round edit.";

    writeNodeFromJson(
      intentionsDir,
      JSON.stringify({
        id: "tactic-restamp-fixture",
        kind: "tactic",
        statement,
        owner: "human",
        status: "codified",
        parent: null,
      }),
    );

    const result = restampScope(intentionsDir, realRepoRoot, mainRoot, "tactic-restamp-fixture");

    const stampPath = join(mainRoot, ".claude", "worktrees", "tactic-restamp-fixture.scope-fingerprint");
    const content = readFileSync(stampPath, "utf8");

    // Exactly one line, trailing newline, exactly two whitespace-separated fields.
    expect(content.endsWith("\n")).toBe(true);
    const lines = content.split("\n").filter((l) => l !== "");
    expect(lines).toHaveLength(1);
    const parts = lines[0].split(/\s+/);
    expect(parts).toHaveLength(2);

    const [fingerprintField, shaField] = parts;
    const expectedSha = execFileSync("git", ["rev-parse", "origin/main"], {
      cwd: realRepoRoot,
      encoding: "utf8",
    }).trim();
    // The body of a freshly-written node is the generated `# ${statement}\n`
    // placeholder (writeNode's fallback for a brand-new file).
    const expectedFingerprint = tacticScopeFingerprint(statement, `# ${statement}\n`);

    expect(fingerprintField).toBe(expectedFingerprint);
    expect(shaField).toBe(expectedSha);
    expect(content).toBe(`${expectedFingerprint} ${expectedSha}\n`);

    expect(result.fingerprint).toBe(expectedFingerprint);
    expect(result.sha).toBe(expectedSha);
  });

  it("throws on a nonexistent node id", () => {
    const intentionsDir = tempDir();
    const mainRoot = tempDir();

    expect(() => restampScope(intentionsDir, realRepoRoot, mainRoot, "tactic-does-not-exist")).toThrow();
  });

  it("propagates a git failure (fails LOUD) when origin/main cannot be resolved", () => {
    // The node exists, so readNode/readNodeBody succeed and the failure comes
    // from the `git rev-parse origin/main` call — exercising the script's
    // central distinguishing contract versus transition-node's
    // `refresh_stamp()`, which fails OPEN. `repoRoot` here is a bare scratch
    // dir that is not a git repo, so `git rev-parse origin/main` fails and the
    // error must propagate rather than be swallowed.
    const intentionsDir = tempDir();
    const mainRoot = tempDir();
    const nonGitRepoRoot = tempDir();

    writeNodeFromJson(
      intentionsDir,
      JSON.stringify({
        id: "tactic-git-failure-fixture",
        kind: "tactic",
        statement: "Fail loud when origin/main cannot be resolved.",
        owner: "human",
        status: "codified",
        parent: null,
      }),
    );

    expect(() =>
      restampScope(intentionsDir, nonGitRepoRoot, mainRoot, "tactic-git-failure-fixture"),
    ).toThrow();
  });
});

// --- restampScopeFromRev -----------------------------------------------

function nodeRaw(id: string, statement: string, body: string): string {
  return (
    `---\n` +
    `id: ${id}\n` +
    `kind: tactic\n` +
    `statement: ${statement}\n` +
    `owner: human\n` +
    `status: codified\n` +
    `parent: null\n` +
    `---\n` +
    body
  );
}

describe("restampScopeFromRev", () => {
  it("stamps the COMMITTED content, not the uncommitted working-tree content", () => {
    const id = "tactic-restamp-from-rev-fixture";
    const statement = "Stamp what actually landed, not the reverted worktree.";
    const bodyA = "# " + statement + "\n\nOriginal committed body.\n";
    const bodyB = "# " + statement + "\n\nUncommitted working-tree body, must NOT be stamped.\n";

    const scratchRepo = tempDir();
    execFileSync("git", ["init", "-b", "main"], { cwd: scratchRepo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: scratchRepo });
    execFileSync("git", ["config", "user.name", "Test User"], { cwd: scratchRepo });

    const intentionsDirName = "intentions";
    const intentionsAbsDir = join(scratchRepo, intentionsDirName);
    execFileSync("mkdir", ["-p", intentionsAbsDir]);
    const nodePath = join(intentionsAbsDir, `${id}.md`);
    writeFileSync(nodePath, nodeRaw(id, statement, bodyA));
    execFileSync("git", ["add", "-A"], { cwd: scratchRepo });
    execFileSync("git", ["commit", "-m", "add fixture node"], { cwd: scratchRepo });

    // Overwrite on disk, uncommitted — this is the reverted-worktree state
    // `restampScopeFromRev` must NOT read from.
    writeFileSync(nodePath, nodeRaw(id, statement, bodyB));

    const mainRoot = tempDir();
    const result = restampScopeFromRev(scratchRepo, mainRoot, id, "main");

    const expectedSha = execFileSync("git", ["rev-parse", "main"], { cwd: scratchRepo, encoding: "utf8" }).trim();
    const expectedFingerprint = tacticScopeFingerprint(statement, bodyA);
    const wrongFingerprint = tacticScopeFingerprint(statement, bodyB);

    expect(result.sha).toBe(expectedSha);
    expect(result.fingerprint).toBe(expectedFingerprint);
    expect(result.fingerprint).not.toBe(wrongFingerprint);
  });

  it("matches the needs-main-residue production scenario: A and B fingerprints differ", () => {
    const id = "tactic-restamp-residue-fixture";
    const statement = "Carry a needs-main residue append across a transition.";
    const bodyA = "# " + statement + "\n\nPre-transition body.\n";
    const bodyB =
      "# " + statement + "\n\nPre-transition body.\n\n## needs-main residue\n\nVerify in production after merge.\n";

    expect(hasNeedsMainResidue(bodyB)).toBe(true);
    expect(hasNeedsMainResidue(bodyA)).toBe(false);

    const scratchRepo = tempDir();
    execFileSync("git", ["init", "-b", "main"], { cwd: scratchRepo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: scratchRepo });
    execFileSync("git", ["config", "user.name", "Test User"], { cwd: scratchRepo });

    const intentionsAbsDir = join(scratchRepo, "intentions");
    execFileSync("mkdir", ["-p", intentionsAbsDir]);
    const nodePath = join(intentionsAbsDir, `${id}.md`);
    writeFileSync(nodePath, nodeRaw(id, statement, bodyB));
    execFileSync("git", ["add", "-A"], { cwd: scratchRepo });
    execFileSync("git", ["commit", "-m", "add fixture node with residue"], { cwd: scratchRepo });

    const mainRoot = tempDir();
    const result = restampScopeFromRev(scratchRepo, mainRoot, id, "main");

    const fingerprintA = tacticScopeFingerprint(statement, bodyA);
    const fingerprintB = tacticScopeFingerprint(statement, bodyB);
    expect(fingerprintA).not.toBe(fingerprintB);
    expect(result.fingerprint).toBe(fingerprintB);
  });

  it("round-trips through parseScopeStamp", () => {
    const id = "tactic-restamp-roundtrip-fixture";
    const statement = "Round-trip the written stamp through the shared parser.";
    const body = "# " + statement + "\n";

    const scratchRepo = tempDir();
    execFileSync("git", ["init", "-b", "main"], { cwd: scratchRepo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: scratchRepo });
    execFileSync("git", ["config", "user.name", "Test User"], { cwd: scratchRepo });

    const intentionsAbsDir = join(scratchRepo, "intentions");
    execFileSync("mkdir", ["-p", intentionsAbsDir]);
    const nodePath = join(intentionsAbsDir, `${id}.md`);
    writeFileSync(nodePath, nodeRaw(id, statement, body));
    execFileSync("git", ["add", "-A"], { cwd: scratchRepo });
    execFileSync("git", ["commit", "-m", "add fixture node"], { cwd: scratchRepo });

    const mainRoot = tempDir();
    const result = restampScopeFromRev(scratchRepo, mainRoot, id, "main");

    const stampPath = join(mainRoot, ".claude", "worktrees", `${id}.scope-fingerprint`);
    const content = readFileSync(stampPath, "utf8");
    const parsed = parseScopeStamp(content);

    expect(parsed).not.toBeNull();
    expect(parsed?.fingerprint).toBe(result.fingerprint);
    expect(parsed?.sha).toBe(result.sha);
  });

  it("fails loud on a rev/path that does not exist", () => {
    const scratchRepo = tempDir();
    execFileSync("git", ["init", "-b", "main"], { cwd: scratchRepo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: scratchRepo });
    execFileSync("git", ["config", "user.name", "Test User"], { cwd: scratchRepo });
    // At least one commit so "main" resolves; the node file itself is never added.
    writeFileSync(join(scratchRepo, "README.md"), "placeholder\n");
    execFileSync("git", ["add", "-A"], { cwd: scratchRepo });
    execFileSync("git", ["commit", "-m", "init"], { cwd: scratchRepo });

    const mainRoot = tempDir();
    expect(() => restampScopeFromRev(scratchRepo, mainRoot, "tactic-not-on-main", "main")).toThrow();
  });
});

describe("parseNodeRaw / readNode agreement", () => {
  it("parseNodeRaw(raw, id) and readNode(dir, id) produce the same result for the same content", () => {
    const intentionsDir = tempDir();
    const statement = "Guard the parseNodeRaw/readNode extraction.";

    writeNodeFromJson(
      intentionsDir,
      JSON.stringify({
        id: "tactic-parse-node-raw-guard",
        kind: "tactic",
        statement,
        owner: "human",
        status: "codified",
        parent: null,
      }),
    );

    const raw = readFileSync(join(intentionsDir, "tactic-parse-node-raw-guard.md"), "utf8");

    expect(parseNodeRaw(raw, "tactic-parse-node-raw-guard")).toEqual(
      readNode(intentionsDir, "tactic-parse-node-raw-guard"),
    );
  });
});
