import { describe, it, expect, beforeAll } from "vitest";
import { auditAggregateSeedPlugin } from "../src/vite-plugin-audit-aggregate-seed";
import type { Plugin } from "vite";

describe("auditAggregateSeedPlugin", () => {
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
    plugin = auditAggregateSeedPlugin();
    (plugin.buildStart as () => void)();
    resolvedId = resolveId("virtual:office-hours-audit-aggregate-seed-data");
    moduleCode = resolvedId ? load(resolvedId) : undefined;
  });

  it("resolves the virtual module ID", () => {
    expect(resolvedId).toBeDefined();
    expect(resolvedId).toBe("\0virtual:office-hours-audit-aggregate-seed-data");
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

  describe("generated audit aggregates", () => {
    let aggregates: Array<{
      computedAt: Date;
      windowDays: number;
      groupId: string;
      phaseSpend: Record<string, number>;
      cacheRead: number;
      cacheCreation: number;
    }>;
    let now: number;

    beforeAll(() => {
      now = Date.now();
      const body = moduleCode!.replace("export default", "return");
      aggregates = new Function(body)() as typeof aggregates;
    });

    it("returns an array of aggregates", () => {
      expect(Array.isArray(aggregates)).toBe(true);
      expect(aggregates.length).toBeGreaterThan(0);
    });

    it("every aggregate has the correct fields with correct types", () => {
      for (const a of aggregates) {
        expect(a.computedAt).toBeInstanceOf(Date);
        expect(typeof a.windowDays).toBe("number");
        expect(typeof a.groupId).toBe("string");
        expect(typeof a.phaseSpend).toBe("object");
        for (const v of Object.values(a.phaseSpend)) {
          expect(typeof v).toBe("number");
        }
        expect(typeof a.cacheRead).toBe("number");
        expect(typeof a.cacheCreation).toBe("number");
        // memberEmails is an auth field that must never reach the public bundle.
        expect(a).not.toHaveProperty("memberEmails");
      }
    });

    it("computedAtOffsetMin resolves to a Date relative to build time", () => {
      const mostRecent = aggregates.reduce((a, b) =>
        a.computedAt.getTime() > b.computedAt.getTime() ? a : b,
      );
      // Within 5 minutes of now (the seed has computedAtOffsetMin: 0).
      expect(Math.abs(mostRecent.computedAt.getTime() - now)).toBeLessThan(5 * 60 * 1000);
    });

    it("series spans multiple days", () => {
      const times = aggregates.map((a) => a.computedAt.getTime());
      const oldest = Math.min(...times);
      const newest = Math.max(...times);
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      expect(newest - oldest).toBeGreaterThan(fiveDaysMs);
    });

    it("cache hit rate varies across the series", () => {
      const hitRates = aggregates.map((a) => a.cacheRead / (a.cacheRead + a.cacheCreation));
      const min = Math.min(...hitRates);
      const max = Math.max(...hitRates);
      expect(max - min).toBeGreaterThan(0.1);
    });
  });
});
