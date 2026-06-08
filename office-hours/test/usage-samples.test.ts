import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { toUsageSample, usageSampleToDoc, type UsageSample } from "../src/usage-samples.js";

const baseSample: UsageSample = {
  sampledAt: new Date("2026-06-07T10:00:00Z"),
  fiveHourUsedPct: 42.5,
  weeklyUsedPct: 18.3,
  fiveHourResetsAt: new Date("2026-06-07T15:00:00Z"),
  weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
  activeWorkers: 3,
  targetWorkers: 4,
  groupId: "group-abc",
};

const memberEmails = ["alice@example.com", "bob@example.com"];

describe("usageSampleToDoc / toUsageSample round-trip", () => {
  it("round-trips a UsageSample through doc and back", () => {
    const doc = usageSampleToDoc(baseSample, memberEmails);
    const result = toUsageSample("auto-id", doc);

    expect(result).not.toBeNull();
    if (result === null) return;

    expect(result.sampledAt.getTime()).toBe(baseSample.sampledAt.getTime());
    expect(result.fiveHourResetsAt.getTime()).toBe(baseSample.fiveHourResetsAt.getTime());
    expect(result.weeklyResetsAt.getTime()).toBe(baseSample.weeklyResetsAt.getTime());
    expect(result.fiveHourUsedPct).toBe(baseSample.fiveHourUsedPct);
    expect(result.weeklyUsedPct).toBe(baseSample.weeklyUsedPct);
    expect(result.activeWorkers).toBe(baseSample.activeWorkers);
    expect(result.targetWorkers).toBe(baseSample.targetWorkers);
    expect(result.groupId).toBe(baseSample.groupId);
    // memberEmails is an auth field stripped from the client-facing struct.
    expect(result).not.toHaveProperty("memberEmails");
  });
});

describe("toUsageSample malformed-doc cases", () => {
  const validDoc = usageSampleToDoc(baseSample, memberEmails);

  it("returns null when sampledAt is missing", () => {
    const doc = { ...validDoc, sampledAt: undefined };
    expect(toUsageSample("auto-id", doc)).toBeNull();
  });

  it("returns null when fiveHourUsedPct is the wrong type", () => {
    const doc = { ...validDoc, fiveHourUsedPct: "not-a-number" };
    expect(toUsageSample("auto-id", doc)).toBeNull();
  });

  it("returns null when memberEmails is not an array", () => {
    const doc = { ...validDoc, memberEmails: "alice@example.com" };
    expect(toUsageSample("auto-id", doc)).toBeNull();
  });
});
