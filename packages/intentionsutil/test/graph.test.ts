import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as graph from "../src/graph.js";

describe("graph subpath barrel", () => {
  it("exports the fs-free runtime surface", () => {
    expect(typeof graph.validateNode).toBe("function");
    expect(typeof graph.validateGraph).toBe("function");
    expect(typeof graph.resolveAttention).toBe("function");
    expect(typeof graph.projectGoals).toBe("function");
    expect(typeof graph.activeFrontier).toBe("function");
    expect(typeof graph.realizationForOwner).toBe("function");
    expect(typeof graph.renderFrontier).toBe("function");
    expect(typeof graph.IntentionSchemaError).toBe("function");
    expect(Array.isArray(graph.OWNERS)).toBe(true);
    expect(Array.isArray(graph.STATUSES)).toBe(true);
    expect(Array.isArray(graph.PHASES)).toBe(true);
  });

  it("stays browser-safe: no transitive source module imports node builtins or the store", () => {
    // Walk the graph entry's transitive relative imports and assert none of
    // them import `node:*` — the guard that keeps this subpath loadable in a
    // browser bundle (the whole point of the entry).
    const srcDir = resolve(import.meta.dirname, "../src");
    const seen = new Set<string>();
    const queue = ["graph.ts"];
    while (queue.length > 0) {
      const name = queue.pop()!; // type-safety-ok: pop() guarded by the while(queue.length > 0) loop condition above
      if (seen.has(name)) continue;
      seen.add(name);
      const source = readFileSync(resolve(srcDir, name), "utf8");
      const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
      for (const spec of specifiers) {
        expect(spec, `${name} imports ${spec}`).not.toMatch(/^node:/);
        if (spec.startsWith("./")) {
          queue.push(spec.replace(/^\.\//, "").replace(/\.js$/, ".ts"));
        }
      }
    }
    // The fs-free modules are all reached...
    expect(seen).toContain("schema.ts");
    expect(seen).toContain("attention.ts");
    expect(seen).toContain("goals.ts");
    expect(seen).toContain("errors.ts");
    // ...and the Node-only store never is.
    expect(seen).not.toContain("store.ts");
  });
});
