import { describe, it, expect } from "vitest";
import { getDemoIssueSamples } from "../src/issue-data.js";

describe("getDemoIssueSamples", () => {
  const samples = getDemoIssueSamples();

  it("returns a non-empty array of ~14 samples", () => {
    expect(Array.isArray(samples)).toBe(true);
    expect(samples.length).toBeGreaterThanOrEqual(12);
    expect(samples.length).toBeLessThanOrEqual(16);
  });

  it("every sample has the correct fields with correct types and no auth field", () => {
    for (const s of samples) {
      expect(s.sampledAt).toBeInstanceOf(Date);
      expect(typeof s.openSecurity).toBe("number");
      expect(typeof s.openBug).toBe("number");
      expect(typeof s.openEnhancement).toBe("number");
      expect(typeof s.openOther).toBe("number");
      expect(typeof s.groupId).toBe("string");
      // memberEmails is an auth field that must never reach the public bundle.
      expect(s).not.toHaveProperty("memberEmails");
    }
  });

  it("renders a shrinking backlog (most-recent total < oldest total)", () => {
    const oldest = samples.reduce((a, b) =>
      a.sampledAt.getTime() < b.sampledAt.getTime() ? a : b
    );
    const mostRecent = samples.reduce((a, b) =>
      a.sampledAt.getTime() > b.sampledAt.getTime() ? a : b
    );
    const oldestTotal =
      oldest.openSecurity + oldest.openBug + oldest.openEnhancement + oldest.openOther;
    const recentTotal =
      mostRecent.openSecurity + mostRecent.openBug + mostRecent.openEnhancement + mostRecent.openOther;
    expect(recentTotal).toBeLessThan(oldestTotal);
  });
});
