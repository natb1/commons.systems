import { describe, it, expect } from "vitest";
import { APPS, OVERFLOW_APPS } from "../src/site-config";

describe("APPS", () => {
  it("has exactly 3 primary entries with names Office-hours, Budget, Print", () => {
    expect(APPS).toHaveLength(3);
    expect(APPS.map((a) => a.name)).toEqual(["Office-hours", "Budget", "Print"]);
  });

  it("all urls are on commons.systems subdomains", () => {
    const expected = [
      "https://office-hours.commons.systems",
      "https://budget.commons.systems",
      "https://print.commons.systems",
    ];
    expect(APPS.map((a) => a.url)).toEqual(expected);
    for (const app of APPS) {
      expect(app.url).toMatch(/^https:\/\/[a-z][a-z-]*\.commons\.systems/);
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

describe("OVERFLOW_APPS", () => {
  it("has exactly 1 entry: Audio", () => {
    expect(OVERFLOW_APPS).toHaveLength(1);
    expect(OVERFLOW_APPS[0].name).toBe("Audio");
    expect(OVERFLOW_APPS[0].url).toBe("https://audio.commons.systems");
  });

  it("OVERFLOW_APPS entries satisfy the same invariants", () => {
    for (const app of OVERFLOW_APPS) {
      expect(app.problem.length).toBeGreaterThan(0);
      expect(app.screenshotAlt.length).toBeGreaterThan(0);
      expect(app.screenshot.startsWith("/screenshots/")).toBe(true);
      expect(app.screenshot.endsWith(".png")).toBe(true);
    }
  });
});
