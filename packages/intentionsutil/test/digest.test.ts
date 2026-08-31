import { describe, expect, it } from "vitest";
import { stringify } from "yaml";
import type { IntentionNode } from "../src/schema.js";
import {
  renderDigest,
  renderPerNode,
  renderTables,
  type DigestInput,
} from "../src/digest.js";

/** Build a full IntentionNode fixture, filling required/default fields. */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
    status: partial.status ?? "raw",
    parent: partial.parent ?? null,
    serves: partial.serves ?? [],
    recovers: partial.recovers ?? [],
    rationale: partial.rationale ?? null,
    reading: partial.reading ?? null,
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attention: partial.attention ?? null,
    phase: partial.phase ?? null,
    execution: partial.execution ?? null,
    validates: partial.validates ?? [],
    blocked_by: partial.blocked_by ?? [],
    superseded_by: partial.superseded_by ?? [],
    supersession_expiry: partial.supersession_expiry ?? null,
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/** Serialize a node's frontmatter the way the store does (for rawTexts). */
function rawText(node: IntentionNode): string {
  return `---\n${stringify(node)}---\n\n# ${node.statement}\n`;
}

/** Assemble a DigestInput from nodes + a body map; rawTexts default to serialized nodes. */
function input(
  nodes: IntentionNode[],
  opts: { bodies?: Record<string, string>; deletedIds?: string[]; rawTexts?: Record<string, string> } = {},
): DigestInput {
  const bodies = new Map<string, string>();
  const rawTexts = new Map<string, string>();
  for (const n of nodes) {
    bodies.set(n.id, opts.bodies?.[n.id] ?? "");
    rawTexts.set(n.id, opts.rawTexts?.[n.id] ?? rawText(n));
  }
  return { nodes, bodies, rawTexts, deletedIds: opts.deletedIds ?? [] };
}

/** The standard kind nodes a valid graph needs (kind-kind is self-referential). */
function kinds(): IntentionNode[] {
  return [
    anode({ id: "kind-kind", kind: "kind" }),
    anode({ id: "kind-virtue", kind: "kind", attributes: { goal_layer: true } }),
    anode({ id: "kind-strategy", kind: "kind", attributes: { goal_layer: true } }),
    anode({ id: "kind-tactic", kind: "kind", attributes: { goal_layer: true } }),
  ];
}

/** Return the `[TAG]`-headed block of a renderTables output (blocks split on blank lines). */
function section(out: string, tag: string): string {
  return out.split("\n\n").find((b) => b.startsWith(tag)) ?? "";
}

/** A minimal closed graph: the kind nodes, a virtue, a strategy, a tactic. */
function closedGraph(): IntentionNode[] {
  // Every fixture node here defaults to status "raw" (anode()'s default), so
  // each kind node's status_vocabulary just needs to cover "raw"; "codified"
  // is included too to mirror the default schema.test.ts's gnode() applies.
  const statusVocabulary = { raw: "Not yet started.", codified: "Complete." };
  return [
    ...kinds().map((n) => ({
      ...n,
      attributes: { ...n.attributes, status_vocabulary: statusVocabulary },
    })),
    anode({ id: "virtue-root", kind: "virtue" }),
    anode({ id: "strategy-a", kind: "strategy", serves: ["virtue-root"] }),
    anode({ id: "tactic-a", kind: "tactic", serves: ["strategy-a"], validates: ["strategy-a"] }),
  ];
}

describe("renderPerNode (Section 1)", () => {
  it("emits one id-sorted line per node with the summary columns", () => {
    const nodes = [
      anode({ id: "tactic-z", kind: "tactic", status: "codified", phase: "done" }),
      anode({ id: "tactic-a", kind: "tactic", status: "raw", phase: "implement" }),
    ];
    const out = renderPerNode(input(nodes, { bodies: { "tactic-a": "hello", "tactic-z": "" } }));
    const lines = out.trimEnd().split("\n");
    expect(lines[0]).toBe("[NODES] 2 nodes");
    // id-sorted: tactic-a before tactic-z
    expect(lines[1]).toContain("tactic-a");
    expect(lines[2]).toContain("tactic-z");
    expect(lines[1]).toContain("phase=implement");
    expect(lines[1]).toContain("body=5b"); // "hello" = 5 bytes
    expect(lines[2]).toContain("phase=done");
  });

  it("reports signal presence as none / direct / proxy", () => {
    const nodes = [
      anode({ id: "strategy-none", kind: "strategy" }),
      anode({
        id: "strategy-direct",
        kind: "strategy",
        success_signal: { observable: "o", sensor: "s", threshold: "t", is_proxy: false },
      }),
      anode({
        id: "strategy-proxy",
        kind: "strategy",
        success_signal: { observable: "o", sensor: "s", threshold: "t", is_proxy: true },
      }),
    ];
    const out = renderPerNode(input(nodes));
    expect(out).toMatch(/strategy-none.*signal=none/);
    expect(out).toMatch(/strategy-direct.*signal=direct/);
    expect(out).toMatch(/strategy-proxy.*signal=proxy/);
  });

  it("reports the latest clarification date and condition count", () => {
    const nodes = [
      anode({
        id: "tactic-c",
        kind: "tactic",
        clarifications: [
          { question: "q1", answer: "decided on 2026-01-05 initially" },
          { question: "q2", answer: "revised 2026-07-09 per round" },
        ],
        attributes: { conditions: ["one", "two", "three"] },
      }),
    ];
    const out = renderPerNode(input(nodes));
    expect(out).toContain("clar=2@2026-07-09"); // max of the two dates
    expect(out).toContain("cond=3");
  });

  it("shows clar=0@- and cond=0 when absent", () => {
    const out = renderPerNode(input([anode({ id: "tactic-x", kind: "tactic" })]));
    expect(out).toContain("clar=0@-");
    expect(out).toContain("cond=0");
  });
});

describe("VALIDATE table", () => {
  it("passes on a clean graph", () => {
    expect(renderTables(input(closedGraph()))).toContain("[VALIDATE] pass");
  });

  it("reports the integrity-violation message on a broken graph", () => {
    // A tactic serving a non-existent strategy fails validateGraph.
    const nodes = [
      ...closedGraph(),
      anode({ id: "tactic-broken", kind: "tactic", serves: ["strategy-ghost"] }),
    ];
    const out = renderTables(input(nodes));
    expect(out).toContain("[VALIDATE] FAIL");
    expect(out).toContain("strategy-ghost");
  });
});

describe("CLOSURE table", () => {
  it("passes when every strategy/tactic reaches a virtue root", () => {
    expect(renderTables(input(closedGraph()))).toContain("[CLOSURE] pass");
  });

  it("flags a tactic whose chain never reaches a virtue", () => {
    const nodes = [
      anode({ id: "kind-virtue", kind: "kind", attributes: { goal_layer: true } }),
      anode({ id: "kind-strategy", kind: "kind", attributes: { goal_layer: true } }),
      anode({ id: "kind-tactic", kind: "kind", attributes: { goal_layer: true } }),
      anode({ id: "virtue-root", kind: "virtue" }),
      // strategy-orphan serves nothing and has no parent — never reaches a virtue.
      anode({ id: "strategy-orphan", kind: "strategy" }),
      anode({ id: "tactic-orphan", kind: "tactic", serves: ["strategy-orphan"] }),
    ];
    const out = renderTables(input(nodes));
    expect(out).toContain("[CLOSURE]");
    expect(out).toContain("strategy-orphan");
    expect(out).toContain("tactic-orphan");
  });

  it("treats an empty-serves sub-strategy whose parent reaches a virtue as closed", () => {
    const nodes = [
      anode({ id: "kind-virtue", kind: "kind", attributes: { goal_layer: true } }),
      anode({ id: "kind-strategy", kind: "kind", attributes: { goal_layer: true } }),
      anode({ id: "virtue-root", kind: "virtue" }),
      anode({ id: "strategy-parent", kind: "strategy", serves: ["virtue-root"] }),
      // Empty serves, but parent chain reaches the virtue — NOT a closure failure.
      anode({ id: "strategy-child", kind: "strategy", parent: "strategy-parent" }),
    ];
    const out = renderTables(input(nodes));
    expect(out).toContain("[CLOSURE] pass");
  });

  it("does not loop on a serves/parent cycle and reports the unclosed members", () => {
    const nodes = [
      anode({ id: "kind-strategy", kind: "kind", attributes: { goal_layer: true } }),
      // Two strategies pointing at each other via parent — no virtue anywhere.
      anode({ id: "strategy-x", kind: "strategy", parent: "strategy-y" }),
      anode({ id: "strategy-y", kind: "strategy", parent: "strategy-x" }),
    ];
    const out = renderTables(input(nodes));
    expect(out).toContain("strategy-x");
    expect(out).toContain("strategy-y");
  });
});

describe("DONE-PRESENT table", () => {
  it("lists done tactics still in the store", () => {
    const nodes = [
      ...closedGraph(),
      anode({ id: "tactic-leaked", kind: "tactic", phase: "done" }),
    ];
    const out = renderTables(input(nodes));
    expect(out).toContain("[DONE-PRESENT]");
    expect(out).toContain("tactic-leaked");
  });

  it("reports none when no done tactics remain", () => {
    expect(renderTables(input(closedGraph()))).toContain("[DONE-PRESENT] none");
  });
});

describe("DUP-SERVES table", () => {
  it("flags a node re-declaring an entry of its direct parent's serves, with only the redundant entries", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "virtue-root", kind: "virtue" }),
      anode({ id: "virtue-other", kind: "virtue" }),
      anode({ id: "strategy-parent", kind: "strategy", serves: ["virtue-root", "virtue-other"] }),
      // child re-declares virtue-root (redundant) plus a self-only serve.
      anode({
        id: "strategy-child",
        kind: "strategy",
        parent: "strategy-parent",
        serves: ["virtue-root"],
      }),
    ];
    const dup = section(renderTables(input(nodes)), "[DUP-SERVES]");
    expect(dup).toMatch(/\[DUP-SERVES\] 1 nodes/);
    expect(dup).toContain("strategy-child: virtue-root");
    // virtue-other is the parent's own serve, never listed as the child's redundancy.
    expect(dup).not.toContain("virtue-other");
  });

  it("reports none when no child duplicates a parent serve", () => {
    expect(renderTables(input(closedGraph()))).toContain("[DUP-SERVES] none");
  });
});

describe("NEAR-DUP-STATEMENTS table", () => {
  it("surfaces highly similar statement pairs above the threshold", () => {
    const nodes = [
      ...kinds(),
      anode({ id: "tactic-review-lows-finance", kind: "tactic", statement: "sweep the low severity review findings for the finance app" }),
      anode({ id: "tactic-review-lows-publishing", kind: "tactic", statement: "sweep the low severity review findings for the publishing app" }),
      anode({ id: "tactic-unrelated", kind: "tactic", statement: "migrate the encrypted budget snapshot format" }),
    ];
    const nd = section(renderTables(input(nodes)), "[NEAR-DUP-STATEMENTS]");
    expect(nd).toContain("tactic-review-lows-finance");
    expect(nd).toContain("tactic-review-lows-publishing");
    // The unrelated tactic is not part of any near-dup pair.
    expect(nd).not.toContain("tactic-unrelated");
  });

  it("reports none when all statements are distinct", () => {
    const nodes = [
      anode({ id: "tactic-a", kind: "tactic", statement: "alpha beta gamma" }),
      anode({ id: "tactic-b", kind: "tactic", statement: "delta epsilon zeta" }),
    ];
    expect(renderTables(input(nodes))).toContain("[NEAR-DUP-STATEMENTS] none");
  });
});

describe("DANGLING-REFS table", () => {
  it("classifies a backtick-quoted reference as live / pruned / missing", () => {
    const nodes = [
      anode({ id: "kind-tactic", kind: "kind", attributes: { goal_layer: true } }),
      anode({ id: "tactic-live", kind: "tactic" }),
      anode({
        id: "tactic-refs",
        kind: "tactic",
        statement: "references others",
      }),
    ];
    const bodies = {
      "tactic-refs": "See `tactic-live` (present), `tactic-gone` (deleted), and `tactic-ghost` (never existed).",
    };
    const out = renderTables(input(nodes, { bodies, deletedIds: ["tactic-gone"] }));
    expect(out).toContain("[DANGLING-REFS]");
    expect(out).toContain("MISSING tactic-ghost <- tactic-refs");
    expect(out).toContain("PRUNED tactic-gone <- tactic-refs");
    // live is counted, not itemized
    expect(out).toMatch(/live=1/);
  });

  it("does NOT treat a bare prose compound as a missing reference", () => {
    const nodes = [
      anode({ id: "kind-tactic", kind: "tactic" }),
      anode({ id: "tactic-prose", kind: "tactic" }),
    ];
    // "tactic-only" appears in flowing prose with no backticks and is not in vocab.
    const bodies = {
      "tactic-prose": "This is a tactic-only concern and a strategy-id compound, not a reference.",
    };
    const out = renderTables(input(nodes, { bodies }));
    expect(out).not.toContain("tactic-only");
    expect(out).not.toContain("strategy-id");
    expect(out).toMatch(/missing=0/);
  });

  it("resolves a family wildcard against member nodes, not as a missing id", () => {
    const nodes = [
      anode({ id: "kind-tactic", kind: "tactic" }),
      anode({ id: "tactic-recovery-drill-alpha", kind: "tactic" }),
      anode({ id: "tactic-recovery-drill-beta", kind: "tactic" }),
      anode({ id: "tactic-refs", kind: "tactic" }),
    ];
    const bodies = {
      "tactic-refs": "The `tactic-recovery-drill-*` family covers the drills.",
    };
    const out = renderTables(input(nodes, { bodies }));
    expect(out).toContain("tactic-recovery-drill-* (2 members)");
    expect(out).toMatch(/missing=0/);
  });

  it("annotates a missing ref with the planned-reference heuristic", () => {
    const nodes = [
      anode({ id: "kind-tactic", kind: "tactic" }),
      anode({
        id: "tactic-open",
        kind: "tactic",
        phase: "implement",
        statement: "will create tactic-future",
      }),
      anode({ id: "tactic-refs", kind: "tactic" }),
    ];
    const bodies = { "tactic-refs": "depends on `tactic-future`" };
    const out = renderTables(input(nodes, { bodies }));
    expect(out).toContain("MISSING tactic-future <- tactic-refs [planned: open tactic mentions it]");
  });
});

describe("STORED-DEFAULTS table", () => {
  it("counts serialized frontmatter keys equal to a schema default", () => {
    const node = anode({ id: "tactic-defaults", kind: "tactic" });
    const out = renderTables(input([node]));
    expect(out).toContain("[STORED-DEFAULTS]");
    expect(out).toContain("tactic-defaults");
    // The serialized fixture carries many defaults: recovers [], reading null,
    // gap null, clarifications [], pace_exempt false, attributes {}, etc.
    expect(out).toMatch(/\d+ default-valued keys/);
  });
});

describe("output budget", () => {
  it("keeps Section 2 within an order-of-magnitude of 25KB on a large synthetic store", () => {
    const nodes: IntentionNode[] = [
      anode({ id: "kind-virtue", kind: "kind", attributes: { goal_layer: true } }),
      anode({ id: "kind-strategy", kind: "kind", attributes: { goal_layer: true } }),
      anode({ id: "kind-tactic", kind: "kind", attributes: { goal_layer: true } }),
      anode({ id: "virtue-root", kind: "virtue" }),
    ];
    for (let i = 0; i < 400; i++) {
      const sid = `strategy-${String(i).padStart(3, "0")}`;
      nodes.push(anode({ id: sid, kind: "strategy", serves: ["virtue-root"] }));
      nodes.push(
        anode({
          id: `tactic-${String(i).padStart(3, "0")}`,
          kind: "tactic",
          serves: [sid],
          statement: `distinct statement number ${i} about topic ${i} and subject ${i}`,
        }),
      );
    }
    const tables = renderTables(input(nodes));
    const bytes = Buffer.byteLength(tables, "utf8");
    // Order-of-magnitude assertion, not a brittle byte count: well under 250KB.
    expect(bytes).toBeLessThan(250_000);
  });
});

describe("renderDigest", () => {
  it("emits Section 1 then Section 2", () => {
    const out = renderDigest(input(closedGraph()));
    expect(out).toContain("[NODES]");
    expect(out).toContain("[VALIDATE]");
    expect(out.indexOf("[NODES]")).toBeLessThan(out.indexOf("[VALIDATE]"));
  });

  it("is deterministic — two runs on the same input are byte-identical", () => {
    const nodes = closedGraph();
    expect(renderDigest(input(nodes))).toBe(renderDigest(input(nodes)));
  });
});
