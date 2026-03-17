import type { Budget, BudgetPeriod } from "../src/firestore";
import type { Timestamp } from "firebase/firestore";

class MockTimestamp {
  _date: Date;
  constructor(d: Date) { this._date = d; }
  toDate() { return this._date; }
  toMillis() { return this._date.getTime(); }
  static fromDate(d: Date) { return new MockTimestamp(d); }
  static fromMillis(ms: number) { return new MockTimestamp(new Date(ms)); }
}

export function timestampMockFactory() {
  return { Timestamp: MockTimestamp };
}

export function ts(dateStr: string): Timestamp {
  return MockTimestamp.fromDate(new Date(dateStr)) as unknown as Timestamp;
}

export function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food" as any,
    name: "Food",
    weeklyAllowance: 150,
    rollover: "none",
    groupId: null,
    ...overrides,
  };
}

export function makePeriod(overrides: Partial<BudgetPeriod> & { id: string; budgetId: string }): BudgetPeriod {
  return {
    periodStart: ts("2025-01-13"),
    periodEnd: ts("2025-01-20"),
    total: 0,
    count: 0,
    categoryBreakdown: {},
    groupId: null,
    ...overrides,
  } as BudgetPeriod;
}

export function makeContainer(): HTMLElement {
  const container = document.createElement("div");
  container.style.setProperty("--fg", "#e0e0e0");
  document.body.appendChild(container);
  Object.defineProperty(container, "clientWidth", { value: 640 });
  return container;
}
