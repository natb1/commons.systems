import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CITATION_HEADING,
  planRestatement,
  writeRestatedNode,
  type RestatementInput,
} from "../src/restate.js";
import * as barrel from "../src/index.js";
import { readNode, readNodeBody, writeNode } from "../src/store.js";
import { validateNode, type IntentionNode, type IntentionNodeInput } from "../src/schema.js";
import { IntentionSchemaError } from "../src/errors.js";
import type { DispositionRecord, DispositionState } from "../src/consolidation.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-restate-"));
}

const NODE_ID = "tactic-restate-fixture";

const NODE_INPUT: IntentionNodeInput = {
  id: NODE_ID,
  kind: "tactic",
  statement: "Fixture node for the restatement writer's tests.",
  owner: "ai",
  status: "codified",
  parent: null,
  clarifications: [
    { question: "Q1?", answer: "A1 (decision: deferred, delegation-x, 2026-08-30)" },
    { question: "Q2?", answer: "A2 (decision: delegated, delegation-x, 2026-08-31)" },
    { question: "Q3?", answer: "A3, untouched by this fold" },
  ],
};

const NODE: IntentionNode = validateNode(NODE_INPUT);

/** A prior body long enough that a restatement of it is genuinely smaller. */
const PRIOR_BODY = `# ${NODE.statement}\n\n${"Accreted paragraph that the fold replaces.\n".repeat(40)}`;

function record(
  state: DispositionState,
  ordinal: number,
  date: string,
  delegatee: string | null = "delegation-x",
): DispositionRecord {
  return {
    nodeId: NODE_ID,
    state,
    delegatee: state === "ratified" ? null : delegatee,
    date,
    key: `${NODE_ID}#${ordinal}`,
    excerpt: `... (decision: ${state}, ${date}) ...`,
  };
}

function input(overrides: Partial<RestatementInput> = {}): RestatementInput {
  return {
    node: NODE,
    body: PRIOR_BODY,
    dispositions: [record("deferred", 1, "2026-08-30")],
    restatedBody: `# ${NODE.statement}\n\nThe restated statement of current state.\n`,
    restatedClarifications: [{ question: "Q3?", answer: "A3, untouched by this fold" }],
    foldedClarifications: [1, 2],
    foldDate: "2026-09-02",
    foldDelegatee: "delegation-x",
    ...overrides,
  };
}

/**
 * One `it` per verdict row, deliberately not table-driven — the same reason
 * `consolidation.test.ts` states for the gate itself: the permitted rows are the
 * sanction, and a regression on one must not hide behind a passing neighbour.
 * These assert the PLANNER's translation of each row (refusal as data, no
 * restated content leaking out on a refusal), not the gate's algebra, which is
 * `consolidation.test.ts`'s.
 */
describe("planRestatement — one row per authority verdict", () => {
  it("refuses ratified-only content and emits no restated content at all", () => {
    const plan = planRestatement(input({ dispositions: [record("ratified", 1, "2026-08-31")] }));
    expect(plan.permitted).toBe(false);
    expect(plan.resultState).toBeNull();
    expect(plan.restatedBody).toBeNull();
    expect(plan.restatedClarifications).toBeNull();
    expect(plan.citation).toBeNull();
    expect(plan.refusal).toContain("rule (1)");
  });

  it("refuses ratified + deferred — one ratified stamp is enough", () => {
    const plan = planRestatement(
      input({ dispositions: [record("deferred", 1, "2026-08-30"), record("ratified", 2, "2026-08-31")] }),
    );
    expect(plan.permitted).toBe(false);
    expect(plan.restatedBody).toBeNull();
    expect(plan.refusal).toContain("rule (1)");
  });

  it("refuses ratified + delegated", () => {
    const plan = planRestatement(
      input({ dispositions: [record("delegated", 1, "2026-08-30"), record("ratified", 2, "2026-08-31")] }),
    );
    expect(plan.permitted).toBe(false);
    expect(plan.restatedBody).toBeNull();
    expect(plan.refusal).toContain("rule (1)");
  });

  it("refuses when no stamp covers the content — unknown authority is binding", () => {
    const plan = planRestatement(input({ dispositions: [] }));
    expect(plan.permitted).toBe(false);
    expect(plan.restatedBody).toBeNull();
    expect(plan.refusal).toContain("no disposition stamps found");
  });

  it("permits deferred-only content, inheriting the deferred stamp", () => {
    const plan = planRestatement(
      input({ dispositions: [record("deferred", 1, "2026-08-30"), record("deferred", 2, "2026-08-31")] }),
    );
    expect(plan.permitted).toBe(true);
    expect(plan.resultState).toBe("deferred");
    expect(plan.refusal).toBeNull();
    expect(plan.citation).toContain("(decision: deferred, delegation-x, 2026-09-02)");
  });

  it("permits delegated-only content, with the fold BECOMING deferred", () => {
    const plan = planRestatement(input({ dispositions: [record("delegated", 1, "2026-08-31")] }));
    expect(plan.permitted).toBe(true);
    // Rule (4): the fold enters the author review queue rather than staying
    // delegated. A `delegated` stamp here would be the one failure this
    // operation must not have.
    expect(plan.resultState).toBe("deferred");
    expect(plan.citation).toContain("(decision: deferred, delegation-x, 2026-09-02)");
  });

  it("permits deferred + delegated together", () => {
    const plan = planRestatement(
      input({ dispositions: [record("deferred", 1, "2026-08-30"), record("delegated", 2, "2026-08-31")] }),
    );
    expect(plan.permitted).toBe(true);
    expect(plan.resultState).toBe("deferred");
  });
});

describe("planRestatement — the citation block", () => {
  it("appends exactly one citation block under the fixed heading", () => {
    const plan = planRestatement(input());
    const body = plan.restatedBody ?? "";
    expect(body.match(/^## Consolidation record$/gm)).toHaveLength(1);
    expect(body.startsWith("# ")).toBe(true);
    expect(body.endsWith("\n")).toBe(true);
    expect(CITATION_HEADING).toBe("## Consolidation record");
  });

  it("names the folded stamps, the folded clarification indices and both byte counts", () => {
    const plan = planRestatement(
      input({ dispositions: [record("deferred", 1, "2026-08-30"), record("delegated", 2, "2026-08-31")] }),
    );
    const citation = plan.citation ?? "";
    expect(citation).toContain("- dispositions folded: 2");
    expect(citation).toContain(`  - ${NODE_ID}#1 deferred 2026-08-30`);
    expect(citation).toContain(`  - ${NODE_ID}#2 delegated 2026-08-31`);
    expect(citation).toContain("- clarifications: folded 2 of 3 (indices 1, 2); 3 → 1");
    expect(citation).toContain(
      `- body bytes (prose, excluding this record): ${Buffer.byteLength(PRIOR_BODY, "utf8")} → `,
    );
    expect(citation).not.toContain("growth allowed");
  });

  it("records an allowGrowth reason verbatim, so the writer's guard can find it", () => {
    const plan = planRestatement(input({ allowGrowth: "resequenced for the reader" }));
    expect(plan.citation).toContain("- growth allowed: resequenced for the reader");
  });

  it("is byte-identical across two runs over identical input", () => {
    const first = planRestatement(input());
    const second = planRestatement(input());
    expect(second.citation).toBe(first.citation);
    expect(second.restatedBody).toBe(first.restatedBody);
  });

  it("is byte-identical regardless of the order the caller collected the stamps in", () => {
    const forward = [record("deferred", 1, "2026-08-30"), record("delegated", 2, "2026-08-31")];
    const reversed = [...forward].reverse();
    expect(planRestatement(input({ dispositions: reversed })).citation).toBe(
      planRestatement(input({ dispositions: forward })).citation,
    );
  });

  it("orders stamp ordinals numerically, so #10 follows #2", () => {
    const citation =
      planRestatement(
        input({
          dispositions: [record("deferred", 10, "2026-08-30"), record("deferred", 2, "2026-08-29")],
        }),
      ).citation ?? "";
    expect(citation.indexOf(`${NODE_ID}#2 `)).toBeLessThan(citation.indexOf(`${NODE_ID}#10 `));
  });

  it("carries no clock or environment data — only what the caller supplied", () => {
    const citation = planRestatement(input()).citation ?? "";
    // The only date in the block is the caller-supplied fold date and the dates
    // of the stamps it cites. A wall-clock read would break byte-identity.
    const dates = citation.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    expect(new Set(dates)).toEqual(new Set(["2026-09-02", "2026-08-30"]));
  });
});

describe("planRestatement — caller errors throw rather than refuse", () => {
  it("throws on a folded clarification index outside the source list", () => {
    expect(() => planRestatement(input({ foldedClarifications: [4] }))).toThrow(IntentionSchemaError);
    expect(() => planRestatement(input({ foldedClarifications: [0] }))).toThrow(/outside 1\.\.3/);
  });

  it("throws on an empty restated body", () => {
    expect(() => planRestatement(input({ restatedBody: "  \n" }))).toThrow(/does not delete one/);
  });

  it("throws when the caller hand-authored its own citation heading", () => {
    expect(() =>
      planRestatement(input({ restatedBody: `# x\n\n${CITATION_HEADING}\n\n- forged\n` })),
    ).toThrow(/never hand-authored/);
  });

  it("throws when a permitted fold names no delegatee for its own stamp", () => {
    expect(() => planRestatement(input({ foldDelegatee: null }))).toThrow(IntentionSchemaError);
  });
});

/** Seed `<dir>/<id>.md` the way the store does, then hand back the directory. */
function seedNode(body: string): string {
  const dir = tempDir();
  writeNode(dir, NODE_INPUT);
  const filePath = join(dir, `${NODE_ID}.md`);
  const raw = readFileSync(filePath, "utf8");
  const fenceEnd = raw.indexOf("\n---\n", 3) + "\n---\n".length;
  writeFileSync(filePath, raw.slice(0, fenceEnd) + body);
  return dir;
}

describe("writeRestatedNode — serialization mirrors writeNode's", () => {
  it("writes frontmatter byte-identical to writeNode's and the body verbatim", () => {
    const plan = planRestatement(input());
    const restated = plan.restatedBody ?? "";

    // The reference: what writeNode itself produces for this node.
    const referenceDir = tempDir();
    writeNode(referenceDir, NODE_INPUT);
    const referenceRaw = readFileSync(join(referenceDir, `${NODE_ID}.md`), "utf8");
    const referenceFrontmatter = referenceRaw.slice(0, referenceRaw.indexOf("\n---\n", 3) + "\n---\n".length);

    const dir = seedNode(PRIOR_BODY);
    writeRestatedNode(dir, NODE_INPUT, restated);
    const raw = readFileSync(join(dir, `${NODE_ID}.md`), "utf8");

    expect(raw.slice(0, referenceFrontmatter.length)).toBe(referenceFrontmatter);
    expect(raw).toBe(referenceFrontmatter + restated);
    rmSync(dir, { recursive: true, force: true });
    rmSync(referenceDir, { recursive: true, force: true });
  });

  it("round-trips through readNode / readNodeBody", () => {
    const plan = planRestatement(input());
    const restated = plan.restatedBody ?? "";
    const dir = seedNode(PRIOR_BODY);

    writeRestatedNode(dir, NODE_INPUT, restated);

    expect(readNode(dir, NODE_ID)).toEqual(NODE);
    expect(readNodeBody(dir, NODE_ID)).toBe(restated);
    rmSync(dir, { recursive: true, force: true });
  });

  it("is byte-stable when the same body is rewritten with an allowGrowth reason", () => {
    const reason = "resequenced for the reader";
    const plan = planRestatement(input({ allowGrowth: reason }));
    const restated = plan.restatedBody ?? "";
    const dir = seedNode(PRIOR_BODY);

    writeRestatedNode(dir, NODE_INPUT, restated);
    const first = readFileSync(join(dir, `${NODE_ID}.md`), "utf8");
    // The second write replaces an identical body, so it is not strictly
    // smaller and needs the reason the citation already carries.
    writeRestatedNode(dir, NODE_INPUT, restated, { allowGrowth: reason });
    expect(readFileSync(join(dir, `${NODE_ID}.md`), "utf8")).toBe(first);
    rmSync(dir, { recursive: true, force: true });
  });

  it("does not create a node that is not already on disk", () => {
    const dir = tempDir();
    const plan = planRestatement(input());
    expect(() => writeRestatedNode(dir, NODE_INPUT, plan.restatedBody ?? "")).toThrow(
      /never creates a node/,
    );
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("writeRestatedNode — the two guards", () => {
  it("refuses a body with no citation block, leaving the file untouched", () => {
    const dir = seedNode(PRIOR_BODY);
    const before = readFileSync(join(dir, `${NODE_ID}.md`), "utf8");

    expect(() => writeRestatedNode(dir, NODE_INPUT, "# short\n\nno citation here\n")).toThrow(
      IntentionSchemaError,
    );
    expect(() => writeRestatedNode(dir, NODE_INPUT, "# short\n\nno citation here\n")).toThrow(
      /Consolidation record/,
    );
    expect(readFileSync(join(dir, `${NODE_ID}.md`), "utf8")).toBe(before);
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses an in-prose mention of the heading that is not its own line", () => {
    const dir = seedNode(PRIOR_BODY);
    expect(() =>
      writeRestatedNode(dir, NODE_INPUT, `# short\n\nsee the ${CITATION_HEADING} elsewhere\n`),
    ).toThrow(/Consolidation record/);
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses an empty body", () => {
    const dir = seedNode(PRIOR_BODY);
    expect(() => writeRestatedNode(dir, NODE_INPUT, "\n \n")).toThrow(/never empties it/);
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses a body that grows the node with no allowGrowth reason", () => {
    const plan = planRestatement(input());
    const restated = plan.restatedBody ?? "";
    // A prior body far shorter than the restatement: this fold grows the node.
    const dir = seedNode("# tiny\n");

    expect(() => writeRestatedNode(dir, NODE_INPUT, restated)).toThrow(/strictly smaller/);
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses a body merely EQUAL in size — strictly smaller means strictly", () => {
    const plan = planRestatement(input());
    const restated = plan.restatedBody ?? "";
    const dir = seedNode(restated);

    expect(() => writeRestatedNode(dir, NODE_INPUT, restated)).toThrow(/strictly smaller/);
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses an allowGrowth reason that is not recorded in the citation", () => {
    const plan = planRestatement(input({ allowGrowth: "resequenced for the reader" }));
    const restated = plan.restatedBody ?? "";
    const dir = seedNode("# tiny\n");

    expect(() =>
      writeRestatedNode(dir, NODE_INPUT, restated, { allowGrowth: "some other reason entirely" }),
    ).toThrow(/does not appear in the restated body's citation/);
    // The reason the citation DOES carry is accepted.
    writeRestatedNode(dir, NODE_INPUT, restated, { allowGrowth: "resequenced for the reader" });
    expect(readNodeBody(dir, NODE_ID)).toBe(restated);
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses an empty allowGrowth reason", () => {
    const plan = planRestatement(input());
    const restated = plan.restatedBody ?? "";
    const dir = seedNode("# tiny\n");

    expect(() => writeRestatedNode(dir, NODE_INPUT, restated, { allowGrowth: "   " })).toThrow(
      /strictly smaller/,
    );
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("the public barrel", () => {
  it("does not export writeRestatedNode", () => {
    // Deliberate: the one writer that may replace a body sits beside `writeNode`
    // in the module, not beside it on the barrel, so it is not reached for
    // casually. It stays importable from its module — asserted below so this
    // check cannot pass vacuously by the function having been renamed away.
    expect(Object.keys(barrel)).not.toContain("writeRestatedNode");
    expect(typeof writeRestatedNode).toBe("function");
  });

  it("does export the pure planner and its citation heading", () => {
    expect(Object.keys(barrel)).toContain("planRestatement");
    expect(Object.keys(barrel)).toContain("CITATION_HEADING");
    expect(Object.keys(barrel)).toContain("writeNode");
  });
});
