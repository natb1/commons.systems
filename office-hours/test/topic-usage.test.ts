import { describe, it, expect } from "vitest";
import { toTopicUsage, type TopicUsageDoc } from "../src/topic-usage.js";

const validBucket = {
  priceProxyUsd: 0.05,
  input: 1000,
  cacheRead: 500,
  cacheCreation: 200,
  output: 300,
};

const validDoc: TopicUsageDoc = {
  date: "2026-06-29",
  byTopic: {
    dispatch: { ...validBucket },
    other: { ...validBucket, priceProxyUsd: 0.01 },
  },
  byType: {
    bug: { ...validBucket },
    enhancement: { ...validBucket },
    none: { ...validBucket },
  },
};

// Build a raw doc shape that toTopicUsage should accept
const makeRaw = (overrides: Partial<TopicUsageDoc> = {}): Record<string, unknown> => ({
  ...validDoc,
  ...overrides,
});

describe("toTopicUsage accepts a valid doc", () => {
  it("returns a TopicUsageDoc with the expected fields", () => {
    const result = toTopicUsage(makeRaw());

    expect(result).not.toBeNull();
    if (result === null) return;

    expect(result.date).toBe("2026-06-29");
    expect(result.byTopic.dispatch.priceProxyUsd).toBe(0.05);
    expect(result.byType.bug.output).toBe(300);
    // Firestore auth field must never be surfaced
    expect(result).not.toHaveProperty("memberEmails");
    expect(result).not.toHaveProperty("computedAt");
    expect(result).not.toHaveProperty("groupId");
  });

  it("accepts an empty byTopic / byType object", () => {
    const result = toTopicUsage(makeRaw({ byTopic: {}, byType: {} }));
    expect(result).not.toBeNull();
    expect(result?.byTopic).toEqual({});
    expect(result?.byType).toEqual({});
  });
});

describe("toTopicUsage returns null for malformed docs", () => {
  it("returns null when the input is not an object", () => {
    expect(toTopicUsage("not-an-object")).toBeNull();
    expect(toTopicUsage(null)).toBeNull();
    expect(toTopicUsage(42)).toBeNull();
    expect(toTopicUsage([])).toBeNull();
  });

  it("returns null when date is not a string", () => {
    expect(toTopicUsage(makeRaw({ date: 20260629 as unknown as string }))).toBeNull();
  });

  it("returns null when date is missing", () => {
    const raw = makeRaw();
    delete (raw as Record<string, unknown>).date;
    expect(toTopicUsage(raw)).toBeNull();
  });

  it("returns null when byTopic is not an object", () => {
    expect(toTopicUsage(makeRaw({ byTopic: "dispatch" as unknown as Record<string, never> }))).toBeNull();
  });

  it("returns null when byTopic is an array", () => {
    expect(toTopicUsage(makeRaw({ byTopic: [] as unknown as Record<string, never> }))).toBeNull();
  });

  it("returns null when byType is missing", () => {
    const raw = makeRaw();
    delete (raw as Record<string, unknown>).byType;
    expect(toTopicUsage(raw)).toBeNull();
  });

  it("returns null when a bucket has a non-numeric field", () => {
    const raw = makeRaw({
      byTopic: {
        dispatch: { ...validBucket, priceProxyUsd: "expensive" as unknown as number },
      },
    });
    expect(toTopicUsage(raw)).toBeNull();
  });

  it("returns null when a bucket is missing a required field", () => {
    const incompleteBucket = {
      priceProxyUsd: 0.05,
      input: 1000,
      // cacheRead missing
      cacheCreation: 200,
      output: 300,
    };
    const raw = makeRaw({
      byTopic: { dispatch: incompleteBucket as unknown as typeof validBucket },
    });
    expect(toTopicUsage(raw)).toBeNull();
  });

  it("returns null when a bucket value is itself not an object", () => {
    const raw = makeRaw({
      byTopic: { dispatch: 42 as unknown as typeof validBucket },
    });
    expect(toTopicUsage(raw)).toBeNull();
  });
});
