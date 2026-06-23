import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { IntentionNode } from "../src/schema.js";
import { listNodes, readNode, writeNode } from "../src/store.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-"));
}

describe("store round-trip", () => {
  it("is lossless for a fully-populated node", () => {
    const dir = tempDir();
    const node: IntentionNode = {
      id: "root-1",
      statement: "Keep the commons aligned with its charter.",
      owner: "human",
      status: "codified",
      parent: "charter",
      rationale: "Alignment is the project's reason for being.",
      reading: "See the alignment principles.",
      gap: "No automated alignment check exists yet.",
      clarifications: [
        { question: "Who arbitrates conflicts?", answer: "The charter owner." },
        { question: "How often is it reviewed?", answer: "Each digest cycle." },
      ],
      tooling_goals: ["align-cli", "intention-tree"],
      success_signal: {
        observable: "intention-tree builds without orphans",
        sensor: "align --check",
        threshold: "0 orphans",
        is_proxy: false,
      },
    };

    writeNode(dir, node);
    const read = readNode(dir, node.id);
    expect(read).toEqual(node);
  });

  it("is lossless for a node with multi-line string fields", () => {
    const dir = tempDir();
    const node: IntentionNode = {
      id: "multi-1",
      statement: "Preserve multi-line content through the store round-trip.",
      owner: "human",
      status: "codified",
      parent: "root-1",
      // rationale ends with \n (trailing newline); reading does not — exercises both chomping cases
      rationale:
        "Block scalars in YAML can silently strip trailing newlines\nor fold long lines.\n\nThis test pins the guarantee that neither transformation occurs.\n",
      reading:
        "See yaml.org/spec/1.2/spec.html section 8.1.1.2 on block scalar chomping.\n\nAlso review the 'clip', 'strip', and 'keep' indicators.",
      gap: "No automated check for block-scalar fidelity existed before this test.",
      clarifications: [
        {
          question: "Does the yaml library clip trailing newlines?",
          answer: "Not when fields are read back via parse — this test confirms it.",
        },
        {
          question: "Are internal blank lines preserved?",
          answer: "Yes — the rationale field above contains one.",
        },
      ],
      tooling_goals: ["yaml-round-trip", "intention-store"],
      success_signal: {
        observable: "readNode returns the exact node written, including trailing newlines",
        sensor: "vitest store.test.ts",
        threshold: "0 diff",
        is_proxy: false,
      },
    };

    writeNode(dir, node);
    const read = readNode(dir, node.id);
    expect(read).toEqual(node);
  });

  it("applies defaults for a minimal node", () => {
    const dir = tempDir();
    // Only the required core; optional fields omitted entirely.
    writeNode(dir, {
      id: "leaf-1",
      statement: "Do the small thing.",
      owner: "ai",
      status: "raw",
    });
    const read = readNode(dir, "leaf-1");

    expect(read).toEqual({
      id: "leaf-1",
      statement: "Do the small thing.",
      owner: "ai",
      status: "raw",
      parent: null,
      rationale: null,
      reading: null,
      gap: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
    });
  });
});

describe("listNodes", () => {
  it("returns every node sorted by id", () => {
    const dir = tempDir();
    const ids = ["c-node", "a-node", "b-node"];
    for (const id of ids) {
      writeNode(dir, {
        id,
        statement: `Statement for ${id}`,
        owner: "procedure",
        status: "delegated",
      });
    }

    const nodes = listNodes(dir);
    expect(nodes).toHaveLength(3);
    expect(nodes.map((n) => n.id)).toEqual(["a-node", "b-node", "c-node"]);
  });

  it("skips the non-node README.md companion doc", () => {
    const dir = tempDir();
    writeNode(dir, {
      id: "leaf-1",
      statement: "Do the small thing.",
      owner: "ai",
      status: "raw",
    });
    // The backfill writes a frontmatter-less README.md alongside the node
    // files; listNodes must skip it rather than throw on its missing fence.
    writeFileSync(join(dir, "README.md"), "# Intentions store\n\nNot a node.\n");

    const nodes = listNodes(dir);
    expect(nodes.map((n) => n.id)).toEqual(["leaf-1"]);
  });
});
