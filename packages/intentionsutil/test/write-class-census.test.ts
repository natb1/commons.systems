import { describe, expect, it } from "vitest";
import {
  censusKindCoverage,
  censusWriteSites,
  findWriteNodeCalls,
  render,
  type WriteSite,
} from "../scripts/write-class-census.js";

describe("findWriteNodeCalls", () => {
  it("classifies a declared-orchestration call", () => {
    const text = 'writeNode(dir, node, { writes: "orchestration" });';
    const [call] = findWriteNodeCalls(text);
    expect(call.declaration).toBe("orchestration");
  });

  it("classifies a declared-intent call", () => {
    const text = "writeNode(dir, node, { writes: 'intent' });";
    const [call] = findWriteNodeCalls(text);
    expect(call.declaration).toBe("intent");
  });

  it("classifies a dynamic (non-literal) writes value as 'dynamic'", () => {
    const text = "writeNode(dir, node, { writes: someVariable });";
    const [call] = findWriteNodeCalls(text);
    expect(call.declaration).toBe("dynamic");
  });

  it("classifies a call with no writes key as 'undeclared'", () => {
    const text = "writeNode(dir, node);";
    const [call] = findWriteNodeCalls(text);
    expect(call.declaration).toBe("undeclared");
  });

  it("excludes the function's own declaration", () => {
    const text = 'export function writeNode(dir: string, node: IntentionNode) {\n  return null;\n}\nwriteNode(dir, node, { writes: "intent" });';
    const calls = findWriteNodeCalls(text);
    // Only the CALL should be found, not the `function writeNode(` declaration.
    expect(calls).toHaveLength(1);
    expect(calls[0]?.declaration).toBe("intent");
  });

  it("finds every call across multiple occurrences, in source order", () => {
    const text =
      'writeNode(a, b, { writes: "intent" });\n' +
      "writeNode(c, d);\n" +
      'writeNode(e, f, { writes: "orchestration" });';
    const calls = findWriteNodeCalls(text);
    expect(calls.map((c) => c.declaration)).toEqual(["intent", "undeclared", "orchestration"]);
  });
});

describe("render", () => {
  const emptyCoverage = { missingFromKindKind: [], kindsWithNoDeclaration: [] };

  it("reports zero counts and '(none)' sections for an empty census", () => {
    const text = render([], emptyCoverage);
    expect(text).toContain("total call sites found: 0");
    expect(text).toContain("declared (orchestration): 0");
    expect(text).toContain("(none)");
    expect(text).toContain("First-class fields with no kind-kind.md field_write_class entry: none");
    expect(text).toContain("kind-*.md nodes with no field_write_class declaration at all: none");
  });

  it("lists each site as path:line under its declaration bucket", () => {
    const sites: WriteSite[] = [
      { path: "packages/intentionsutil/scripts/write-node.ts", line: 61, declaration: "undeclared" },
      { path: "packages/intentionsutil/scripts/park-node", line: 370, declaration: "orchestration" },
    ];
    const text = render(sites, emptyCoverage);
    expect(text).toContain("undeclared:               1");
    expect(text).toContain("declared (orchestration): 1");
    expect(text).toContain("packages/intentionsutil/scripts/write-node.ts:61");
    expect(text).toContain("packages/intentionsutil/scripts/park-node:370");
  });

  it("names missing kind-kind coverage and undeclared kind nodes when present", () => {
    const text = render([], {
      missingFromKindKind: ["some_field"],
      kindsWithNoDeclaration: ["kind-virtue"],
    });
    expect(text).toContain("some_field");
    expect(text).toContain("kind-virtue");
  });
});

// Integration: run the real scan against this repo's own tree. These assert
// structural facts the migration contract's own text guarantees (unit 4's plan
// text names write-node.ts:61 and graph-commit as deliberately undeclared, and
// apply-node-transition.ts/park-node/clear-park/resolve-park as declared
// orchestration) rather than exact counts, so a legitimate future declaration
// does not make this test brittle.
describe("censusWriteSites (integration, real repo tree)", () => {
  const sites = censusWriteSites();

  it("finds at least one call site", () => {
    expect(sites.length).toBeGreaterThan(0);
  });

  it("is sorted by path then line", () => {
    const sorted = [...sites].sort((a, b) =>
      a.path === b.path ? a.line - b.line : a.path < b.path ? -1 : 1,
    );
    expect(sites).toEqual(sorted);
  });

  it("never includes write-class-census.ts itself", () => {
    expect(sites.some((s) => s.path.endsWith("write-class-census.ts"))).toBe(false);
  });

  it("classifies write-node.ts's call as undeclared — the deliberate escape hatch unit 4's plan names", () => {
    const site = sites.find((s) => s.path.endsWith("scripts/write-node.ts"));
    expect(site?.declaration).toBe("undeclared");
  });

  it("classifies park-node's call as declared orchestration", () => {
    const site = sites.find((s) => s.path.endsWith("scripts/park-node"));
    expect(site?.declaration).toBe("orchestration");
  });

  it("classifies clear-park's call as declared orchestration", () => {
    const site = sites.find((s) => s.path.endsWith("scripts/clear-park"));
    expect(site?.declaration).toBe("orchestration");
  });
});

describe("censusKindCoverage (integration, real repo tree)", () => {
  it("runs without throwing and returns the two coverage arrays", () => {
    const coverage = censusKindCoverage();
    expect(Array.isArray(coverage.missingFromKindKind)).toBe(true);
    expect(Array.isArray(coverage.kindsWithNoDeclaration)).toBe(true);
  });
});
