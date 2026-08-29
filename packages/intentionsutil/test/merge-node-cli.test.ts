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

import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
