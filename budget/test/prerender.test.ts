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
    toDate() {
      return new Date(this.toMillis());
    }
    static fromMillis(ms: number) {
      return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
    }
    static fromDate(d: Date) {
      return MockTimestamp.fromMillis(d.getTime());
    }
  }
  return { Timestamp: MockTimestamp };
});

import { renderBudgetsContent } from "../src/pages/budgets";
import { Timestamp } from "firebase/firestore";
import type { Budget, BudgetPeriod, WeeklyAggregate, BudgetId, BudgetPeriodId, GroupId } from "../src/firestore";

function makeBudget(overrides: Partial<Budget> & { id: string; name: string }): Budget {
  return {
    allowance: 100,
    allowancePeriod: "weekly",
    rollover: "none",
    overrides: [],
    groupId: null as GroupId | null,
    ...overrides,
  } as Budget;
}

function makePeriod(overrides: Partial<BudgetPeriod> & { id: string; budgetId: string }): BudgetPeriod {
  return {
    periodStart: Timestamp.fromMillis(1705190400000), // 2025-01-14
    periodEnd: Timestamp.fromMillis(1705795200000),   // 2025-01-21
    total: 50,
    count: 3,
    categoryBreakdown: {},
    groupId: null as GroupId | null,
    ...overrides,
  } as BudgetPeriod;
}

describe("renderBudgetsContent", () => {
  const budgets: Budget[] = [
    makeBudget({ id: "food", name: "Food", allowance: 150 }),
    makeBudget({ id: "fun", name: "Fun", allowance: 50 }),
  ];

  const periods: BudgetPeriod[] = [
    makePeriod({ id: "bp-1", budgetId: "food" }),
    makePeriod({ id: "bp-2", budgetId: "fun" }),
  ];

  const weeklyAggregates: WeeklyAggregate[] = [
    {
      id: "2025-01-13",
      weekStart: Timestamp.fromMillis(1705104000000),
      creditTotal: 500,
      unbudgetedTotal: 75,
      groupId: null as GroupId | null,
    },
  ];

  it("renders an h2 heading", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain("<h2>Budgets</h2>");
  });

  it("renders the budgets-table container", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('id="budgets-table"');
  });

  it("renders budget names in the table", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('value="Food"');
    expect(html).toContain('value="Fun"');
  });

  it("renders seed-data-notice when not authorized", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('id="seed-data-notice"');
    expect(html).toContain("Viewing example data");
  });

  it("does not render seed-data-notice when authorized", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, true);
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("renders the budget metrics section", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('id="budget-metrics"');
  });

  it("renders the chart container", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('id="budgets-chart"');
    expect(html).toContain('id="budgets-area-chart"');
  });

  it("renders disabled inputs when not authorized", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain("disabled");
  });

  it("renders editable inputs when authorized", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, true);
    const nameInputMatch = html.match(/<input type="text" class="edit-name"[^>]*>/g);
    expect(nameInputMatch).not.toBeNull();
    for (const match of nameInputMatch!) {
      expect(match).not.toContain("disabled");
    }
  });

  it("renders 'No budgets found' for empty budget list", () => {
    const html = renderBudgetsContent([], [], weeklyAggregates, false);
    expect(html).toContain("No budgets found");
  });
});
