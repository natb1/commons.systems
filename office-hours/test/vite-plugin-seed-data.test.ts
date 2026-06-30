import { describe, it, expect, beforeAll } from "vitest";
import { officeHoursSeedDataPlugin } from "../src/vite-plugin-seed-data";
import type { Plugin } from "vite";

describe("officeHoursSeedDataPlugin", () => {
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
    plugin = officeHoursSeedDataPlugin();
    (plugin.buildStart as () => void)();
    resolvedId = resolveId("virtual:office-hours-seed-data");
    moduleCode = resolvedId ? load(resolvedId) : undefined;
  });

  it("resolves the virtual module ID", () => {
    expect(resolvedId).toBeDefined();
    expect(resolvedId).toBe("\0virtual:office-hours-seed-data");
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

  describe("generated reminders", () => {
    let reminders: Array<{
      jitKey: string;
      title: string;
      repo: string;
      issueNumber: number;
      dueAt: Date;
    }>;
    let now: number;

    beforeAll(() => {
      now = Date.now();
      const body = moduleCode!.replace("export default", "return");
      reminders = new Function(body)() as typeof reminders;
    });

    it("returns an array of reminders", () => {
      expect(Array.isArray(reminders)).toBe(true);
      expect(reminders.length).toBeGreaterThan(0);
    });

    it("every reminder has the correct fields with correct types", () => {
      for (const r of reminders) {
        expect(typeof r.jitKey).toBe("string");
        expect(typeof r.title).toBe("string");
        expect(typeof r.repo).toBe("string");
        expect(typeof r.issueNumber).toBe("number");
        expect(r.dueAt).toBeInstanceOf(Date);
      }
    });

    it("at least one reminder is overdue (dueAt in the past)", () => {
      const overdue = reminders.filter((r) => r.dueAt.getTime() < now);
      expect(overdue.length).toBeGreaterThan(0);
    });

    it("at least one reminder is due soon (within a few hours)", () => {
      const fewHours = 12 * 60 * 60 * 1000; // 12h tolerance
      const dueSoon = reminders.filter(
        (r) => r.dueAt.getTime() > now && r.dueAt.getTime() <= now + fewHours
      );
      expect(dueSoon.length).toBeGreaterThan(0);
    });

    it("at least one reminder is due later (more than 1 day out)", () => {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const dueLater = reminders.filter(
        (r) => r.dueAt.getTime() > now + oneDayMs
      );
      expect(dueLater.length).toBeGreaterThan(0);
    });
  });
});
