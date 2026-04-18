import { describe, it, expect } from "vitest";
import { APPS, DEPENDENCIES } from "../src/site-config";

describe("APPS", () => {
  it("has exactly 3 entries with names Budget, Audio, Print", () => {
    expect(APPS).toHaveLength(3);
    expect(APPS.map((a) => a.name)).toEqual(["Budget", "Audio", "Print"]);
  });

  it("all urls are on commons.systems subdomains", () => {
    const expected = [
      "https://budget.commons.systems",
      "https://audio.commons.systems",
      "https://print.commons.systems",
    ];
    expect(APPS.map((a) => a.url)).toEqual(expected);
    for (const app of APPS) {
      expect(app.url).toMatch(/^https:\/\/[a-z]+\.commons\.systems/);
    }
  });

  it("all entries have non-empty problem, screenshotAlt, and screenshot starting with /screenshots/", () => {
    for (const app of APPS) {
      expect(app.problem.length).toBeGreaterThan(0);
      expect(app.screenshotAlt.length).toBeGreaterThan(0);
      expect(app.screenshot.startsWith("/screenshots/")).toBe(true);
    }
  });

  it("all screenshots end with .png", () => {
    for (const app of APPS) {
      expect(app.screenshot.endsWith(".png")).toBe(true);
    }
  });
});

describe("DEPENDENCIES", () => {
  it("has at least 4 entries", () => {
    expect(DEPENDENCIES.length).toBeGreaterThanOrEqual(4);
  });

  it("all entries have non-empty strings for every field", () => {
    for (const dep of DEPENDENCIES) {
      expect(typeof dep.name).toBe("string");
      expect(dep.name.length).toBeGreaterThan(0);
      expect(typeof dep.solves).toBe("string");
      expect(dep.solves.length).toBeGreaterThan(0);
      expect(typeof dep.classification).toBe("string");
      expect(dep.classification.length).toBeGreaterThan(0);
      expect(typeof dep.exitPath).toBe("string");
      expect(dep.exitPath.length).toBeGreaterThan(0);
      expect(typeof dep.ratchetRisk).toBe("string");
      expect(dep.ratchetRisk.length).toBeGreaterThan(0);
    }
  });
});
