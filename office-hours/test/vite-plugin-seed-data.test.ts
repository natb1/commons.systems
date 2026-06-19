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
    type GeneratedReminder = {
      kind: "reminder";
      jitKey: string;
      title: string;
      repo: string;
      issueNumber: number;
      dueAt: Date;
    };
    type GeneratedMergePr = {
      kind: "merge-pr";
      title: string;
      repo: string;
      issueNumber: number;
      prTitle: string;
      prUrl: string;
      prNumber: number;
      prRepo: string;
    };
    type GeneratedItem = GeneratedReminder | GeneratedMergePr;

    let items: GeneratedItem[];
    let reminders: GeneratedReminder[];
    let now: number;

    beforeAll(() => {
      now = Date.now();
      const body = moduleCode!.replace("export default", "return");
      items = new Function(body)() as GeneratedItem[];
      reminders = items.filter((i): i is GeneratedReminder => i.kind === "reminder");
    });

    it("returns an array of items", () => {
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
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

    it("includes exactly one merge-pr item with correct fields and no dueAt", () => {
      const mergePrItems = items.filter((i): i is GeneratedMergePr => i.kind === "merge-pr");
      expect(mergePrItems.length).toBe(1);
      const mp = mergePrItems[0];
      expect(typeof mp.prTitle).toBe("string");
      expect(mp.prTitle.length).toBeGreaterThan(0);
      expect(typeof mp.prUrl).toBe("string");
      expect(mp.prUrl.startsWith("https://github.com/")).toBe(true);
      expect(typeof mp.prNumber).toBe("number");
      expect(mp.prNumber).toBeGreaterThan(0);
      expect(typeof mp.prRepo).toBe("string");
      expect(mp.prRepo.length).toBeGreaterThan(0);
      expect((mp as unknown as { dueAt?: unknown }).dueAt).toBeUndefined();
    });
  });
});
