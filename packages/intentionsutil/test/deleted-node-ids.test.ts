import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { deletedNodeIds } from "../scripts/lib-deleted-node-ids.js";

// Tracks scratch dirs so each test cleans up after itself.
const scratch: string[] = [];

afterEach(() => {
  while (scratch.length > 0) {
    const dir = scratch.pop();
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  }
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}

/**
 * Build an origin repo whose history contains a node ADD followed by a node
 * DELETE, plus enough later commits that a `--depth 1` clone cannot see the
 * delete. That gap is precisely the failure this guard exists to catch.
 */
function makeOrigin(): string {
  const dir = mkdtempSync(join(tmpdir(), "deleted-ids-origin-"));
  scratch.push(dir);

  git(dir, "init", "--quiet", "-b", "main");
  git(dir, "config", "user.email", "test@example.com");
  git(dir, "config", "user.name", "Test");
  mkdirSync(join(dir, "intentions"));

  writeFileSync(join(dir, "intentions", "tactic-gone.md"), "# gone\n");
  writeFileSync(join(dir, "intentions", "tactic-kept.md"), "# kept\n");
  git(dir, "add", "-A");
  git(dir, "commit", "--quiet", "-m", "add two nodes");

  rmSync(join(dir, "intentions", "tactic-gone.md"));
  git(dir, "add", "-A");
  git(dir, "commit", "--quiet", "-m", "prune tactic-gone");

  // Later commits so the shallow clone's graft point sits AFTER the delete.
  for (const n of [1, 2, 3]) {
    writeFileSync(join(dir, "intentions", `tactic-later-${n}.md`), `# later ${n}\n`);
    git(dir, "add", "-A");
    git(dir, "commit", "--quiet", "-m", `later ${n}`);
  }
  return dir;
}

function cloneFull(origin: string): string {
  const dir = mkdtempSync(join(tmpdir(), "deleted-ids-full-"));
  scratch.push(dir);
  const dest = join(dir, "repo");
  execFileSync("git", ["clone", "--quiet", `file://${origin}`, dest], { encoding: "utf8" });
  return dest;
}

function cloneShallow(origin: string): string {
  const dir = mkdtempSync(join(tmpdir(), "deleted-ids-shallow-"));
  scratch.push(dir);
  const dest = join(dir, "repo");
  execFileSync("git", ["clone", "--quiet", "--depth", "1", `file://${origin}`, dest], {
    encoding: "utf8",
  });
  return dest;
}

describe("deletedNodeIds shallow-clone guard", () => {
  it("returns the deleted ids on a full clone", () => {
    const repo = cloneFull(makeOrigin());
    expect(git(repo, "rev-parse", "--is-shallow-repository").trim()).toBe("false");
    expect(deletedNodeIds(repo)).toEqual(["tactic-gone"]);
  });

  it("throws on a shallow clone instead of returning a truncated set", () => {
    const repo = cloneShallow(makeOrigin());
    expect(git(repo, "rev-parse", "--is-shallow-repository").trim()).toBe("true");
    expect(() => deletedNodeIds(repo)).toThrow(/SHALLOW/);
  });

  it("names the remedy in the error, so the caller knows how to fix it", () => {
    const repo = cloneShallow(makeOrigin());
    expect(() => deletedNodeIds(repo)).toThrow(/--unshallow/);
  });

  // The regression this guard was written for: without it, the shallow clone
  // silently returns [] here rather than ["tactic-gone"], and every prose
  // reference to tactic-gone is then reported as an unresolved violation. Pin
  // that the shallow repo genuinely cannot see the delete, so the test would
  // still be meaningful if the guard were ever removed.
  it("the shallow clone genuinely cannot see the delete (guard is load-bearing)", () => {
    const repo = cloneShallow(makeOrigin());
    const log = git(
      repo,
      "log",
      "--diff-filter=D",
      "--no-renames",
      "--name-only",
      "--pretty=format:",
      "--",
      "intentions/",
    );
    expect(log).not.toContain("tactic-gone");
  });
});
