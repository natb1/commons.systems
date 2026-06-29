import { describe, it, expect } from "vitest";
import { PROJECTS, OVERFLOW_PROJECTS } from "../src/site-config";

describe("PROJECTS", () => {
  it("has exactly 3 primary entries with names Office-hours, Budget, Print", () => {
    expect(PROJECTS).toHaveLength(3);
    expect(PROJECTS.map((a) => a.name)).toEqual(["Office-hours", "Budget", "Print"]);
  });

  it("all urls are on commons.systems subdomains", () => {
    const expected = [
      "https://office-hours.commons.systems",
      "https://budget.commons.systems",
      "https://print.commons.systems",
    ];
    expect(PROJECTS.map((a) => a.url)).toEqual(expected);
    for (const app of PROJECTS) {
      expect(app.url).toMatch(/^https:\/\/[a-z]([a-z0-9-]*[a-z0-9])?\.commons\.systems/);
    }
  });

  it("all entries have non-empty problem, screenshotAlt, and screenshot starting with /screenshots/", () => {
    for (const app of PROJECTS) {
      expect(app.problem.length).toBeGreaterThan(0);
      expect(app.screenshotAlt.length).toBeGreaterThan(0);
      expect(app.screenshot.startsWith("/screenshots/")).toBe(true);
    }
  });

  it("all screenshots end with .png", () => {
    for (const app of PROJECTS) {
      expect(app.screenshot.endsWith(".png")).toBe(true);
    }
  });
});

describe("OVERFLOW_PROJECTS", () => {
  it("has exactly 1 entry: Audio", () => {
    expect(OVERFLOW_PROJECTS).toHaveLength(1);
    expect(OVERFLOW_PROJECTS[0].name).toBe("Audio");
    expect(OVERFLOW_PROJECTS[0].url).toBe("https://audio.commons.systems");
  });

  it("OVERFLOW_PROJECTS entries satisfy the same invariants", () => {
    for (const app of OVERFLOW_PROJECTS) {
      expect(app.url).toMatch(/^https:\/\/[a-z]([a-z0-9-]*[a-z0-9])?\.commons\.systems/);
      expect(app.problem.length).toBeGreaterThan(0);
      expect(app.screenshotAlt.length).toBeGreaterThan(0);
      expect(app.screenshot.startsWith("/screenshots/")).toBe(true);
      expect(app.screenshot.endsWith(".png")).toBe(true);
    }
  });
});
