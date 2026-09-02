import { describe, expect, it } from "vitest";
import {
  danglingToolingPaths,
  extractCandidateTokens,
  stripLineAnchor,
  TOOLING_ROOTS,
  type ScannedFile,
} from "../src/dangling-tooling-path.js";

describe("extractCandidateTokens", () => {
  it("keeps a bare path-like token", () => {
    expect(extractCandidateTokens("run packages/foo/bar.ts now")).toEqual([
      "packages/foo/bar.ts",
    ]);
  });

  it("strips surrounding quotes and backticks", () => {
    expect(extractCandidateTokens("see `packages/foo/bar.ts` for details")).toEqual([
      "packages/foo/bar.ts",
    ]);
    expect(extractCandidateTokens('run "packages/foo/bar.ts" now')).toEqual([
      "packages/foo/bar.ts",
    ]);
  });

  it("strips trailing separators (comma, semicolon)", () => {
    expect(extractCandidateTokens("see packages/foo/bar.ts, and also packages/x/y.ts;")).toEqual([
      "packages/foo/bar.ts",
      "packages/x/y.ts",
    ]);
  });

  it("drops a token with no slash", () => {
    expect(extractCandidateTokens("just some prose here")).toEqual([]);
  });

  it("drops a URL (contains ://)", () => {
    expect(extractCandidateTokens("see https://example.com/foo/bar")).toEqual([]);
  });

  it("drops a token containing a forbidden shell-glob/variable character", () => {
    expect(extractCandidateTokens("$FOO/bar.ts")).toEqual([]);
    expect(extractCandidateTokens("foo/*.ts")).toEqual([]);
    expect(extractCandidateTokens("foo/{a,b}.ts")).toEqual([]);
    expect(extractCandidateTokens("foo/(bar).ts")).toEqual([]);
  });
});

describe("stripLineAnchor", () => {
  it("strips a trailing :<line> anchor", () => {
    expect(stripLineAnchor("packages/foo/bar.ts:42")).toBe("packages/foo/bar.ts");
  });

  it("strips a trailing :<line>-<line> range anchor", () => {
    expect(stripLineAnchor("packages/foo/bar.ts:42-51")).toBe("packages/foo/bar.ts");
  });

  it("leaves a token with no anchor untouched", () => {
    expect(stripLineAnchor("packages/foo/bar.ts")).toBe("packages/foo/bar.ts");
  });
});

describe("TOOLING_ROOTS", () => {
  it("names exactly the four documented roots", () => {
    expect([...TOOLING_ROOTS].sort()).toEqual(
      [
        ".claude/hooks/",
        ".claude/skills/",
        ".github/scripts/",
        "packages/intentionsutil/scripts/",
      ].sort(),
    );
  });
});

describe("danglingToolingPaths", () => {
  function file(path: string, content: string): ScannedFile {
    return { path, content };
  }

  it("flags a tooling-root path that is absent now but once existed (an orphan)", () => {
    const files = [file(".claude/skills/foo/SKILL.md", "see packages/intentionsutil/scripts/gone.ts")];
    const seeds = danglingToolingPaths({
      files,
      exists: () => false,
      everExisted: () => true,
    });
    expect(seeds).toHaveLength(1);
    expect(seeds[0].subject).toContain("packages/intentionsutil/scripts/gone.ts");
  });

  it("does NOT flag a forward reference — absent now, but never existed either", () => {
    const files = [
      file(".claude/skills/foo/SKILL.md", "will add packages/intentionsutil/scripts/future.ts next"),
    ];
    const seeds = danglingToolingPaths({
      files,
      exists: () => false,
      everExisted: () => false, // never existed: a plan naming its own future deliverable
    });
    expect(seeds).toEqual([]);
  });

  it("does not flag a path that exists on disk right now", () => {
    const files = [file(".claude/skills/foo/SKILL.md", "see packages/intentionsutil/scripts/live.ts")];
    const seeds = danglingToolingPaths({
      files,
      exists: () => true,
      everExisted: () => true,
    });
    expect(seeds).toEqual([]);
  });

  it("ignores a token outside the four tooling roots", () => {
    const files = [file("intentions/tactic-foo.md", "see docs/random/other.md")];
    const seeds = danglingToolingPaths({
      files,
      exists: () => false,
      everExisted: () => true,
    });
    expect(seeds).toEqual([]);
  });

  it("dedupes an identical (file, path) pair named twice in one file", () => {
    const files = [
      file(
        "intentions/tactic-foo.md",
        "see packages/intentionsutil/scripts/gone.ts\nagain: packages/intentionsutil/scripts/gone.ts",
      ),
    ];
    const seeds = danglingToolingPaths({ files, exists: () => false, everExisted: () => true });
    expect(seeds).toHaveLength(1);
  });

  it("strips a trailing :<line> anchor before testing existence/history", () => {
    const files = [file("intentions/tactic-foo.md", "see .claude/hooks/gone.sh:12-14")];
    let queriedExists: string | undefined;
    let queriedEver: string | undefined;
    danglingToolingPaths({
      files,
      exists: (p) => {
        queriedExists = p;
        return false;
      },
      everExisted: (p) => {
        queriedEver = p;
        return true;
      },
    });
    expect(queriedExists).toBe(".claude/hooks/gone.sh");
    expect(queriedEver).toBe(".claude/hooks/gone.sh");
  });
});
