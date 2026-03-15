import { describe, it, expect } from "vitest";
import { FEED_REGISTRY } from "../../src/blog-roll/feed-registry";

describe("FEED_REGISTRY", () => {
  it("does not contain half-a-worm", () => {
    const ids = FEED_REGISTRY.map((e) => e.id);
    expect(ids).not.toContain("half-a-worm");
  });
});
