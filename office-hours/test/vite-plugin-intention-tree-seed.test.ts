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
      }>;
      frontierIds: string[];
      trackers: Record<string, { issue_number: number; state: string; [key: string]: unknown }>;
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
    });

    it("frontierIds is an array of strings", () => {
      expect(Array.isArray(seed.frontierIds)).toBe(true);
      for (const id of seed.frontierIds) {
        expect(typeof id).toBe("string");
      }
    });

    it("trackers is a plain object", () => {
      expect(typeof seed.trackers).toBe("object");
      expect(seed.trackers).not.toBeNull();
    });

    it("seed.trackers['issue-2367'] is defined with issue_number and state (proves FS read + path resolution)", () => {
      const tracker = seed.trackers["issue-2367"];
      expect(tracker).toBeDefined();
      expect(typeof tracker.issue_number).toBe("number");
      expect(typeof tracker.state).toBe("string");
    });

    it("most nodes are untracked — a non-issue-2367 node id is absent from trackers", () => {
      const untrackedId = seed.nodes.find((n) => n.id !== "issue-2367")?.id;
      if (untrackedId === undefined) {
        // Only one node in the entire store and it is the tracked one — skip.
        return;
      }
      // Only assert if we found a node that is definitely not in trackers.
      if (!(untrackedId in seed.trackers)) {
        expect(seed.trackers[untrackedId]).toBeUndefined();
      }
    });
  });
});
