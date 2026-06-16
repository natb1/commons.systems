import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { toIssueSample, issueSampleToDoc, type IssueSample } from "../src/issue-samples.js";

const baseSample: IssueSample = {
  sampledAt: new Date("2026-06-07T10:00:00Z"),
  openSecurity: 2,
  openBug: 12,
  openEnhancement: 10,
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
    expect(result.openSecurity).toBe(baseSample.openSecurity);
    expect(result.openBug).toBe(baseSample.openBug);
    expect(result.openEnhancement).toBe(baseSample.openEnhancement);
    expect(result.openOther).toBe(baseSample.openOther);
    expect(result.groupId).toBe(baseSample.groupId);
    // memberEmails is an auth field stripped from the client-facing struct.
    expect(result).not.toHaveProperty("memberEmails");
  });
});

describe("toIssueSample old-format migration", () => {
  it("folds a pre-#1828 openHelpWanted/openOther doc into openOther", () => {
    // Old-format doc: openHelpWanted + openOther, none of the four new fields.
    const oldDoc: Record<string, unknown> = {
      sampledAt: Timestamp.fromDate(new Date("2026-06-07T10:00:00Z")),
      openHelpWanted: 12,
      openOther: 30,
      groupId: "group-abc",
      memberEmails,
    };
    const result = toIssueSample("auto-id", oldDoc);

    expect(result).not.toBeNull();
    if (result === null) return;

    expect(result.openSecurity).toBe(0);
    expect(result.openBug).toBe(0);
    expect(result.openEnhancement).toBe(0);
    // Old total folded into the new openOther bucket.
    expect(result.openOther).toBe(42);
    expect(result.groupId).toBe("group-abc");
  });
});

describe("toIssueSample malformed-doc cases", () => {
  const validDoc = issueSampleToDoc(baseSample, memberEmails);

  it("returns null when sampledAt is missing", () => {
    const doc = { ...validDoc, sampledAt: undefined };
    expect(toIssueSample("auto-id", doc)).toBeNull();
  });

  it("returns null when openSecurity is the wrong type", () => {
    const doc = { ...validDoc, openSecurity: "not-a-number" };
    expect(toIssueSample("auto-id", doc)).toBeNull();
  });

  it("returns null when memberEmails is not an array", () => {
    const doc = { ...validDoc, memberEmails: "alice@example.com" };
    expect(toIssueSample("auto-id", doc)).toBeNull();
  });
});
