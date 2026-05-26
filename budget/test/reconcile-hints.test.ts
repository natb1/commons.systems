import { describe, it, expect, vi } from "vitest";
import { timestampMockFactory, ts } from "./helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { suggestClearedLegs, SUGGESTION_TOLERANCE_DAYS } from "../src/reconcile-hints";
import type { JournalLeg } from "../src/entities/journal-leg";
import type { StatementItem } from "../src/entities/statement-item";
import type { StatementItemId } from "../src/entities/statement-item";
import type { StatementId } from "../src/entities/statement";

function leg(overrides: Partial<JournalLeg> = {}): JournalLeg {
  return {
    id: "leg-1",
    entryId: "entry-1",
    accountId: "acct-1",
    debit: 0,
    credit: 0,
    timestamp: ts("2025-02-10"),
    cleared: false,
    reconciledAt: null,
    reconciledEventId: null,
    statementItemId: null,
    groupId: null,
    ...overrides,
  };
}

function statementItem(overrides: Partial<StatementItem> = {}): StatementItem {
  return {
    id: "si-1",
    statementItemId: "si-fitid-1" as StatementItemId,
    statementId: "stmt-1" as StatementId,
    institution: "bank",
    account: "1234",
    period: "2025-02",
    amount: -50,
    timestamp: ts("2025-02-10"),
    description: "Purchase",
    fitid: "fitid-1",
    groupId: null,
    ...overrides,
  };
}

describe("suggestClearedLegs", () => {
  it("suggests a leg with a non-null statementItemId (explicit signal)", () => {
    const legs = [leg({ id: "leg-a", statementItemId: "si-fitid-1" })];
    const result = suggestClearedLegs(legs, [], SUGGESTION_TOLERANCE_DAYS);
    expect(result.has("leg-a")).toBe(true);
  });

  it("suggests a leg matching a statement item by amount and date within tolerance", () => {
    const legs = [leg({ id: "leg-b", debit: 50, credit: 0, timestamp: ts("2025-02-10") })];
    const items = [statementItem({ amount: -50, timestamp: ts("2025-02-11") })];
    const result = suggestClearedLegs(legs, items, SUGGESTION_TOLERANCE_DAYS);
    expect(result.has("leg-b")).toBe(true);
  });

  it("does not suggest a leg whose date is beyond tolerance", () => {
    const legs = [leg({ id: "leg-c", debit: 50, credit: 0, timestamp: ts("2025-02-10") })];
    // 5 days apart, tolerance is 3
    const items = [statementItem({ amount: -50, timestamp: ts("2025-02-15") })];
    const result = suggestClearedLegs(legs, items, SUGGESTION_TOLERANCE_DAYS);
    expect(result.has("leg-c")).toBe(false);
  });

  it("does not suggest a leg with amount mismatch", () => {
    const legs = [leg({ id: "leg-d", debit: 50, credit: 0, timestamp: ts("2025-02-10") })];
    const items = [statementItem({ amount: -75, timestamp: ts("2025-02-10") })];
    const result = suggestClearedLegs(legs, items, SUGGESTION_TOLERANCE_DAYS);
    expect(result.has("leg-d")).toBe(false);
  });

  it("does not suggest an already-cleared leg even when statementItemId is set and amount/date matches", () => {
    const legs = [
      leg({
        id: "leg-e",
        cleared: true,
        statementItemId: "si-fitid-1",
        debit: 50,
        credit: 0,
        timestamp: ts("2025-02-10"),
      }),
    ];
    const items = [statementItem({ amount: -50, timestamp: ts("2025-02-10") })];
    const result = suggestClearedLegs(legs, items, SUGGESTION_TOLERANCE_DAYS);
    expect(result.has("leg-e")).toBe(false);
  });
});
