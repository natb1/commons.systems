import { describe, it, expect, vi } from "vitest";
import { timestampMockFactory } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { applyRollingAverage } from "../../src/pages/budgets-hydrate";
import type { PerBudgetPoint } from "../../src/balance";

function makePoint(budget: string, weekMs: number, spending: number): PerBudgetPoint {
  return { weekLabel: new Date(weekMs).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }), weekMs, budget, spending };
}

const W1 = new Date("2025-01-05").getTime();
const W2 = new Date("2025-01-12").getTime();
const W3 = new Date("2025-01-19").getTime();
const W4 = new Date("2025-01-26").getTime();

describe("applyRollingAverage", () => {
  it("windowSize=1 returns raw values", () => {
    const data = [makePoint("Food", W1, 100), makePoint("Food", W2, 200)];
    const result = applyRollingAverage(data, 1);
    expect(result.map(r => r.spending)).toEqual([100, 200]);
  });

  it("windowSize=3 returns correct trailing averages", () => {
    const data = [
      makePoint("Food", W1, 30),
      makePoint("Food", W2, 60),
      makePoint("Food", W3, 90),
      makePoint("Food", W4, 120),
    ];
    const result = applyRollingAverage(data, 3);
    // Window 1: avg(30) = 30
    // Window 2: avg(30,60) = 45
    // Window 3: avg(30,60,90) = 60
    // Window 4: avg(60,90,120) = 90
    expect(result.map(r => r.spending)).toEqual([30, 45, 60, 90]);
  });

  it("multiple budgets averaged independently", () => {
    const data = [
      makePoint("Food", W1, 100),
      makePoint("Food", W2, 200),
      makePoint("Fun", W1, 10),
      makePoint("Fun", W2, 20),
    ];
    const result = applyRollingAverage(data, 2);
    const food = result.filter(r => r.budget === "Food");
    const fun = result.filter(r => r.budget === "Fun");
    // Food: avg(100)=100, avg(100,200)=150
    expect(food.map(r => r.spending)).toEqual([100, 150]);
    // Fun: avg(10)=10, avg(10,20)=15
    expect(fun.map(r => r.spending)).toEqual([10, 15]);
  });

  it("preserves weekLabel and weekMs", () => {
    const data = [makePoint("Food", W1, 100)];
    const result = applyRollingAverage(data, 3);
    expect(result[0].weekLabel).toBe(data[0].weekLabel);
    expect(result[0].weekMs).toBe(W1);
    expect(result[0].budget).toBe("Food");
  });
});
