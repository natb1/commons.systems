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
  parseUploadedJson,
  toParsedData,
  UploadValidationError,
} from "../src/upload";

const validInput = {
  version: 1,
  exportedAt: "2025-06-15T10:30:00Z",
  groupId: "group-123",
  groupName: "household",
  transactions: [
    {
      id: "txn-001",
      institution: "bankone",
      account: "1234",
      description: "KROGER",
      amount: 52.3,
      timestamp: "2025-06-10T00:00:00Z",
      statementId: "stmt-1",
      category: "Food",
      budget: "groceries",
      note: "",
      reimbursement: 0,
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
    },
  ],
  budgets: [
    {
      id: "groceries",
      name: "Groceries",
      allowance: 100,
      allowancePeriod: "weekly",
      rollover: "none",
    },
  ],
  budgetPeriods: [
    {
      id: "bp-1",
      budgetId: "groceries",
      periodStart: "2025-06-09T00:00:00Z",
      periodEnd: "2025-06-16T00:00:00Z",
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
      institution: "",
      account: "",
      minAmount: 10.5,
      maxAmount: 200,
    },
  ],
  normalizationRules: [
    {
      id: "nr-1",
      pattern: "KROGER.*",
      patternType: "",
      canonicalDescription: "KROGER",
      dateWindowDays: 7,
      institution: "",
      account: "",
      priority: 1,
    },
  ],
};

describe("parseUploadedJson", () => {
  it("parses valid JSON with all fields", () => {
    const result = parseUploadedJson(JSON.stringify(validInput));

    expect(result.version).toBe(1);
    expect(result.exportedAt).toBe("2025-06-15T10:30:00Z");
    expect(result.groupName).toBe("household");
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toBe("txn-001");
    expect(result.transactions[0].amount).toBe(52.3);
    expect(result.budgets).toHaveLength(1);
    expect(result.budgets[0].rollover).toBe("none");
    expect(result.budgetPeriods).toHaveLength(1);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].type).toBe("categorization");
    expect(result.normalizationRules).toHaveLength(1);
  });

  it("throws UploadValidationError for invalid JSON string", () => {
    expect(() => parseUploadedJson("not json at all")).toThrow(
      UploadValidationError,
    );
    expect(() => parseUploadedJson("not json at all")).toThrow(
      "Invalid JSON file",
    );
  });

  it("throws UploadValidationError for wrong version", () => {
    const input = { ...validInput, version: 2 };
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      UploadValidationError,
    );
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      "Unsupported version",
    );
  });

  it("throws UploadValidationError for missing version", () => {
    const { version: _, ...input } = validInput;
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      UploadValidationError,
    );
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      "Missing required field: version",
    );
  });

  it("throws UploadValidationError for missing groupName", () => {
    const { groupName: _, ...input } = validInput;
    expect(() =>
      parseUploadedJson(JSON.stringify({ ...input, version: 1 })),
    ).toThrow("Missing required field: groupName");
  });

  it("throws UploadValidationError for missing transactions", () => {
    const { transactions: _, ...input } = validInput;
    expect(() =>
      parseUploadedJson(JSON.stringify({ ...input, version: 1 })),
    ).toThrow("Missing required field: transactions");
  });

  it("converts ISO 8601 timestamp to Timestamp.fromMillis", () => {
    const result = parseUploadedJson(JSON.stringify(validInput));
    const ts = result.transactions[0].timestamp;
    const expectedMs = Date.parse("2025-06-10T00:00:00Z");
    expect(ts).not.toBeNull();
    expect(ts!.toMillis()).toBe(expectedMs);
  });

  it("converts empty string institution/account to null in rules", () => {
    const result = parseUploadedJson(JSON.stringify(validInput));
    expect(result.rules[0].institution).toBeNull();
    expect(result.rules[0].account).toBeNull();
  });

  it("converts empty string patternType to null in normalization rules", () => {
    const result = parseUploadedJson(JSON.stringify(validInput));
    expect(result.normalizationRules[0].patternType).toBeNull();
  });

  it("keeps null budget as null", () => {
    const input = {
      ...validInput,
      transactions: [{ ...validInput.transactions[0], budget: null }],
    };
    const result = parseUploadedJson(JSON.stringify(input));
    expect(result.transactions[0].budget).toBeNull();
  });

  it("keeps non-empty budget string as BudgetId", () => {
    const result = parseUploadedJson(JSON.stringify(validInput));
    expect(result.transactions[0].budget).toBe("groceries");
  });

  it("throws UploadValidationError for missing transaction id", () => {
    const input = {
      ...validInput,
      transactions: [{ ...validInput.transactions[0], id: undefined }],
    };
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      UploadValidationError,
    );
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      "transaction[0] is missing a valid id",
    );
  });

  it("throws UploadValidationError for empty budget id", () => {
    const input = {
      ...validInput,
      budgets: [{ ...validInput.budgets[0], id: "" }],
    };
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      "budget[0] is missing a valid id",
    );
  });

  it("throws UploadValidationError for missing rule id", () => {
    const input = {
      ...validInput,
      rules: [{ ...validInput.rules[0], id: undefined }],
    };
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      "rule[0] is missing a valid id",
    );
  });

  it("throws for non-object JSON", () => {
    expect(() => parseUploadedJson(JSON.stringify([1, 2, 3]))).toThrow(
      "JSON must be an object",
    );
  });

  it("throws UploadValidationError for invalid rollover value", () => {
    const input = {
      ...validInput,
      budgets: [{ ...validInput.budgets[0], rollover: "invalid" }],
    };
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      UploadValidationError,
    );
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      'Invalid rollover value: "invalid"',
    );
  });

  it("accepts quarterly allowancePeriod", () => {
    const input = {
      ...validInput,
      budgets: [{ ...validInput.budgets[0], allowancePeriod: "quarterly" }],
    };
    const result = parseUploadedJson(JSON.stringify(input));
    expect(result.budgets[0].allowancePeriod).toBe("quarterly");
  });

  it("throws UploadValidationError for invalid allowancePeriod", () => {
    const input = {
      ...validInput,
      budgets: [{ ...validInput.budgets[0], allowancePeriod: "biweekly" }],
    };
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      UploadValidationError,
    );
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      'Invalid allowancePeriod value: "biweekly"',
    );
  });

  it("throws UploadValidationError for invalid rule type", () => {
    const input = {
      ...validInput,
      rules: [{ ...validInput.rules[0], type: "unknown" }],
    };
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      UploadValidationError,
    );
    expect(() => parseUploadedJson(JSON.stringify(input))).toThrow(
      'Invalid rule type: "unknown"',
    );
  });
});

describe("toParsedData", () => {
  it("converts Timestamps to milliseconds in output", () => {
    const parsed = parseUploadedJson(JSON.stringify(validInput));
    const data = toParsedData(parsed);

    const expectedTxnMs = Date.parse("2025-06-10T00:00:00Z");
    expect(data.transactions[0].timestampMs).toBe(expectedTxnMs);

    const expectedStartMs = Date.parse("2025-06-09T00:00:00Z");
    const expectedEndMs = Date.parse("2025-06-16T00:00:00Z");
    expect(data.budgetPeriods[0].periodStartMs).toBe(expectedStartMs);
    expect(data.budgetPeriods[0].periodEndMs).toBe(expectedEndMs);
  });

  it("preserves all fields correctly", () => {
    const parsed = parseUploadedJson(JSON.stringify(validInput));
    const data = toParsedData(parsed);

    expect(data.transactions[0].id).toBe("txn-001");
    expect(data.transactions[0].description).toBe("KROGER");
    expect(data.transactions[0].amount).toBe(52.3);
    expect(data.transactions[0].budget).toBe("groceries");

    expect(data.budgets[0].id).toBe("groceries");
    expect(data.budgets[0].name).toBe("Groceries");
    expect(data.budgets[0].allowance).toBe(100);

    expect(data.rules[0].type).toBe("categorization");
    expect(data.rules[0].pattern).toBe("KROGER");

    expect(data.normalizationRules[0].canonicalDescription).toBe("KROGER");

    expect(data.meta).toEqual({
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    });
  });

  it("converts empty string timestamp to null timestampMs", () => {
    const input = {
      ...validInput,
      transactions: [{ ...validInput.transactions[0], timestamp: "" }],
    };
    const parsed = parseUploadedJson(JSON.stringify(input));
    const data = toParsedData(parsed);
    expect(data.transactions[0].timestampMs).toBeNull();
  });
});
