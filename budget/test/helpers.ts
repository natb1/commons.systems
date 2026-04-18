import { vi } from "vitest";
import type { Budget, BudgetPeriod } from "../src/firestore";
import type { Timestamp } from "firebase/firestore";
import type { ParsedData } from "../src/idb";
import type { DataSource } from "../src/data-source";

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
    allowance: 150,
    allowancePeriod: "weekly",
    rollover: "none",
    overrides: [],
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

export function makeParsedData(overrides: Partial<ParsedData> = {}): ParsedData {
  return {
    transactions: [
      {
        id: "txn-1",
        institution: "bankone",
        account: "1234",
        description: "KROGER",
        amount: 52.3,
        timestampMs: 1718064000000,
        statementId: "stmt-1",
        category: "Food",
        budget: "groceries",
        note: "",
        reimbursement: 0,
        normalizedId: null,
        normalizedPrimary: true,
        normalizedDescription: null,
        virtual: false,
      },
    ],
    budgets: [
      { id: "groceries", name: "Groceries", allowance: 100, allowancePeriod: "weekly", rollover: "none" },
    ],
    budgetPeriods: [
      {
        id: "bp-1",
        budgetId: "groceries",
        periodStartMs: 1718064000000,
        periodEndMs: 1718668800000,
        total: 52.3,
        count: 1,
        categoryBreakdown: { Food: 52.3 },
      },
    ],
    rules: [
      {
        id: "r-1",
        type: "categorization",
        pattern: "KROGER",
        target: "Food",
        priority: 1,
        institution: null,
        account: null,
      },
    ],
    normalizationRules: [
      {
        id: "nr-1",
        pattern: "KROGER.*",
        patternType: null,
        canonicalDescription: "KROGER",
        dateWindowDays: 7,
        institution: null,
        account: null,
        priority: 1,
      },
    ],
    statements: [],
    statementItems: [],
    reconciliationNotes: [],
    weeklyAggregates: [],
    meta: {
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    },
    ...overrides,
  };
}

export function createMockDataSource(overrides: Partial<DataSource> = {}): DataSource {
  return {
    getTransactions: vi.fn().mockResolvedValue([]),
    getStatements: vi.fn().mockResolvedValue([]),
    getStatementItems: vi.fn().mockResolvedValue([]),
    getReconciliationNotes: vi.fn().mockResolvedValue([]),
    getBudgets: vi.fn().mockResolvedValue([]),
    getBudgetPeriods: vi.fn().mockResolvedValue([]),
    getRules: vi.fn().mockResolvedValue([]),
    getNormalizationRules: vi.fn().mockResolvedValue([]),
    getWeeklyAggregates: vi.fn().mockResolvedValue([]),
    updateTransaction: vi.fn(),
    updateTransactionStatementItemLink: vi.fn(),
    upsertReconciliationNote: vi.fn(),
    deleteReconciliationNote: vi.fn(),
    updateBudget: vi.fn(),
    updateBudgetOverrides: vi.fn(),
    adjustBudgetPeriodTotal: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    createNormalizationRule: vi.fn(),
    updateNormalizationRule: vi.fn(),
    deleteNormalizationRule: vi.fn(),
    ...overrides,
  };
}

export function makeContainer(): HTMLElement {
  const container = document.createElement("div");
  container.style.setProperty("--fg", "#e0e0e0");
  document.body.appendChild(container);
  Object.defineProperty(container, "clientWidth", { value: 640 });
  return container;
}
