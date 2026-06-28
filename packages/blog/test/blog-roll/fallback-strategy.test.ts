import { describe, it, expect } from "vitest";
import { FallbackStrategy } from "../../src/blog-roll/fallback-strategy";
import type { BlogRollStrategy, LatestPost } from "../../src/blog-roll/types";

function stubStrategy(result: LatestPost | null): BlogRollStrategy {
  return { fetchLatestPost: () => Promise.resolve(result) };
}

const FALLBACK_POST: LatestPost = {
  title: "Fallback Post",
  url: "https://example.com/fallback",
  publishedAt: "2026-01-01T00:00:00Z",
};

const PRIMARY_POST: LatestPost = {
  title: "Primary Post",
  url: "https://example.com/primary",
  publishedAt: "2026-02-01T00:00:00Z",
};

describe("FallbackStrategy", () => {
  it("returns primary result when primary returns data", async () => {
    const strategy = new FallbackStrategy(stubStrategy(PRIMARY_POST), FALLBACK_POST);
    const result = await strategy.fetchLatestPost();
    expect(result).toEqual(PRIMARY_POST);
  });

  it("returns fallback data when primary returns null", async () => {
    const strategy = new FallbackStrategy(stubStrategy(null), FALLBACK_POST);
    const result = await strategy.fetchLatestPost();
    expect(result).toEqual(FALLBACK_POST);
  });

  it("returns null when both primary returns null and fallback is null", async () => {
    const strategy = new FallbackStrategy(stubStrategy(null), null);
    const result = await strategy.fetchLatestPost();
    expect(result).toBeNull();
  });

  it("returns fallback data when primary throws", async () => {
    const throwing: BlogRollStrategy = {
      fetchLatestPost: () => Promise.reject(new Error("network error")),
    };
    const strategy = new FallbackStrategy(throwing, FALLBACK_POST);
    const result = await strategy.fetchLatestPost();
    expect(result).toEqual(FALLBACK_POST);
  });

  it("rethrows when primary throws and fallback is null", async () => {
    const throwing: BlogRollStrategy = {
      fetchLatestPost: () => Promise.reject(new Error("network error")),
    };
    const strategy = new FallbackStrategy(throwing, null);
    await expect(strategy.fetchLatestPost()).rejects.toThrow("network error");
  });
});
