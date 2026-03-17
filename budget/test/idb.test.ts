import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import {
  storeParsedData,
  getAll,
  get,
  put,
  deleteRecord,
  clearAll,
  hasData,
  getMeta,
  type ParsedData,
} from "../src/idb";

function makeParsedData(): ParsedData {
  return {
    transactions: [
      {
        id: "txn-1",
        institution: "pnc",
        account: "5111",
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
      },
      {
        id: "txn-2",
        institution: "chase",
        account: "9999",
        description: "TARGET",
        amount: 20,
        timestampMs: 1718064000000,
        statementId: "stmt-2",
        category: "Shopping",
        budget: null,
        note: "returns",
        reimbursement: 0,
        normalizedId: null,
        normalizedPrimary: true,
        normalizedDescription: null,
      },
    ],
    budgets: [
      { id: "groceries", name: "Groceries", weeklyAllowance: 100, rollover: "none" },
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
    meta: {
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    },
  };
}

// Each test gets a fresh database by deleting between tests
beforeEach(async () => {
  // Delete the database to ensure a clean state
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("budget");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
});

describe("storeParsedData + getAll round-trip", () => {
  it("stores and retrieves transactions", async () => {
    const data = makeParsedData();
    await storeParsedData(data);
    const results = await getAll("transactions");
    expect(results).toHaveLength(2);
    expect(results).toEqual(expect.arrayContaining(data.transactions));
  });

  it("stores and retrieves budgets", async () => {
    const data = makeParsedData();
    await storeParsedData(data);
    const results = await getAll("budgets");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(data.budgets[0]);
  });

  it("stores and retrieves budgetPeriods", async () => {
    const data = makeParsedData();
    await storeParsedData(data);
    const results = await getAll("budgetPeriods");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(data.budgetPeriods[0]);
  });

  it("stores and retrieves rules", async () => {
    const data = makeParsedData();
    await storeParsedData(data);
    const results = await getAll("rules");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(data.rules[0]);
  });

  it("stores and retrieves normalizationRules", async () => {
    const data = makeParsedData();
    await storeParsedData(data);
    const results = await getAll("normalizationRules");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(data.normalizationRules[0]);
  });
});

describe("put + get", () => {
  it("puts and gets a single record", async () => {
    const data = makeParsedData();
    await storeParsedData(data);

    const record = { id: "txn-new", institution: "boa", account: "1234", description: "WALMART", amount: 10, timestampMs: null, statementId: null, category: "", budget: null, note: "", reimbursement: 0, normalizedId: null, normalizedPrimary: true, normalizedDescription: null };
    await put("transactions", record);
    const result = await get("transactions", "txn-new");
    expect(result).toEqual(record);
  });

  it("returns undefined for missing record", async () => {
    const data = makeParsedData();
    await storeParsedData(data);
    const result = await get("transactions", "nonexistent");
    expect(result).toBeUndefined();
  });
});

describe("deleteRecord", () => {
  it("removes a record", async () => {
    const data = makeParsedData();
    await storeParsedData(data);
    await deleteRecord("transactions", "txn-1");
    const result = await get("transactions", "txn-1");
    expect(result).toBeUndefined();
    const all = await getAll("transactions");
    expect(all).toHaveLength(1);
  });
});

describe("clearAll", () => {
  it("empties all stores", async () => {
    const data = makeParsedData();
    await storeParsedData(data);
    await clearAll();
    expect(await getAll("transactions")).toHaveLength(0);
    expect(await getAll("budgets")).toHaveLength(0);
    expect(await getAll("budgetPeriods")).toHaveLength(0);
    expect(await getAll("rules")).toHaveLength(0);
    expect(await getAll("normalizationRules")).toHaveLength(0);
    expect(await getAll("meta")).toHaveLength(0);
  });
});

describe("hasData", () => {
  it("returns false initially", async () => {
    expect(await hasData()).toBe(false);
  });

  it("returns true after storing data", async () => {
    await storeParsedData(makeParsedData());
    expect(await hasData()).toBe(true);
  });

  it("returns false after clearAll", async () => {
    await storeParsedData(makeParsedData());
    await clearAll();
    expect(await hasData()).toBe(false);
  });
});

describe("getMeta", () => {
  it("returns stored meta", async () => {
    const data = makeParsedData();
    await storeParsedData(data);
    const meta = await getMeta();
    expect(meta).toEqual({
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    });
  });

  it("returns undefined when no data stored", async () => {
    const meta = await getMeta();
    expect(meta).toBeUndefined();
  });
});
