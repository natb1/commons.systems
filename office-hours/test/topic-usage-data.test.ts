import { describe, it, expect } from "vitest";

import { getDemoTopicUsage } from "../src/topic-usage-data.js";

describe("getDemoTopicUsage", () => {
  it("returns an empty array (demo tier is unauthenticated)", () => {
    expect(getDemoTopicUsage()).toEqual([]);
  });
});
