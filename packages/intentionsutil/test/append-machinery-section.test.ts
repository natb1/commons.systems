import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractFrontmatter } from "../src/frontmatter.js";
import { tacticScopeFingerprint } from "../src/router.js";
import { readNodeBody } from "../src/store.js";
import { writeNodeFromJson } from "../scripts/write-node.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-"));
}

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "../scripts/append-machinery-section.ts");

function runAppend(
  intentionsDir: string,
  id: string,
  section: string,
): string {
  return execFileSync("npx", ["tsx", scriptPath, id, "--dir", intentionsDir], {
    input: section,
    encoding: "utf8",
  });
}

describe("append-machinery-section CLI", () => {
  it("preserves frontmatter byte-for-byte, dedupes the sentinel, and keeps the scope fingerprint stable across two appends", () => {
    const intentionsDir = tempDir();
    const statement = "Append a machinery section without disturbing plan substance.";

    writeNodeFromJson(
      intentionsDir,
      JSON.stringify({
        id: "tactic-append-machinery-fixture",
        kind: "tactic",
        statement,
        owner: "human",
        status: "codified",
        parent: null,
      }),
    );
    const id = "tactic-append-machinery-fixture";
    const filePath = join(intentionsDir, `${id}.md`);

    const rawBefore = readFileSync(filePath, "utf8");
    const frontmatterBefore = extractFrontmatter(rawBefore, id);

    runAppend(intentionsDir, id, "## needs-main residue\n\nFirst residue note.\n");

    const rawAfterFirst = readFileSync(filePath, "utf8");
    const frontmatterAfterFirst = extractFrontmatter(rawAfterFirst, id);
    expect(frontmatterAfterFirst).toBe(frontmatterBefore);

    const bodyAfterFirst = readNodeBody(intentionsDir, id);
    const fingerprintAfterFirst = tacticScopeFingerprint(statement, bodyAfterFirst);

    runAppend(intentionsDir, id, "## needs-main residue\n\nSecond residue note.\n");

    const rawAfterSecond = readFileSync(filePath, "utf8");
    const frontmatterAfterSecond = extractFrontmatter(rawAfterSecond, id);
    expect(frontmatterAfterSecond).toBe(frontmatterBefore);

    const bodyAfterSecond = readNodeBody(intentionsDir, id);
    const fingerprintAfterSecond = tacticScopeFingerprint(statement, bodyAfterSecond);

    // The sentinel is inserted once and reused — never duplicated across
    // multiple appends.
    const sentinelMatches = bodyAfterSecond.match(/<!--\s*machinery\b/g) ?? [];
    expect(sentinelMatches).toHaveLength(1);

    // Both residue notes landed below the boundary.
    expect(bodyAfterSecond).toContain("First residue note.");
    expect(bodyAfterSecond).toContain("Second residue note.");

    // The scope fingerprint (which hashes only plan substance, above the
    // boundary) is unchanged by either machinery append.
    expect(fingerprintAfterSecond).toBe(fingerprintAfterFirst);
  });

  it("rejects a section not starting with '## ' and leaves the file untouched", () => {
    const intentionsDir = tempDir();
    const statement = "Reject a malformed machinery section.";

    writeNodeFromJson(
      intentionsDir,
      JSON.stringify({
        id: "tactic-append-machinery-reject-fixture",
        kind: "tactic",
        statement,
        owner: "human",
        status: "codified",
        parent: null,
      }),
    );
    const id = "tactic-append-machinery-reject-fixture";
    const filePath = join(intentionsDir, `${id}.md`);

    const rawBefore = readFileSync(filePath, "utf8");

    expect(() => runAppend(intentionsDir, id, "not a heading\n")).toThrow();

    const rawAfter = readFileSync(filePath, "utf8");
    expect(rawAfter).toBe(rawBefore);
  });
});
