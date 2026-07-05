import { describe, it, expect } from "vitest";

import { getDemoSamples } from "../src/usage-data.js";

describe("getDemoSamples", () => {
  it("returns the bundled seed samples", () => {
    const samples = getDemoSamples();
    expect(Array.isArray(samples)).toBe(true);
    expect(samples.length).toBeGreaterThan(0);
  });
});
