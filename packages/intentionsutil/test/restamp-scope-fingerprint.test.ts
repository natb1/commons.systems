import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { tacticScopeFingerprint } from "../src/router.js";
import { restampScope } from "../scripts/restamp-scope-fingerprint.js";
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
