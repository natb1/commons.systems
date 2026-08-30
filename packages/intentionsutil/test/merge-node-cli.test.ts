// Round-trip coverage for the merge-node CLI's core helper. node-merge.test.ts
// covers the pure merge rule; this file covers the fs half — specifically the
// question the pure tests cannot answer: does an EMPTIED list (or a deleted
// attributes key) survive `validateNode` + `stringify` on the way to --out, or
// does the serialization path quietly restore what the merge dropped?
//
// `mergeNodeFiles` is imported directly rather than spawned, matching
// dump-node.test.ts / write-node.test.ts. Fixtures are built through
// `writeNodeFromJson` so they are real validated frontmatter, not hand-authored
// markdown that could drift from the schema.

import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { mergeNodeFiles } from "../scripts/merge-node.js";
import { writeNodeFromJson } from "../scripts/write-node.js";
import { extractFrontmatter } from "../src/frontmatter.js";
import type { IntentionNode } from "../src/schema.js";

/** A tempdir holding one subdirectory per merge side, so all three sides can
 * carry the same node id (writeNodeFromJson names the file after the id). */
function fixtureDirs(): { base: string; ours: string; theirs: string; outPath: string } {
  const root = mkdtempSync(join(tmpdir(), "merge-node-cli-"));
  const dirs = { base: join(root, "base"), ours: join(root, "ours"), theirs: join(root, "theirs") };
  for (const dir of Object.values(dirs)) mkdirSync(dir, { recursive: true });
  return { ...dirs, outPath: join(root, "merged.md") };
}

const NODE_ID = "tactic-merge-round-trip";

/** Write one side's fixture file and return its path. */
function seed(dir: string, overrides: Partial<IntentionNode>): string {
  writeNodeFromJson(
    dir,
    JSON.stringify({
      id: NODE_ID,
      kind: "tactic",
      statement: "A tactic used to exercise the merge round-trip.",
      owner: "ai",
      status: "codified",
      parent: null,
      ...overrides,
    }),
  );
  return join(dir, `${NODE_ID}.md`);
}

/** Parse the frontmatter of a written node file. */
function readOut(path: string): Record<string, unknown> {
  return parse(extractFrontmatter(readFileSync(path, "utf8"), NODE_ID));
}

describe("mergeNodeFiles", () => {
  it("a removed blocked_by entry survives validateNode + stringify to --out", () => {
    // The 2026-07-25 production incident, driven through the real fs path.
    const { base, ours, theirs, outPath } = fixtureDirs();
    const basePath = seed(base, { blocked_by: ["tactic-x", "tactic-y"] });
    const oursPath = seed(ours, { blocked_by: ["tactic-y"] });
    const theirsPath = seed(theirs, { blocked_by: ["tactic-x", "tactic-y"] });

    const result = mergeNodeFiles(basePath, oursPath, theirsPath, outPath);

    expect(result.resolved).toBe(true);
    expect(result.conflicts).toEqual([]);
    expect(readOut(outPath).blocked_by).toEqual(["tactic-y"]);
  });

  it("an emptied list survives the round-trip as an empty list, not the base value", () => {
    const { base, ours, theirs, outPath } = fixtureDirs();
    const basePath = seed(base, { blocked_by: ["tactic-x"], rationale: null });
    const oursPath = seed(ours, { blocked_by: [], rationale: "ours set this" });
    const theirsPath = seed(theirs, { blocked_by: ["tactic-x"], rationale: null });

    const result = mergeNodeFiles(basePath, oursPath, theirsPath, outPath);

    expect(result.resolved).toBe(true);
    const written = readOut(outPath);
    expect(written.blocked_by).toEqual([]);
    expect(written.rationale).toBe("ours set this");
  });

  it("a deleted attributes key is absent from the written --out file", () => {
    const { base, ours, theirs, outPath } = fixtureDirs();
    const basePath = seed(base, { attributes: { doomed: "value", kept: "value" } });
    const oursPath = seed(ours, { attributes: { kept: "value" } });
    const theirsPath = seed(theirs, { attributes: { doomed: "value", kept: "value" } });

    const result = mergeNodeFiles(basePath, oursPath, theirsPath, outPath);

    expect(result.resolved).toBe(true);
    const attributes = readOut(outPath).attributes;
    expect(attributes).toEqual({ kept: "value" });
    // Belt and braces: the raw text must not carry the deleted key at all.
    expect(readFileSync(outPath, "utf8")).not.toContain("doomed");
  });

  it("an unresolved merge does NOT write --out", () => {
    const { base, ours, theirs, outPath } = fixtureDirs();
    // Diverge on `rationale`, not `statement`: writeNodeFromJson derives the
    // markdown body from the statement, so diverging statements would also
    // raise a second, incidental `body` conflict.
    const basePath = seed(base, { rationale: null });
    const oursPath = seed(ours, { rationale: "Our divergent rationale." });
    const theirsPath = seed(theirs, { rationale: "Their divergent rationale." });

    const result = mergeNodeFiles(basePath, oursPath, theirsPath, outPath);

    expect(result.resolved).toBe(false);
    expect(result.conflicts.map((c) => c.field)).toEqual(["rationale"]);
    expect(existsSync(outPath)).toBe(false);
  });

  it("an attributes delete-vs-modify is unresolved and writes nothing", () => {
    const { base, ours, theirs, outPath } = fixtureDirs();
    const basePath = seed(base, { attributes: { k: 1 } });
    const oursPath = seed(ours, { attributes: {} });
    const theirsPath = seed(theirs, { attributes: { k: 2 } });

    const result = mergeNodeFiles(basePath, oursPath, theirsPath, outPath);

    expect(result.resolved).toBe(false);
    expect(result.conflicts.map((c) => c.field)).toEqual(["attributes.k"]);
    expect(existsSync(outPath)).toBe(false);
  });

  it("an empty --theirs with a non-empty --base is an unresolved delete/modify", () => {
    // The node-level delete-vs-edit guard, now an early return in the helper.
    const { base, ours, outPath } = fixtureDirs();
    const basePath = seed(base, { rationale: null });
    const oursPath = seed(ours, { rationale: "we edited it" });

    const result = mergeNodeFiles(basePath, oursPath, "", outPath);

    expect(result.resolved).toBe(false);
    expect(result.conflicts).toEqual([{ field: "<node>", ours: NODE_ID, theirs: null }]);
    expect(existsSync(outPath)).toBe(false);
  });
});

// --- the CLI's stdout contract, which only a SPAWNED run can observe --------
// Every test above imports mergeNodeFiles directly. That cannot see the defect
// this block pins: it lives in the CLI's exit path and only appears when
// stdout is a pipe.

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts");

/** Run the merge-node CLI through tsx with stdout as a PIPE (spawnSync's
 * default once `encoding` is set) — the shape graph-commit invokes it in. */
function runCli(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx/esm", join(scriptsDir, "merge-node.ts"), ...args],
    // maxBuffer well above the payload: spawnSync's 1 MB default KILLS the
    // child (status null), which would mask the truncation this pins.
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** A body large enough that the emitted JSON cannot fit the pipe buffer. A body
 * conflict carries BOTH sides verbatim — node-merge.ts reports
 * `{ field: "body", ours, theirs }` — so ~1.1 MB per side clears the 65536-byte
 * F_GETPIPE_SZ comfortably. */
function bigBody(marker: string): string {
  return "# " + marker + "\n\n" + (marker + " line of prose that exists only to add bytes.\n").repeat(20000);
}

describe("merge-node CLI stdout contract", () => {
  it("emits COMPLETE JSON when the result exceeds the pipe buffer", { timeout: 60_000 }, () => {
    const { base, ours, theirs, outPath } = fixtureDirs();
    const basePath = seed(base, {});
    const oursPath = seed(ours, {});
    const theirsPath = seed(theirs, {});
    // Diverge the bodies so the merge reports a genuine `body` conflict and
    // carries both sides into the result.
    appendFileSync(basePath, bigBody("BASE"));
    appendFileSync(oursPath, bigBody("OURS"));
    appendFileSync(theirsPath, bigBody("THEIRS"));

    const run = runCli(["--base", basePath, "--ours", oursPath, "--theirs", theirsPath, "--out", outPath]);

    expect(run.status).toBe(0);
    // The real assertion FIRST: the JSON is not truncated. `process.exit(0)`
    // discards whatever is still queued on the pipe, so this throws against the
    // old form ("Unexpected end of JSON input"). Ordering matters — the size
    // guard below ALSO fails under truncation (the discarded tail shrinks
    // stdout to whatever fit the pipe buffer), and if it ran first a returning
    // regression would be misreported as "the test went vacuous".
    const parsed = JSON.parse(run.stdout) as { resolved: boolean; conflicts: { field: string }[] };
    expect(parsed.conflicts.some((c) => c.field === "body")).toBe(true);
    // The payload must actually be large enough to exercise the defect. If this
    // stops holding — with the JSON above still parsing cleanly — the fixture
    // has shrunk and the test has gone vacuous, so it must fail loudly rather
    // than pass for the wrong reason.
    expect(run.stdout.length).toBeGreaterThan(1_000_000);
  });
});
