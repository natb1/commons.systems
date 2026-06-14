import { describe, it, expect, beforeAll } from "vitest";
import { issueSamplesSeedDataPlugin } from "../src/vite-plugin-issue-samples-seed";
import type { Plugin } from "vite";

describe("issueSamplesSeedDataPlugin", () => {
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
    plugin = issueSamplesSeedDataPlugin();
    (plugin.buildStart as () => void)();
    resolvedId = resolveId("virtual:office-hours-issue-seed-data");
    moduleCode = resolvedId ? load(resolvedId) : undefined;
  });

  it("resolves the virtual module ID", () => {
    expect(resolvedId).toBeDefined();
    expect(resolvedId).toBe("\0virtual:office-hours-issue-seed-data");
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

  it("does not bake the memberEmails auth field into the bundle", () => {
    expect(moduleCode).toBeDefined();
    expect(moduleCode).not.toContain("memberEmails");
  });

  describe("generated issue samples", () => {
    let samples: Array<{
      sampledAt: Date;
      openHelpWanted: number;
      openOther: number;
      groupId: string;
    }>;
    let now: number;

    beforeAll(() => {
      now = Date.now();
      const body = moduleCode!.replace("export default", "return");
      samples = new Function(body)() as typeof samples;
    });

    it("returns an array of samples", () => {
      expect(Array.isArray(samples)).toBe(true);
      expect(samples.length).toBeGreaterThan(0);
    });

    it("every sample has the correct fields with correct types", () => {
      for (const s of samples) {
        expect(s.sampledAt).toBeInstanceOf(Date);
        expect(typeof s.openHelpWanted).toBe("number");
        expect(typeof s.openOther).toBe("number");
        expect(typeof s.groupId).toBe("string");
        // memberEmails is an auth field that must never reach the public bundle.
        expect(s).not.toHaveProperty("memberEmails");
      }
    });

    it("most recent sample is close to build time (sampledAt near now)", () => {
      const mostRecent = samples.reduce((a, b) =>
        a.sampledAt.getTime() > b.sampledAt.getTime() ? a : b
      );
      // Within 5 minutes of now (the seed has sampledAtOffsetMin: 0)
      expect(Math.abs(mostRecent.sampledAt.getTime() - now)).toBeLessThan(5 * 60 * 1000);
    });

    it("series spans multiple days (oldest sample is at least 5 days before newest)", () => {
      const times = samples.map((s) => s.sampledAt.getTime());
      const oldest = Math.min(...times);
      const newest = Math.max(...times);
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      expect(newest - oldest).toBeGreaterThan(fiveDaysMs);
    });

    it("backlog shrinks over the series (most-recent total < oldest total)", () => {
      const oldest = samples.reduce((a, b) =>
        a.sampledAt.getTime() < b.sampledAt.getTime() ? a : b
      );
      const mostRecent = samples.reduce((a, b) =>
        a.sampledAt.getTime() > b.sampledAt.getTime() ? a : b
      );
      const oldestTotal = oldest.openHelpWanted + oldest.openOther;
      const recentTotal = mostRecent.openHelpWanted + mostRecent.openOther;
      expect(recentTotal).toBeLessThan(oldestTotal);
    });

    it("contains the expected number of samples (12-16)", () => {
      expect(samples.length).toBeGreaterThanOrEqual(12);
      expect(samples.length).toBeLessThanOrEqual(16);
    });
  });
});
