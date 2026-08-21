import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { selectLatestSample, toUsageSample, usageSampleToDoc, type UsageSample } from "../src/usage-samples.js";

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

const make = (o: Partial<UsageSample> = {}): UsageSample => ({ ...baseSample, ...o });

describe("selectLatestSample", () => {
  it("returns null for an empty array", () => {
    expect(selectLatestSample([])).toBeNull();
  });

  it("returns the sample with the maximum sampledAt from an unordered array", () => {
    const a = make({ sampledAt: new Date("2026-06-07T08:00:00Z") });
    const b = make({ sampledAt: new Date("2026-06-07T12:00:00Z") });
    const c = make({ sampledAt: new Date("2026-06-07T10:00:00Z") });
    const samples = [a, b, c];

    const result = selectLatestSample(samples);
    expect(result).toBe(b);
  });

  it("does not mutate the input array", () => {
    const a = make({ sampledAt: new Date("2026-06-07T08:00:00Z") });
    const b = make({ sampledAt: new Date("2026-06-07T12:00:00Z") });
    const c = make({ sampledAt: new Date("2026-06-07T10:00:00Z") });
    const samples = [a, b, c];
    const originalRefs = samples.map((s) => s);

    selectLatestSample(samples);

    // Input array order is unchanged
    expect(samples[0]).toBe(originalRefs[0]);
    expect(samples[1]).toBe(originalRefs[1]);
    expect(samples[2]).toBe(originalRefs[2]);
  });
});

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

  /** validDoc with the denormalized auth field removed (the snapshot-wire shape). */
  function docWithoutMemberEmails(): Record<string, unknown> {
    const doc = { ...validDoc };
    delete doc.memberEmails;
    return doc;
  }

  it("returns null when memberEmails is absent (strict Firestore default)", () => {
    expect(toUsageSample("auto-id", docWithoutMemberEmails())).toBeNull();
  });

  it("accepts an absent memberEmails under requireMemberEmails:false (snapshot wire)", () => {
    // The offline snapshot deliberately omits the group ACL; the decoder opts
    // out of the auth-field requirement, and the field is dropped either way.
    const result = toUsageSample("auto-id", docWithoutMemberEmails(), {
      requireMemberEmails: false,
    });
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("memberEmails");
  });
});
