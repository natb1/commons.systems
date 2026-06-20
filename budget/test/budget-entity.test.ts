import { describe, it, expect, vi } from "vitest";
import { timestampMockFactory } from "./helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

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

  it("throws RangeError for two overrides in strictly descending order", () => {
    const overrides: BudgetOverride[] = [
      { date: Timestamp.fromMillis(2000), balance: 100 },
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

  it("does not throw for three overrides in strictly ascending order", () => {
    const overrides: BudgetOverride[] = [
      { date: Timestamp.fromMillis(1000), balance: 100 },
      { date: Timestamp.fromMillis(2000), balance: 200 },
      { date: Timestamp.fromMillis(3000), balance: 300 },
    ];
    expect(() => validateBudgetOverrideOrdering(overrides)).not.toThrow();
  });

  it("throws RangeError when a three-element array violates ordering at index 2 (descending)", () => {
    const overrides: BudgetOverride[] = [
      { date: Timestamp.fromMillis(1000), balance: 100 },
      { date: Timestamp.fromMillis(2000), balance: 200 },
      { date: Timestamp.fromMillis(1500), balance: 300 },
    ];
    expect(() => validateBudgetOverrideOrdering(overrides)).toThrow(RangeError);
  });

  it("throws RangeError when a three-element array has an equal-timestamp violation at index 2", () => {
    const overrides: BudgetOverride[] = [
      { date: Timestamp.fromMillis(1000), balance: 100 },
      { date: Timestamp.fromMillis(2000), balance: 200 },
      { date: Timestamp.fromMillis(2000), balance: 300 },
    ];
    expect(() => validateBudgetOverrideOrdering(overrides)).toThrow(RangeError);
  });
});
