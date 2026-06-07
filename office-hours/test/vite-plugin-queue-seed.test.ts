import { describe, it, expect, beforeAll } from "vitest";
import { officeHoursQueueSeedPlugin } from "../src/vite-plugin-queue-seed";
import type { Plugin } from "vite";

describe("officeHoursQueueSeedPlugin", () => {
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
    plugin = officeHoursQueueSeedPlugin();
    (plugin.buildStart as () => void)();
    resolvedId = resolveId("virtual:office-hours-queue-seed");
    moduleCode = resolvedId ? load(resolvedId) : undefined;
  });

  it("resolves the virtual module ID", () => {
    expect(resolvedId).toBeDefined();
    expect(resolvedId).toBe("\0virtual:office-hours-queue-seed");
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

  describe("generated snapshot", () => {
    let snapshot: {
      openHelpWanted: number;
      closedPerDay: number;
      createdPerDay: number;
      netDrainPerDay: number;
      runwayDays: number | null;
      windowDays: number;
      computedAt: Date;
      groupId: string;
      memberEmails: string[];
    };
    let now: number;

    beforeAll(() => {
      now = Date.now();
      const body = moduleCode!.replace("export default", "return");
      snapshot = new Function(body)() as typeof snapshot;
    });

    it("openHelpWanted is a number", () => {
      expect(typeof snapshot.openHelpWanted).toBe("number");
    });

    it("closedPerDay is a number", () => {
      expect(typeof snapshot.closedPerDay).toBe("number");
    });

    it("createdPerDay is a number", () => {
      expect(typeof snapshot.createdPerDay).toBe("number");
    });

    it("netDrainPerDay is a number", () => {
      expect(typeof snapshot.netDrainPerDay).toBe("number");
    });

    it("windowDays is a number and equals 14", () => {
      expect(typeof snapshot.windowDays).toBe("number");
      expect(snapshot.windowDays).toBe(14);
    });

    it("runwayDays is a number or null", () => {
      expect(snapshot.runwayDays === null || typeof snapshot.runwayDays === "number").toBe(true);
    });

    it("groupId is a string", () => {
      expect(typeof snapshot.groupId).toBe("string");
    });

    it("memberEmails is an array", () => {
      expect(Array.isArray(snapshot.memberEmails)).toBe(true);
    });

    it("computedAt is a Date in the recent past", () => {
      expect(snapshot.computedAt).toBeInstanceOf(Date);
      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(snapshot.computedAt.getTime()).toBeLessThanOrEqual(now);
      expect(snapshot.computedAt.getTime()).toBeGreaterThan(now - oneDayMs);
    });

    it("does not expose computedAtMinutesAgo", () => {
      expect((snapshot as Record<string, unknown>).computedAtMinutesAgo).toBeUndefined();
    });
  });
});
