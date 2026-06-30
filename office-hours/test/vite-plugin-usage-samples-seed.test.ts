import { describe, it, expect, beforeAll } from "vitest";
import { usageSamplesSeedDataPlugin } from "../src/vite-plugin-usage-samples-seed";
import type { Plugin } from "vite";

describe("usageSamplesSeedDataPlugin", () => {
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
    plugin = usageSamplesSeedDataPlugin();
    (plugin.buildStart as () => void)();
    resolvedId = resolveId("virtual:office-hours-usage-seed-data");
    moduleCode = resolvedId ? load(resolvedId) : undefined;
  });

  it("resolves the virtual module ID", () => {
    expect(resolvedId).toBeDefined();
    expect(resolvedId).toBe("\0virtual:office-hours-usage-seed-data");
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

  describe("generated usage samples", () => {
    let samples: Array<{
      sampledAt: Date;
      fiveHourUsedPct: number;
      weeklyUsedPct: number;
      fiveHourResetsAt: Date;
      weeklyResetsAt: Date;
      activeWorkers: number;
      targetWorkers: number;
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
        expect(typeof s.fiveHourUsedPct).toBe("number");
        expect(typeof s.weeklyUsedPct).toBe("number");
        expect(s.fiveHourResetsAt).toBeInstanceOf(Date);
        expect(s.weeklyResetsAt).toBeInstanceOf(Date);
        expect(typeof s.activeWorkers).toBe("number");
        expect(typeof s.targetWorkers).toBe("number");
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

    it("at least one reset boundary is present (a sample with fiveHourResetsAt after its sampledAt)", () => {
      const withReset = samples.filter((s) => s.fiveHourResetsAt.getTime() > s.sampledAt.getTime());
      expect(withReset.length).toBeGreaterThan(0);
    });

    it("worker counts vary (activeWorkers and targetWorkers diverge across the series)", () => {
      const diverged = samples.some((s) => s.activeWorkers !== s.targetWorkers);
      expect(diverged).toBe(true);
    });

    it("contains the expected number of samples (12-16)", () => {
      expect(samples.length).toBeGreaterThanOrEqual(12);
      expect(samples.length).toBeLessThanOrEqual(16);
    });
  });
});
