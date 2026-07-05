import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { IntentionNode, IntentionNodeInput } from "../src/schema.js";
import { listNodes, readNode, writeNode } from "../src/store.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-"));
}

describe("store round-trip", () => {
  it("is lossless for a fully-populated node", () => {
    const dir = tempDir();
    const node: IntentionNode = {
      id: "root-1",
      kind: "virtue",
      statement: "Keep the commons aligned with its charter.",
      owner: "human",
      status: "codified",
      parent: "charter",
      serves: ["charter"],
      recovers: ["delegation-1"],
      rationale: "Alignment is the project's reason for being.",
      reading: "See the alignment principles.",
      gap: "No automated alignment check exists yet.",
      clarifications: [
        { question: "Who arbitrates conflicts?", answer: "The charter owner." },
        { question: "How often is it reviewed?", answer: "Each digest cycle." },
      ],
      tooling_goals: [{ kind: "actuator", statement: "align-cli" }, { kind: "sensor", statement: "intention-tree" }],
      success_signal: {
        observable: "intention-tree builds without orphans",
        sensor: "align --check",
        threshold: "0 orphans",
        is_proxy: false,
      },
      attention: {
        boost: 4,
        override: null,
        rationale: "This root draws attention this cycle.",
      },
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: { source: "github:natb1/commons.systems#1", weight: 3 },
    };

    writeNode(dir, node);
    const read = readNode(dir, node.id);
    expect(read).toEqual(node);
  });

  it("round-trips a node carrying an override injection", () => {
    const dir = tempDir();
    const node: IntentionNode = {
      id: "capped-1",
      kind: "strategy",
      statement: "A branch capped by an override.",
      owner: "human",
      status: "refining",
      parent: "root-1",
      serves: [],
      recovers: [],
      rationale: null,
      reading: null,
      gap: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
      attention: {
        boost: null,
        override: 0,
        rationale: "Parked this branch until the blocker clears.",
      },
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
    };

    writeNode(dir, node);
    const read = readNode(dir, node.id);
    expect(read).toEqual(node);
  });

  it("is lossless for a node with multi-line string fields", () => {
    const dir = tempDir();
    const node: IntentionNode = {
      id: "multi-1",
      kind: "strategy",
      statement: "Preserve multi-line content through the store round-trip.",
      owner: "human",
      status: "codified",
      parent: "root-1",
      serves: [],
      recovers: [],
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
      tooling_goals: [{ kind: "actuator", statement: "yaml-round-trip" }, { kind: "sensor", statement: "intention-store" }],
      success_signal: {
        observable: "readNode returns the exact node written, including trailing newlines",
        sensor: "vitest store.test.ts",
        threshold: "0 diff",
        is_proxy: false,
      },
      attention: null,
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
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
      kind: "tactic",
      statement: "Do the small thing.",
      owner: "ai",
      status: "raw",
    });
    const read = readNode(dir, "leaf-1");

    expect(read).toEqual({
      id: "leaf-1",
      kind: "tactic",
      statement: "Do the small thing.",
      owner: "ai",
      status: "raw",
      parent: null,
      serves: [],
      recovers: [],
      rationale: null,
      reading: null,
      gap: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
      attention: null,
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
    });
  });
});

describe("writeNode tactic body preservation", () => {
  it("preserves an existing tactic file's exact prior body content on rewrite", () => {
    const dir = tempDir();
    const original: IntentionNode = {
      id: "tactic-1",
      kind: "tactic",
      statement: "Original statement.",
      owner: "ai",
      status: "codified",
      parent: null,
      serves: [],
      recovers: [],
      rationale: null,
      reading: null,
      gap: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
      attention: null,
      phase: "implement",
      execution: null,
      validates: [],
      blocked_by: [],
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
    };
    writeNode(dir, original);

    // Hand-author a real plan body onto the file writeNode just produced,
    // simulating the authoritative, hand-maintained content a tactic body
    // carries in the live store.
    const filePath = join(dir, "tactic-1.md");
    const raw = readFileSync(filePath, "utf8");
    const closeIndex = raw.indexOf("\n---\n");
    const frontmatterAndFence = raw.slice(0, closeIndex + "\n---\n".length);
    const handAuthoredBody =
      "# A real plan\n\n## Context\n\nSome hand-written plan content.\n\n## Unit 1\n\nDo the thing.\n";
    writeFileSync(filePath, frontmatterAndFence + handAuthoredBody);

    // Rewrite with a changed statement/phase — the body must survive untouched.
    const updated: IntentionNode = { ...original, statement: "Updated statement.", phase: "qa" };
    writeNode(dir, updated);

    const rewritten = readFileSync(filePath, "utf8");
    const rewrittenCloseIndex = rewritten.indexOf("\n---\n");
    const rewrittenBody = rewritten.slice(rewrittenCloseIndex + "\n---\n".length);
    expect(rewrittenBody).toBe(handAuthoredBody);

    // Frontmatter itself did update.
    const read = readNode(dir, "tactic-1");
    expect(read.statement).toBe("Updated statement.");
    expect(read.phase).toBe("qa");
  });

  it("still regenerates the cosmetic body for a non-tactic kind (e.g. strategy)", () => {
    const dir = tempDir();
    const strategy: IntentionNodeInput = {
      id: "strategy-1",
      kind: "strategy",
      statement: "First statement.",
      owner: "human",
      status: "refining",
    };
    writeNode(dir, strategy);

    // Hand-author a body, then rewrite — for a non-tactic, this must be
    // clobbered by the regenerated `# ${statement}` heading.
    const filePath = join(dir, "strategy-1.md");
    const raw = readFileSync(filePath, "utf8");
    const closeIndex = raw.indexOf("\n---\n");
    const frontmatterAndFence = raw.slice(0, closeIndex + "\n---\n".length);
    writeFileSync(filePath, frontmatterAndFence + "# Hand-authored body that should be replaced\n");

    writeNode(dir, { ...strategy, statement: "Second statement." });

    const rewritten = readFileSync(filePath, "utf8");
    expect(rewritten.endsWith("# Second statement.\n")).toBe(true);
    expect(rewritten).not.toContain("Hand-authored body that should be replaced");
  });

  it("throws on a kind change that would discard an existing hand-authored tactic body", () => {
    const dir = tempDir();
    const tactic: IntentionNodeInput = {
      id: "tactic-reclass",
      kind: "tactic",
      statement: "A tactic with a real plan.",
      owner: "ai",
      status: "codified",
    };
    writeNode(dir, tactic);

    // Hand-author a plan body, as the live store does for tactics.
    const filePath = join(dir, "tactic-reclass.md");
    const raw = readFileSync(filePath, "utf8");
    const closeIndex = raw.indexOf("\n---\n");
    const frontmatterAndFence = raw.slice(0, closeIndex + "\n---\n".length);
    const handAuthoredBody = "# A real plan\n\n## Unit 1\n\nDo the thing.\n";
    writeFileSync(filePath, frontmatterAndFence + handAuthoredBody);

    // Rewriting with kind changed away from tactic would regenerate the
    // placeholder body and silently drop the plan — it must throw instead.
    expect(() => writeNode(dir, { ...tactic, kind: "strategy" })).toThrow(
      /Refusing to change kind of "tactic-reclass" from "tactic" to "strategy"/,
    );

    // The file is untouched: still a tactic, plan body intact.
    expect(readFileSync(filePath, "utf8")).toBe(frontmatterAndFence + handAuthoredBody);
  });

  it("allows a kind change when the existing tactic body is still the generated placeholder", () => {
    const dir = tempDir();
    const tactic: IntentionNodeInput = {
      id: "tactic-placeholder",
      kind: "tactic",
      statement: "A tactic never given a plan.",
      owner: "ai",
      status: "raw",
    };
    writeNode(dir, tactic);

    // The body is still the generated `# ${statement}` placeholder — no plan
    // content exists to lose, so reclassification proceeds.
    writeNode(dir, { ...tactic, kind: "strategy" });

    const read = readNode(dir, "tactic-placeholder");
    expect(read.kind).toBe("strategy");
    const raw = readFileSync(join(dir, "tactic-placeholder.md"), "utf8");
    expect(raw.endsWith("# A tactic never given a plan.\n")).toBe(true);
  });

  it("generates a placeholder body for a brand-new tactic with no prior file", () => {
    const dir = tempDir();
    writeNode(dir, {
      id: "tactic-new",
      kind: "tactic",
      statement: "A fresh tactic.",
      owner: "ai",
      status: "raw",
    });

    const raw = readFileSync(join(dir, "tactic-new.md"), "utf8");
    expect(raw.endsWith("# A fresh tactic.\n")).toBe(true);
  });
});

describe("listNodes", () => {
  it("returns every node sorted by id", () => {
    const dir = tempDir();
    const ids = ["c-node", "a-node", "b-node"];
    for (const id of ids) {
      writeNode(dir, {
        id,
        kind: "strategy",
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
      kind: "tactic",
      statement: "Do the small thing.",
      owner: "ai",
      status: "raw",
    });
    // A frontmatter-less README.md sits alongside the node files;
    // listNodes must skip it rather than throw on its missing fence.
    writeFileSync(join(dir, "README.md"), "# Intentions store\n\nNot a node.\n");

    const nodes = listNodes(dir);
    expect(nodes.map((n) => n.id)).toEqual(["leaf-1"]);
  });
});
