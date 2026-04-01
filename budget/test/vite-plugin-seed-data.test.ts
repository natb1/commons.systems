import { describe, it, expect } from "vitest";
import { budgetSeedDataPlugin } from "../src/vite-plugin-seed-data";
import type { Plugin } from "vite";

const EXPECTED_COLLECTIONS = [
  "transactions",
  "budgets",
  "budgetPeriods",
  "rules",
  "normalizationRules",
  "statements",
  "weeklyAggregates",
] as const;

describe("budgetSeedDataPlugin", () => {
  let plugin: Plugin;
  let moduleCode: string | undefined;

  function resolveId(id: string): string | undefined {
    return (plugin.resolveId as (id: string) => string | undefined)(id);
  }
  function load(id: string): string | undefined {
    return (plugin.load as (id: string) => string | undefined)(id);
  }

  plugin = budgetSeedDataPlugin();
  (plugin.buildStart as () => void)();
  const resolvedId = resolveId("virtual:budget-seed-data");
  moduleCode = resolvedId ? load(resolvedId) : undefined;

  it("resolves the virtual module ID", () => {
    expect(resolvedId).toBeDefined();
    expect(resolvedId).toBe("\0virtual:budget-seed-data");
  });

  it("returns undefined for unrelated module IDs", () => {
    expect(resolveId("some-other-module")).toBeUndefined();
  });

  it("returns undefined when loading an unrelated ID", () => {
    expect(load("some-other-id")).toBeUndefined();
  });

  it("produces module code containing export default", () => {
    expect(moduleCode).toBeDefined();
    expect(moduleCode).toContain("export default ");
  });

  describe("serialized seed data", () => {
    let data: Record<string, unknown[]>;

    it("is valid JSON parseable from the module code", () => {
      const json = moduleCode!.replace(/^export default /, "").replace(/;$/, "");
      data = JSON.parse(json);
      expect(data).toBeDefined();
    });

    // Deferred tests that rely on parsed data
    function getData(): Record<string, unknown[]> {
      if (!data) {
        const json = moduleCode!.replace(/^export default /, "").replace(/;$/, "");
        data = JSON.parse(json);
      }
      return data;
    }

    it("has all 7 collection keys", () => {
      const d = getData();
      for (const key of EXPECTED_COLLECTIONS) {
        expect(d).toHaveProperty(key);
        expect(Array.isArray(d[key])).toBe(true);
      }
    });

    it("transactions have id and timestampMs (number), no memberEmails or groupId", () => {
      const txns = getData().transactions as Record<string, unknown>[];
      expect(txns.length).toBeGreaterThan(0);
      for (const t of txns) {
        expect(typeof t.id).toBe("string");
        expect(typeof t.timestampMs).toBe("number");
        expect(t).not.toHaveProperty("memberEmails");
        expect(t).not.toHaveProperty("groupId");
      }
    });

    it("budgets have id, name, allowance, no memberEmails or groupId", () => {
      const budgets = getData().budgets as Record<string, unknown>[];
      expect(budgets.length).toBeGreaterThan(0);
      for (const b of budgets) {
        expect(typeof b.id).toBe("string");
        expect(typeof b.name).toBe("string");
        expect(typeof b.allowance).toBe("number");
        expect(b).not.toHaveProperty("memberEmails");
        expect(b).not.toHaveProperty("groupId");
      }
    });

    it("budgetPeriods have id, periodStartMs, periodEndMs (numbers), no memberEmails or groupId", () => {
      const periods = getData().budgetPeriods as Record<string, unknown>[];
      expect(periods.length).toBeGreaterThan(0);
      for (const p of periods) {
        expect(typeof p.id).toBe("string");
        expect(typeof p.periodStartMs).toBe("number");
        expect(typeof p.periodEndMs).toBe("number");
        expect(p).not.toHaveProperty("memberEmails");
        expect(p).not.toHaveProperty("groupId");
      }
    });

    it("weeklyAggregates have id, weekStartMs (number), no memberEmails or groupId", () => {
      const aggs = getData().weeklyAggregates as Record<string, unknown>[];
      expect(aggs.length).toBeGreaterThan(0);
      for (const a of aggs) {
        expect(typeof a.id).toBe("string");
        expect(typeof a.weekStartMs).toBe("number");
        expect(a).not.toHaveProperty("memberEmails");
        expect(a).not.toHaveProperty("groupId");
      }
    });

    it("rules have no memberEmails or groupId", () => {
      const rules = getData().rules as Record<string, unknown>[];
      expect(rules.length).toBeGreaterThan(0);
      for (const r of rules) {
        expect(r).not.toHaveProperty("memberEmails");
        expect(r).not.toHaveProperty("groupId");
      }
    });

    it("normalizationRules have no memberEmails or groupId", () => {
      const nrules = getData().normalizationRules as Record<string, unknown>[];
      expect(nrules.length).toBeGreaterThan(0);
      for (const r of nrules) {
        expect(r).not.toHaveProperty("memberEmails");
        expect(r).not.toHaveProperty("groupId");
      }
    });

    it("statements have no memberEmails or groupId", () => {
      const stmts = getData().statements as Record<string, unknown>[];
      expect(stmts.length).toBeGreaterThan(0);
      for (const s of stmts) {
        expect(s).not.toHaveProperty("memberEmails");
        expect(s).not.toHaveProperty("groupId");
      }
    });
  });
});
