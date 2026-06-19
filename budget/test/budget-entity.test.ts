import { describe, it, expect, vi } from "vitest";

vi.mock("firebase/firestore", () => {
  class MockTimestamp {
    constructor(
      public readonly seconds: number,
      public readonly nanoseconds: number,
    ) {}
    toMillis() {
      return this.seconds * 1000 + this.nanoseconds / 1e6;
    }
    static fromMillis(ms: number) {
      return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
    }
  }
  return { Timestamp: MockTimestamp };
});

import {
  validateBudgetOverrideOrdering,
  type BudgetOverride,
} from "../src/entities/budget";
import { Timestamp } from "firebase/firestore";

describe("validateBudgetOverrideOrdering", () => {
  it("does not throw for an empty array", () => {
    expect(() => validateBudgetOverrideOrdering([])).not.toThrow();
  });

  it("does not throw for a single-element array", () => {
    const overrides: BudgetOverride[] = [
      { date: Timestamp.fromMillis(1000), balance: 100 },
    ];
    expect(() => validateBudgetOverrideOrdering(overrides)).not.toThrow();
  });

  it("throws RangeError for two overrides with equal timestamps", () => {
    const overrides: BudgetOverride[] = [
      { date: Timestamp.fromMillis(1000), balance: 100 },
      { date: Timestamp.fromMillis(1000), balance: 200 },
    ];
    expect(() => validateBudgetOverrideOrdering(overrides)).toThrow(RangeError);
  });

  it("does not throw for two overrides in strictly ascending order", () => {
    const overrides: BudgetOverride[] = [
      { date: Timestamp.fromMillis(1000), balance: 100 },
      { date: Timestamp.fromMillis(2000), balance: 200 },
    ];
    expect(() => validateBudgetOverrideOrdering(overrides)).not.toThrow();
  });
});
