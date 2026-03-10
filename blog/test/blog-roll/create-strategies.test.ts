import { describe, it, expect } from "vitest";
import { createStrategies } from "../../src/blog-roll/types";
import type { BlogRollConfig } from "../../src/blog-roll/types";
import { StaticStrategy } from "../../src/blog-roll/static-strategy";

const strategy = new StaticStrategy({
  title: "Test",
  url: "https://example.com",
  publishedAt: "2026-01-01",
});

describe("createStrategies", () => {
  it("builds a map keyed by entry id", () => {
    const configs: BlogRollConfig[] = [
      { entry: { id: "a", name: "A", url: "https://a.com" }, strategy },
      { entry: { id: "b", name: "B", url: "https://b.com" }, strategy },
    ];
    const map = createStrategies(configs);
    expect(map.size).toBe(2);
    expect(map.has("a")).toBe(true);
    expect(map.has("b")).toBe(true);
  });

  it("throws on duplicate entry ids", () => {
    const configs: BlogRollConfig[] = [
      { entry: { id: "dup", name: "A", url: "https://a.com" }, strategy },
      { entry: { id: "dup", name: "B", url: "https://b.com" }, strategy },
    ];
    expect(() => createStrategies(configs)).toThrow(
      'Duplicate blog roll entry id: "dup"',
    );
  });

  it("returns an empty map for empty config", () => {
    expect(createStrategies([]).size).toBe(0);
  });
});
