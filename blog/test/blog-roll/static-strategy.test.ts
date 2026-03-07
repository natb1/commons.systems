import { describe, it, expect } from "vitest";
import { StaticStrategy } from "../../src/blog-roll/static-strategy";

describe("StaticStrategy", () => {
  it("returns the configured post", async () => {
    const post = { title: "Test Post", url: "https://example.com/post" };
    const strategy = new StaticStrategy(post);
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual(post);
  });
});
