import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { assertLegStateTransition } from "../src/firestore";

describe("assertLegStateTransition", () => {
  it("allows uncleared → cleared", () => {
    expect(() => assertLegStateTransition({ cleared: false, reconciledAt: null }, true)).not.toThrow();
  });

  it("allows cleared → uncleared", () => {
    expect(() => assertLegStateTransition({ cleared: true, reconciledAt: null }, false)).not.toThrow();
  });

  it("rejects clearing a reconciled leg (reconciled is terminal)", () => {
    const reconciledAt = Timestamp.fromDate(new Date("2025-03-15"));
    expect(() => assertLegStateTransition({ cleared: true, reconciledAt }, true)).toThrow(/reconciled/i);
    expect(() => assertLegStateTransition({ cleared: true, reconciledAt }, false)).toThrow(/reconciled/i);
  });
});
