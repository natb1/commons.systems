import { describe, it, expect, beforeAll } from "vitest";
import { officeHoursIntentionTreeSeedPlugin } from "../src/vite-plugin-intention-tree-seed";
import type { Plugin } from "vite";

describe("officeHoursIntentionTreeSeedPlugin", () => {
  let plugin: Plugin;
  let moduleCode: string | undefined;
  let resolvedId: string | undefined;

  function resolveId(id: string): string | undefined {
    return (plugin.resolveId as (id: string) => string | undefined)(id);
  }
  function load(id: string): string | undefined {
    return (plugin.load as (id: string) => string | undefined)(id);
  }

  beforeAll(() => {
    plugin = officeHoursIntentionTreeSeedPlugin();
    (plugin.buildStart as () => void)();
    resolvedId = resolveId("virtual:office-hours-intention-tree-seed");
    moduleCode = resolvedId ? load(resolvedId) : undefined;
  });

  it("resolves the virtual module ID", () => {
    expect(resolvedId).toBeDefined();
    expect(resolvedId).toBe("\0virtual:office-hours-intention-tree-seed");
  });

  it("returns undefined for unrelated module IDs", () => {
    expect(resolveId("some-other-module")).toBeUndefined();
  });

  it("returns undefined when loading an unrelated ID", () => {
    expect(load("some-other-id")).toBeUndefined();
  });

  it("produces module code containing export default", () => {
    expect(moduleCode).toBeDefined();
    expect(moduleCode).toContain("export default");
  });

  describe("generated seed", () => {
    let seed: {
      nodes: Array<{
        id: string;
        statement: string;
        owner: string;
        status: string;
        parent: string | null;
        rationale?: unknown;
        gap?: unknown;
        success_signal?: unknown;
        clarifications?: unknown;
        tooling_goals?: unknown;
        reading?: unknown;
        recovers?: unknown;
      }>;
      frontierIds: string[];
    };

    beforeAll(() => {
      const body = moduleCode!.replace("export default", "return"); // type-safety-ok: assigned by the outer beforeAll; the preceding 'produces module code' test asserts it is defined
      seed = new Function(body)() as typeof seed;
    });

    it("nodes is a non-empty array", () => {
      expect(Array.isArray(seed.nodes)).toBe(true);
      expect(seed.nodes.length).toBeGreaterThan(0);
    });

    it("each node has exactly the slim keys (no stripped fields)", () => {
      const sample = seed.nodes[0];
      expect(typeof sample.id).toBe("string");
      expect(typeof sample.statement).toBe("string");
      expect(sample.owner).toBeTruthy();
      expect(sample.status).toBeTruthy();
      // parent is string | null — check it's not undefined
      expect("parent" in sample).toBe(true);
      // stripped fields must not be present
      expect(sample.rationale).toBeUndefined();
      expect(sample.gap).toBeUndefined();
      expect(sample.success_signal).toBeUndefined();
      expect(sample.clarifications).toBeUndefined();
      expect(sample.tooling_goals).toBeUndefined();
      expect(sample.reading).toBeUndefined();
      expect(sample.recovers).toBeUndefined();
    });

    it("frontierIds is an array of strings", () => {
      expect(Array.isArray(seed.frontierIds)).toBe(true);
      for (const id of seed.frontierIds) {
        expect(typeof id).toBe("string");
      }
    });
  });
});
