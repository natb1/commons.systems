import { describe, it, expect } from "vitest";
import { toIssueSample, issueSampleToDoc, type IssueSample } from "../src/issue-samples.js";

const baseSample: IssueSample = {
  sampledAt: new Date("2026-06-07T10:00:00Z"),
  openHelpWanted: 12,
  openOther: 30,
  groupId: "group-abc",
};

const memberEmails = ["alice@example.com", "bob@example.com"];

describe("issueSampleToDoc / toIssueSample round-trip", () => {
  it("round-trips an IssueSample through doc and back", () => {
    const doc = issueSampleToDoc(baseSample, memberEmails);
    const result = toIssueSample("auto-id", doc);

    expect(result).not.toBeNull();
    if (result === null) return;

    expect(result.sampledAt.getTime()).toBe(baseSample.sampledAt.getTime());
    expect(result.openHelpWanted).toBe(baseSample.openHelpWanted);
    expect(result.openOther).toBe(baseSample.openOther);
    expect(result.groupId).toBe(baseSample.groupId);
    // memberEmails is an auth field stripped from the client-facing struct.
    expect(result).not.toHaveProperty("memberEmails");
  });
});

describe("toIssueSample malformed-doc cases", () => {
  const validDoc = issueSampleToDoc(baseSample, memberEmails);

  it("returns null when sampledAt is missing", () => {
    const doc = { ...validDoc, sampledAt: undefined };
    expect(toIssueSample("auto-id", doc)).toBeNull();
  });

  it("returns null when openHelpWanted is the wrong type", () => {
    const doc = { ...validDoc, openHelpWanted: "not-a-number" };
    expect(toIssueSample("auto-id", doc)).toBeNull();
  });

  it("returns null when memberEmails is not an array", () => {
    const doc = { ...validDoc, memberEmails: "alice@example.com" };
    expect(toIssueSample("auto-id", doc)).toBeNull();
  });
});
