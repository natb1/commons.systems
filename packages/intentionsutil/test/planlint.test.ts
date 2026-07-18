import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import { lintTacticBodies } from "../src/planlint.js";
import { listNodes } from "../src/store.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "planlint-"));
}

/**
 * Write a raw node file (frontmatter + verbatim body) to `dir/<id>.md`. Uses raw
 * text rather than `writeNode` because `writeNode` regenerates the body as a
 * `# ${statement}` placeholder for new files — this lint reads authored bodies,
 * so the test must control the body text directly.
 */
function writeRawNode(
  dir: string,
  opts: { id: string; kind?: string; phase?: string | null; body: string },
): void {
  const { id, kind = "tactic", phase = "implement", body } = opts;
  const phaseLine = phase === null ? "phase: null" : `phase: ${phase}`;
  const frontmatter = [
    `id: ${id}`,
    `kind: ${kind}`,
    `statement: "${id} statement"`,
    "owner: ai",
    "status: raw",
    phaseLine,
  ].join("\n");
  writeFileSync(join(dir, `${id}.md`), `---\n${frontmatter}\n---\n\n${body}`);
}

const COMPLIANT_BODY = `# t

## Context

Why this change.

**Recommended model:** sonnet

## Verification

Run the tests.
`;

describe("lintTacticBodies", () => {
  it("accepts a compliant body (bold-colon recommended-model format)", () => {
    const dir = tempDir();
    writeRawNode(dir, { id: "tactic-a", body: COMPLIANT_BODY });
    expect(() => lintTacticBodies(dir, listNodes(dir))).not.toThrow();
  });

  it("accepts the bold-then-colon recommended-model format", () => {
    const dir = tempDir();
    const body = `## Context\n\nc\n\n- **Recommended model**: opus\n\n## Verification\n\nv\n`;
    writeRawNode(dir, { id: "tactic-a", body });
    expect(() => lintTacticBodies(dir, listNodes(dir))).not.toThrow();
  });

  it("accepts the unbold recommended-model format", () => {
    const dir = tempDir();
    const body = `## Context\n\nc\n\nRecommended model: sonnet\n\n## Verification\n\nv\n`;
    writeRawNode(dir, { id: "tactic-a", body });
    expect(() => lintTacticBodies(dir, listNodes(dir))).not.toThrow();
  });

  it("accepts a '## Verification checklist' heading (heading-prefix match)", () => {
    const dir = tempDir();
    const body = `## Context\n\nc\n\nRecommended model: sonnet\n\n## Verification checklist\n\n- [ ] v\n`;
    writeRawNode(dir, { id: "tactic-a", body });
    expect(() => lintTacticBodies(dir, listNodes(dir))).not.toThrow();
  });

  it("rejects a body missing ## Context (error names node and marker)", () => {
    const dir = tempDir();
    const body = `# t\n\nRecommended model: sonnet\n\n## Verification\n\nv\n`;
    writeRawNode(dir, { id: "tactic-a", body });
    expect(() => lintTacticBodies(dir, listNodes(dir))).toThrow(IntentionSchemaError);
    expect(() => lintTacticBodies(dir, listNodes(dir))).toThrow(/tactic-a.*Context/);
  });

  it("rejects a body missing the recommended-model line", () => {
    const dir = tempDir();
    const body = `## Context\n\nc\n\n## Verification\n\nv\n`;
    writeRawNode(dir, { id: "tactic-a", body });
    expect(() => lintTacticBodies(dir, listNodes(dir))).toThrow(/tactic-a.*Recommended model/);
  });

  it("rejects a body missing ## Verification", () => {
    const dir = tempDir();
    const body = `## Context\n\nc\n\nRecommended model: sonnet\n`;
    writeRawNode(dir, { id: "tactic-a", body });
    expect(() => lintTacticBodies(dir, listNodes(dir))).toThrow(/tactic-a.*Verification/);
  });

  it("exempts phase null / draft / align-tactics / done from the lint", () => {
    for (const phase of [null, "draft", "align-tactics", "done"]) {
      const dir = tempDir();
      // A body missing every marker must still pass for exempt phases.
      writeRawNode(dir, { id: "tactic-a", phase, body: "no markers here\n" });
      expect(() => lintTacticBodies(dir, listNodes(dir))).not.toThrow();
    }
  });

  it("does not lint non-tactic kinds", () => {
    const dir = tempDir();
    writeRawNode(dir, { id: "strategy-a", kind: "strategy", phase: null, body: "no markers\n" });
    expect(() => lintTacticBodies(dir, listNodes(dir))).not.toThrow();
  });

  it("exempts tactic-mainqa-* from the recommended-model check only", () => {
    const dir = tempDir();
    // Has Context + Verification but no recommended-model line: passes because
    // the id is tactic-mainqa-*.
    const body = `## Context\n\nc\n\n## Verification\n\nv\n`;
    writeRawNode(dir, { id: "tactic-mainqa-foo", phase: "qa", body });
    expect(() => lintTacticBodies(dir, listNodes(dir))).not.toThrow();
  });

  it("still requires Context/Verification on a tactic-mainqa-* node", () => {
    const dir = tempDir();
    // Missing Context: the mainqa exemption covers recommended-model only.
    const body = `Recommended model: sonnet\n\n## Verification\n\nv\n`;
    writeRawNode(dir, { id: "tactic-mainqa-foo", phase: "qa", body });
    expect(() => lintTacticBodies(dir, listNodes(dir))).toThrow(/tactic-mainqa-foo.*Context/);
  });

  it("reports all violations across nodes in one throw", () => {
    const dir = tempDir();
    writeRawNode(dir, { id: "tactic-a", body: "no markers\n" });
    writeRawNode(dir, { id: "tactic-b", body: "no markers\n" });
    let message = "";
    try {
      lintTacticBodies(dir, listNodes(dir));
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/tactic-a/);
    expect(message).toMatch(/tactic-b/);
  });
});
