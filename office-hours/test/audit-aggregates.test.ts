import { describe, it, expect } from "vitest";
import {
  toAuditAggregate,
  auditAggregateToDoc,
  type AuditAggregate,
} from "../src/audit-aggregates.js";

const baseAggregate: AuditAggregate = {
  computedAt: new Date("2026-06-07T10:00:00Z"),
  windowDays: 1,
  groupId: "group-abc",
  phaseSpend: {
    "plan-implement": 5.5,
    "review-fix": 3.2,
    "dispatch-worker": 4.1,
  },
  cacheRead: 3_000_000,
  cacheCreation: 1_000_000,
};

const memberEmails = ["alice@example.com", "bob@example.com"];

const make = (o: Partial<AuditAggregate> = {}): AuditAggregate => ({ ...baseAggregate, ...o });

describe("auditAggregateToDoc / toAuditAggregate round-trip", () => {
  it("round-trips an AuditAggregate through doc and back", () => {
    const doc = auditAggregateToDoc(baseAggregate, memberEmails);
    const result = toAuditAggregate("auto-id", doc);

    expect(result).not.toBeNull();
    if (result === null) return;

    expect(result.computedAt.getTime()).toBe(baseAggregate.computedAt.getTime());
    expect(result.windowDays).toBe(baseAggregate.windowDays);
    expect(result.groupId).toBe(baseAggregate.groupId);
    expect(result.phaseSpend).toEqual(baseAggregate.phaseSpend);
    expect(result.cacheRead).toBe(baseAggregate.cacheRead);
    expect(result.cacheCreation).toBe(baseAggregate.cacheCreation);
    // memberEmails is an auth field stripped from the client-facing struct.
    expect(result).not.toHaveProperty("memberEmails");
  });

  it("accepts an empty phaseSpend object", () => {
    const doc = auditAggregateToDoc(make({ phaseSpend: {} }), memberEmails);
    const result = toAuditAggregate("auto-id", doc);
    expect(result).not.toBeNull();
    expect(result?.phaseSpend).toEqual({});
  });
});

describe("toAuditAggregate malformed-doc cases", () => {
  const validDoc = auditAggregateToDoc(baseAggregate, memberEmails);

  it("returns null when computedAt is missing", () => {
    const doc = { ...validDoc, computedAt: undefined };
    expect(toAuditAggregate("auto-id", doc)).toBeNull();
  });

  it("returns null when windowDays is the wrong type", () => {
    const doc = { ...validDoc, windowDays: "not-a-number" };
    expect(toAuditAggregate("auto-id", doc)).toBeNull();
  });

  it("returns null when groupId is the wrong type", () => {
    const doc = { ...validDoc, groupId: 42 };
    expect(toAuditAggregate("auto-id", doc)).toBeNull();
  });

  it("returns null when cacheRead is the wrong type", () => {
    const doc = { ...validDoc, cacheRead: "lots" };
    expect(toAuditAggregate("auto-id", doc)).toBeNull();
  });

  it("returns null when cacheCreation is missing", () => {
    const doc = { ...validDoc, cacheCreation: undefined };
    expect(toAuditAggregate("auto-id", doc)).toBeNull();
  });

  it("returns null when memberEmails is not an array", () => {
    const doc = { ...validDoc, memberEmails: "alice@example.com" };
    expect(toAuditAggregate("auto-id", doc)).toBeNull();
  });

  it("returns null when phaseSpend is missing", () => {
    const doc = { ...validDoc, phaseSpend: undefined };
    expect(toAuditAggregate("auto-id", doc)).toBeNull();
  });

  it("returns null when phaseSpend has a non-number value", () => {
    const doc = { ...validDoc, phaseSpend: { "plan-implement": "free" } };
    expect(toAuditAggregate("auto-id", doc)).toBeNull();
  });

  it("returns null when phaseSpend is an array", () => {
    const doc = { ...validDoc, phaseSpend: [1, 2, 3] };
    expect(toAuditAggregate("auto-id", doc)).toBeNull();
  });
});
