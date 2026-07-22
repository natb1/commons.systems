import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import { lintTacticBodies, loadPlanBodyBaseline } from "../src/planlint.js";
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
    let caught: unknown;
    try {
      lintTacticBodies(dir, listNodes(dir));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    if (!(caught instanceof Error)) throw new Error("unreachable");
    expect(caught.message).toMatch(/tactic-a/);
    expect(caught.message).toMatch(/tactic-b/);
  });

  describe("grandfather baseline", () => {
    it("grandfathers a baselined {id, marker} violation", () => {
      const dir = tempDir();
      // Missing Context only; baselined for context → passes.
      const body = `# t\n\nRecommended model: sonnet\n\n## Verification\n\nv\n`;
      writeRawNode(dir, { id: "tactic-a", body });
      const baseline = new Set(["tactic-a|context"]);
      expect(() => lintTacticBodies(dir, listNodes(dir), baseline)).not.toThrow();
    });

    it("is scoped per-marker — baselining one marker does not excuse another", () => {
      const dir = tempDir();
      // Missing both Context and Verification; baseline covers only context.
      const body = `# t\n\nRecommended model: sonnet\n`;
      writeRawNode(dir, { id: "tactic-a", body });
      const baseline = new Set(["tactic-a|context"]);
      expect(() => lintTacticBodies(dir, listNodes(dir), baseline)).toThrow(
        /tactic-a.*Verification/,
      );
    });

    it("grandfathers all three markers of one node when each is baselined", () => {
      const dir = tempDir();
      writeRawNode(dir, { id: "tactic-a", body: "no markers here\n" });
      const baseline = new Set(["tactic-a|context", "tactic-a|model", "tactic-a|verification"]);
      expect(() => lintTacticBodies(dir, listNodes(dir), baseline)).not.toThrow();
    });

    it("baseline entry for one node does not grandfather a different node", () => {
      const dir = tempDir();
      writeRawNode(dir, { id: "tactic-a", body: "no markers\n" });
      writeRawNode(dir, { id: "tactic-b", body: "no markers\n" });
      const baseline = new Set(["tactic-a|context", "tactic-a|model", "tactic-a|verification"]);
      expect(() => lintTacticBodies(dir, listNodes(dir), baseline)).toThrow(/tactic-b/);
    });
  });

  describe("loadPlanBodyBaseline", () => {
    it("parses a valid baseline file into <id>|<marker> keys", () => {
      const dir = tempDir();
      const path = join(dir, "baseline.json");
      writeFileSync(
        path,
        JSON.stringify([
          { id: "tactic-a", marker: "context" },
          { id: "tactic-a", marker: "verification" },
        ]),
      );
      const set = loadPlanBodyBaseline(path);
      expect(set.has("tactic-a|context")).toBe(true);
      expect(set.has("tactic-a|verification")).toBe(true);
      expect(set.has("tactic-a|model")).toBe(false);
    });

    it("throws on a malformed entry (unknown marker)", () => {
      const dir = tempDir();
      const path = join(dir, "baseline.json");
      writeFileSync(path, JSON.stringify([{ id: "tactic-a", marker: "bogus" }]));
      expect(() => loadPlanBodyBaseline(path)).toThrow(/expected a JSON array/);
    });

    it("throws on a non-array top level", () => {
      const dir = tempDir();
      const path = join(dir, "baseline.json");
      writeFileSync(path, JSON.stringify({ id: "tactic-a", marker: "context" }));
      expect(() => loadPlanBodyBaseline(path)).toThrow(/expected a JSON array/);
    });

    it("loads the repo baseline and grandfathers exactly its listed violations", () => {
      // The committed baseline must parse and must NOT be empty (it exists to
      // grandfather the pre-existing violators found when this lint landed).
      const set = loadPlanBodyBaseline();
      expect(set.size).toBeGreaterThan(0);
      expect(set.has("tactic-flake-hook-tests-select-tick|context")).toBe(true);
    });
  });
});
