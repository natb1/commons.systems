import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

vi.mock("../src/idb", () => ({
  getAll: vi.fn(),
  getMeta: vi.fn(),
}));

import { exportToJson } from "../src/export";
import { getAll, getMeta } from "../src/idb";
import { parseUploadedJson, toParsedData } from "../src/upload";

const mockGetAll = vi.mocked(getAll);
const mockGetMeta = vi.mocked(getMeta);

const idbTransactions = [
  {
    id: "txn-001",
    institution: "bankone",
    account: "1234",
    description: "KROGER",
    amount: 52.3,
    timestampMs: Date.parse("2025-06-10T00:00:00.000Z"),
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
];

const idbBudgets = [
  {
    id: "groceries",
    name: "Groceries",
    allowance: 100,
    allowancePeriod: "weekly",
    rollover: "none",
    overrides: [],
  },
];

const idbBudgetPeriods = [
  {
    id: "bp-1",
    budgetId: "groceries",
    periodStartMs: Date.parse("2025-06-09T00:00:00.000Z"),
    periodEndMs: Date.parse("2025-06-16T00:00:00.000Z"),
    total: 52.3,
    count: 1,
    categoryBreakdown: { Food: 52.3 },
  },
];

const idbRules = [
  {
    id: "r-1",
    type: "categorization",
    pattern: "KROGER",
    target: "Food",
    priority: 1,
    institution: null,
    account: null,
    minAmount: null,
    maxAmount: null,
    excludeCategory: null,
    matchCategory: null,
  },
];

const idbNormalizationRules = [
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
];

const idbStatements = [
  {
    id: "s-1",
    statementId: "stmt-1",
    institution: "bankone",
    account: "1234",
    balance: 1234.56,
    period: "2025-06",
    balanceDate: null,
    lastTransactionDateMs: Date.parse("2025-06-10T00:00:00.000Z"),
    virtual: false,
    sourceFile: null,
  },
];

const idbWeeklyAggregates = [
  {
    id: "wa-2025-w24",
    weekStartMs: Date.parse("2025-06-09T00:00:00.000Z"),
    creditTotal: 52.3,
    unbudgetedTotal: 10.5,
  },
];

const meta = {
  key: "upload" as const,
  groupName: "household",
  version: 1,
  exportedAt: "2025-06-15T10:30:00Z",
};

function setupMocks() {
  mockGetAll.mockImplementation((storeName: string) => {
    switch (storeName) {
      case "transactions":
        return Promise.resolve(idbTransactions);
      case "budgets":
        return Promise.resolve(idbBudgets);
      case "budgetPeriods":
        return Promise.resolve(idbBudgetPeriods);
      case "rules":
        return Promise.resolve(idbRules);
      case "normalizationRules":
        return Promise.resolve(idbNormalizationRules);
      case "statements":
        return Promise.resolve(idbStatements);
      case "statementItems":
        return Promise.resolve([]);
      case "reconciliationNotes":
        return Promise.resolve([]);
      case "accounts":
        return Promise.resolve([]);
      case "journalEntries":
        return Promise.resolve([]);
      case "journalLegs":
        return Promise.resolve([]);
      case "reconciliationEvents":
        return Promise.resolve([]);
      case "weeklyAggregates":
        return Promise.resolve(idbWeeklyAggregates);
      default:
        throw new Error(`Unmocked store name in test: "${storeName}"`);
    }
  });
  mockGetMeta.mockResolvedValue(meta);
}

describe("exportToJson", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
    setupMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exports all 6 collections with correct field mappings", async () => {
    const json = await exportToJson();
    const output = JSON.parse(json);

    expect(output.transactions).toHaveLength(1);
    expect(output.budgets).toHaveLength(1);
    expect(output.budgetPeriods).toHaveLength(1);
    expect(output.rules).toHaveLength(1);
    expect(output.normalizationRules).toHaveLength(1);
    expect(output.statements).toHaveLength(1);

    const txn = output.transactions[0];
    expect(txn.id).toBe("txn-001");
    expect(txn.institution).toBe("bankone");
    expect(txn.account).toBe("1234");
    expect(txn.description).toBe("KROGER");
    expect(txn.amount).toBe(52.3);
    expect(txn.category).toBe("Food");
    expect(txn.budget).toBe("groceries");
    expect(txn.note).toBe("");
    expect(txn.reimbursement).toBe(0);
    expect(txn.normalizedId).toBeNull();
    expect(txn.normalizedPrimary).toBe(true);
    expect(txn.normalizedDescription).toBeNull();

    const budget = output.budgets[0];
    expect(budget.id).toBe("groceries");
    expect(budget.name).toBe("Groceries");
    expect(budget.allowance).toBe(100);
    expect(budget.rollover).toBe("none");

    const period = output.budgetPeriods[0];
    expect(period.id).toBe("bp-1");
    expect(period.budgetId).toBe("groceries");
    expect(period.total).toBe(52.3);
    expect(period.count).toBe(1);
    expect(period.categoryBreakdown).toEqual({ Food: 52.3 });

    const rule = output.rules[0];
    expect(rule.id).toBe("r-1");
    expect(rule.type).toBe("categorization");
    expect(rule.pattern).toBe("KROGER");
    expect(rule.target).toBe("Food");
    expect(rule.priority).toBe(1);

    const normRule = output.normalizationRules[0];
    expect(normRule.id).toBe("nr-1");
    expect(normRule.pattern).toBe("KROGER.*");
    expect(normRule.canonicalDescription).toBe("KROGER");
    expect(normRule.dateWindowDays).toBe(7);
    expect(normRule.priority).toBe(1);
  });

  it("converts timestampMs to ISO 8601 strings", async () => {
    const json = await exportToJson();
    const output = JSON.parse(json);

    expect(output.transactions[0].timestamp).toBe("2025-06-10T00:00:00.000Z");
  });

  it("converts periodStartMs/periodEndMs to ISO 8601", async () => {
    const json = await exportToJson();
    const output = JSON.parse(json);

    expect(output.budgetPeriods[0].periodStart).toBe("2025-06-09T00:00:00.000Z");
    expect(output.budgetPeriods[0].periodEnd).toBe("2025-06-16T00:00:00.000Z");
  });

  it("converts null institution/account/patternType/statementId to empty strings", async () => {
    const json = await exportToJson();
    const output = JSON.parse(json);

    expect(output.rules[0].institution).toBe("");
    expect(output.rules[0].account).toBe("");
    expect(output.normalizationRules[0].patternType).toBe("");
    expect(output.normalizationRules[0].institution).toBe("");
    expect(output.normalizationRules[0].account).toBe("");

    // Transaction with null statementId — override just the transactions store
    const original = mockGetAll.getMockImplementation()!;
    mockGetAll.mockImplementation((storeName: string) =>
      storeName === "transactions"
        ? Promise.resolve([{ ...idbTransactions[0], statementId: null }])
        : original(storeName),
    );
    const json2 = await exportToJson();
    const output2 = JSON.parse(json2);
    expect(output2.transactions[0].statementId).toBe("");
  });

  it("sets exportedAt to current time", async () => {
    const json = await exportToJson();
    const output = JSON.parse(json);

    expect(output.exportedAt).toBe("2026-01-15T12:00:00.000Z");
  });

  it("sets groupId to empty string", async () => {
    const json = await exportToJson();
    const output = JSON.parse(json);

    expect(output.groupId).toBe("");
  });

  it("preserves version and groupName from meta", async () => {
    const json = await exportToJson();
    const output = JSON.parse(json);

    expect(output.version).toBe(1);
    expect(output.groupName).toBe("household");
  });

  it("output is valid JSON", async () => {
    const json = await exportToJson();
    expect(() => JSON.parse(json)).not.toThrow();

    const output = JSON.parse(json);
    expect(typeof output).toBe("object");
    expect(output).not.toBeNull();
  });

  it("throws when no meta (no local data)", async () => {
    mockGetMeta.mockResolvedValue(undefined);

    await expect(exportToJson()).rejects.toThrow("No local data to export. Upload a file first.");
  });

  it("round-trip preserves budget overrides", async () => {
    const original = mockGetAll.getMockImplementation()!;
    mockGetAll.mockImplementation((storeName: string) =>
      storeName === "budgets"
        ? Promise.resolve([{
            ...idbBudgets[0],
            overrides: [{ dateMs: Date.parse("2025-06-10T00:00:00Z"), balance: 50 }],
          }])
        : original(storeName),
    );
    const json = await exportToJson();
    const parsed = parseUploadedJson(json);
    const data = toParsedData(parsed);
    expect(data.budgets[0].overrides).toHaveLength(1);
    expect(data.budgets[0].overrides[0].dateMs).toBe(Date.parse("2025-06-10T00:00:00Z"));
    expect(data.budgets[0].overrides[0].balance).toBe(50);
  });

  it("round-trip preserves virtual: true on transactions", async () => {
    const original = mockGetAll.getMockImplementation()!;
    mockGetAll.mockImplementation((storeName: string) =>
      storeName === "transactions"
        ? Promise.resolve([{ ...idbTransactions[0], id: "txn-virtual", virtual: true }])
        : original(storeName),
    );
    const json = await exportToJson();
    expect(JSON.parse(json).transactions[0].virtual).toBe(true);

    const parsed = parseUploadedJson(json);
    const data = toParsedData(parsed);
    expect(data.transactions[0].virtual).toBe(true);
  });

  it("round-trip preserves virtual: true on statements", async () => {
    const original = mockGetAll.getMockImplementation()!;
    mockGetAll.mockImplementation((storeName: string) =>
      storeName === "statements"
        ? Promise.resolve([{ ...idbStatements[0], id: "stmt-virtual", virtual: true }])
        : original(storeName),
    );
    const json = await exportToJson();
    expect(JSON.parse(json).statements[0].virtual).toBe(true);

    const parsed = parseUploadedJson(json);
    const data = toParsedData(parsed);
    expect(data.statements[0].virtual).toBe(true);
  });

  it("round-trip preserves journalEntryId on transactions", async () => {
    const original = mockGetAll.getMockImplementation()!;
    mockGetAll.mockImplementation((storeName: string) =>
      storeName === "transactions"
        ? Promise.resolve([{ ...idbTransactions[0], journalEntryId: "je-001" }])
        : original(storeName),
    );
    const json = await exportToJson();
    expect(JSON.parse(json).transactions[0].journalEntryId).toBe("je-001");

    const parsed = parseUploadedJson(json);
    expect(parsed.transactions[0].journalEntryId).toBe("je-001");

    const data = toParsedData(parsed);
    expect(data.transactions[0].journalEntryId).toBe("je-001");
  });

  it("round-trip: export -> parseUploadedJson -> toParsedData produces equivalent IDB data", async () => {
    const json = await exportToJson();
    const parsed = parseUploadedJson(json);
    const data = toParsedData(parsed);

    // Transactions
    expect(data.transactions).toHaveLength(1);
    const txn = data.transactions[0];
    expect(txn.id).toBe("txn-001");
    expect(txn.institution).toBe("bankone");
    expect(txn.account).toBe("1234");
    expect(txn.description).toBe("KROGER");
    expect(txn.amount).toBe(52.3);
    expect(txn.timestampMs).toBe(idbTransactions[0].timestampMs);
    expect(txn.statementId).toBe("stmt-1");
    expect(txn.category).toBe("Food");
    expect(txn.budget).toBe("groceries");
    expect(txn.note).toBe("");
    expect(txn.reimbursement).toBe(0);
    expect(txn.normalizedId).toBeNull();
    expect(txn.normalizedPrimary).toBe(true);
    expect(txn.normalizedDescription).toBeNull();

    // Budgets
    expect(data.budgets).toHaveLength(1);
    expect(data.budgets[0]).toEqual(idbBudgets[0]);

    // Budget periods
    expect(data.budgetPeriods).toHaveLength(1);
    const period = data.budgetPeriods[0];
    expect(period.id).toBe("bp-1");
    expect(period.budgetId).toBe("groceries");
    expect(period.periodStartMs).toBe(idbBudgetPeriods[0].periodStartMs);
    expect(period.periodEndMs).toBe(idbBudgetPeriods[0].periodEndMs);
    expect(period.total).toBe(52.3);
    expect(period.count).toBe(1);
    expect(period.categoryBreakdown).toEqual({ Food: 52.3 });

    // Rules
    expect(data.rules).toHaveLength(1);
    expect(data.rules[0]).toEqual(idbRules[0]);

    // Normalization rules
    expect(data.normalizationRules).toHaveLength(1);
    expect(data.normalizationRules[0]).toEqual(idbNormalizationRules[0]);

    // Statements
    expect(data.statements).toHaveLength(1);
    expect(data.statements[0]).toEqual(idbStatements[0]);

    // Meta
    expect(data.meta.groupName).toBe("household");
    expect(data.meta.version).toBe(1);
  });

  it("round-trip preserves weeklyAggregates unchanged", async () => {
    const json = await exportToJson();
    const output = JSON.parse(json);

    // Criterion 1a: weeklyAggregates is present and non-empty in exported JSON
    expect(output.weeklyAggregates).toBeDefined();
    expect(output.weeklyAggregates).toHaveLength(1);
    // weekStart should be an ISO string
    expect(typeof output.weeklyAggregates[0].weekStart).toBe("string");
    expect(output.weeklyAggregates[0].weekStart).toBe("2025-06-09T00:00:00.000Z");

    // Criterion 1b: round-trip restores IDB records deep-equal to the original fixture
    const parsed = parseUploadedJson(json);
    const data = toParsedData(parsed);

    expect(data.weeklyAggregates).toHaveLength(1);
    expect(data.weeklyAggregates[0]).toEqual(idbWeeklyAggregates[0]);
  });

  it("ETL-snapshot round-trip empties no store", async () => {
    // Minimal well-formed IDB fixtures for ETL-emitted stores not already in setupMocks
    const idbJournalEntriesFixture = [
      {
        id: "je-001",
        timestampMs: Date.parse("2025-06-10T00:00:00.000Z"),
        description: "Transfer",
        note: null,
        legCount: 2,
      },
    ];
    const idbJournalLegsFixture = [
      {
        id: "jl-001",
        entryId: "je-001",
        accountId: "bankone_1234",
        debit: 100,
        credit: 0,
        timestampMs: Date.parse("2025-06-10T00:00:00.000Z"),
        cleared: false,
        reconciledAtMs: null,
        reconciledEventId: null,
        statementItemId: null,
      },
    ];
    const idbAccountsFixture = [
      {
        id: "bankone_1234",
        institution: "bankone",
        account: "1234",
        accountType: "asset" as const,
        openingBalance: null,
        openingBalanceDateMs: null,
      },
    ];

    // Override the mocks for this test to supply non-empty ETL stores
    const original = mockGetAll.getMockImplementation()!;
    mockGetAll.mockImplementation((storeName: string) => {
      switch (storeName) {
        case "journalEntries":
          return Promise.resolve(idbJournalEntriesFixture);
        case "journalLegs":
          return Promise.resolve(idbJournalLegsFixture);
        case "accounts":
          return Promise.resolve(idbAccountsFixture);
        default:
          return original(storeName);
      }
    });

    const json = await exportToJson();
    const parsed = parseUploadedJson(json);
    const data = toParsedData(parsed);

    // Every ETL-emitted store that was non-empty before export must be non-empty after.
    // This is the generic guard: if export.ts ever forgets a new ETL store, this trips.
    const etlStores: Array<{ name: string; result: unknown[] }> = [
      { name: "transactions", result: data.transactions },
      { name: "statements", result: data.statements },
      { name: "budgets", result: data.budgets },
      { name: "budgetPeriods", result: data.budgetPeriods },
      { name: "rules", result: data.rules },
      { name: "normalizationRules", result: data.normalizationRules },
      { name: "weeklyAggregates", result: data.weeklyAggregates },
      { name: "journalEntries", result: data.journalEntries },
      { name: "journalLegs", result: data.journalLegs },
      { name: "accounts", result: data.accounts },
    ];

    for (const { name, result } of etlStores) {
      expect(result, `store "${name}" was emptied by the export/import round-trip`).not.toHaveLength(0);
    }
  });
});
