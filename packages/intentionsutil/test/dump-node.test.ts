import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { dumpNodes } from "../scripts/dump-node.js";
import { writeNodeFromJson } from "../scripts/write-node.js";

/**
 * `dumpNodes` shells out to `git -C <repoRoot> hash-object intentions/<id>.md`,
 * so the fixture must be a real repo with a real `intentions/` directory. No
 * commit is ever made, so no git identity is needed.
 */
function fixtureRepo(): { repoRoot: string; intentionsDir: string; outDir: string } {
  const repoRoot = mkdtempSync(join(tmpdir(), "dump-node-"));
  execFileSync("git", ["-C", repoRoot, "init", "-q", "-b", "main"]);
  const intentionsDir = join(repoRoot, "intentions");
  mkdirSync(intentionsDir, { recursive: true });
  const outDir = join(repoRoot, "dump");
  return { repoRoot, intentionsDir, outDir };
}

function seedNode(intentionsDir: string, id: string): void {
  writeNodeFromJson(
    intentionsDir,
    JSON.stringify({
      id,
      kind: "tactic",
      statement: `Statement for ${id}.`,
      owner: "ai",
      status: "codified",
      parent: null,
    }),
  );
}

function manifestEntries(manifestPath: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(manifestPath, "utf8").split("\n")) {
    if (line.trim() === "") continue;
    const eq = line.indexOf("=");
    out[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return out;
}

/**
 * Collect what `fn` writes to stderr. The chunks are gathered inside the mock
 * because `mockRestore()` clears `mock.calls` along with the spy.
 */
function captureStderr<T>(fn: () => T): { result: T; warnings: string } {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stderr, "write").mockImplementation(((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  }) as typeof process.stderr.write);
  let result: T;
  try {
    result = fn();
  } finally {
    spy.mockRestore();
  }
  return { result, warnings: chunks.join("") };
}

function blobOf(repoRoot: string, id: string): string {
  return execFileSync("git", ["-C", repoRoot, "hash-object", `intentions/${id}.md`], {
    encoding: "utf8",
  }).trim();
}

describe("dumpNodes base manifest", () => {
  it("writes one line per id for a single multi-id call", () => {
    const { repoRoot, intentionsDir, outDir } = fixtureRepo();
    seedNode(intentionsDir, "tactic-alpha");
    seedNode(intentionsDir, "tactic-beta");

    const manifestPath = dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-alpha", "tactic-beta"]);

    expect(manifestEntries(manifestPath)).toEqual({
      "tactic-alpha": blobOf(repoRoot, "tactic-alpha"),
      "tactic-beta": blobOf(repoRoot, "tactic-beta"),
    });
  });

  // The defect: a second single-node dump into the same --out-dir used to
  // truncate the manifest, so `graph-commit --base` guarded only the second id
  // while the first landed with no compare-and-swap at all.
  it("preserves the first id's line when a second single-node dump reuses the out-dir", () => {
    const { repoRoot, intentionsDir, outDir } = fixtureRepo();
    seedNode(intentionsDir, "tactic-alpha");
    seedNode(intentionsDir, "tactic-beta");

    dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-alpha"]);
    const manifestPath = dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-beta"]);

    expect(manifestEntries(manifestPath)).toEqual({
      "tactic-alpha": blobOf(repoRoot, "tactic-alpha"),
      "tactic-beta": blobOf(repoRoot, "tactic-beta"),
    });
    // Both JSON dumps survive too.
    expect(() => readFileSync(join(outDir, "tactic-alpha.json"), "utf8")).not.toThrow();
    expect(() => readFileSync(join(outDir, "tactic-beta.json"), "utf8")).not.toThrow();
  });

  it("overwrites only its own id's line, in place, when an id is dumped twice", () => {
    const { repoRoot, intentionsDir, outDir } = fixtureRepo();
    seedNode(intentionsDir, "tactic-alpha");
    seedNode(intentionsDir, "tactic-beta");

    dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-alpha", "tactic-beta"]);
    const alphaBlob = blobOf(repoRoot, "tactic-alpha");

    // Re-read beta after its content moved; alpha is untouched.
    appendFileSync(join(intentionsDir, "tactic-beta.md"), "\nAn appended paragraph.\n");
    const manifestPath = dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-beta"]);

    const lines = readFileSync(manifestPath, "utf8").split("\n").filter((l) => l !== "");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(`tactic-alpha=${alphaBlob}`);
    expect(lines[1]).toBe(`tactic-beta=${blobOf(repoRoot, "tactic-beta")}`);
  });

  // A leftover id whose node file has moved on since the earlier dump cannot be
  // re-asserted. Carrying it forward is what makes `graph-commit` attempt a
  // three-way merge on an unrelated node and park the write actually in flight.
  it("drops an unverifiable leftover entry and warns on stderr", () => {
    const { repoRoot, intentionsDir, outDir } = fixtureRepo();
    seedNode(intentionsDir, "tactic-alpha");
    seedNode(intentionsDir, "tactic-beta");

    dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-alpha"]);
    // Stand in for "an earlier graph-commit already landed an edit to alpha":
    // its on-disk content no longer matches the recorded base blob.
    appendFileSync(join(intentionsDir, "tactic-alpha.md"), "\nLanded by an earlier commit.\n");

    const { result: manifestPath, warnings } = captureStderr(() =>
      dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-beta"]),
    );

    expect(manifestEntries(manifestPath)).toEqual({
      "tactic-beta": blobOf(repoRoot, "tactic-beta"),
    });
    expect(warnings).toContain("tactic-alpha");
    expect(warnings).toContain("dropping stale manifest entry");
  });

  it("drops a leftover entry whose node file no longer exists", () => {
    const { repoRoot, intentionsDir, outDir } = fixtureRepo();
    seedNode(intentionsDir, "tactic-alpha");
    seedNode(intentionsDir, "tactic-beta");

    dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-alpha"]);
    rmSync(join(intentionsDir, "tactic-alpha.md"));

    const { result: manifestPath, warnings } = captureStderr(() =>
      dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-beta"]),
    );

    expect(manifestEntries(manifestPath)).toEqual({
      "tactic-beta": blobOf(repoRoot, "tactic-beta"),
    });
    expect(warnings).toContain("absent");
  });

  it("throws on a corrupt existing manifest rather than silently thinning the guard", () => {
    const { repoRoot, intentionsDir, outDir } = fixtureRepo();
    seedNode(intentionsDir, "tactic-alpha");

    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "base-manifest.txt"), "not-a-pair\n");

    expect(() => dumpNodes(intentionsDir, repoRoot, outDir, ["tactic-alpha"])).toThrow(
      /malformed line in existing manifest/,
    );
  });
});
