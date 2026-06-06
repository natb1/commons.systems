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
  parseRawStatement,
  statementToIdbRecord,
  idbToStatement,
  statementToRawJson,
  serializeSeedStatement,
  type RawStatement,
  type IdbStatement,
} from "../src/entities/statement";

const baseRaw: RawStatement = {
  id: "stmt-001",
  statementId: "sid-001",
  institution: "firstbank",
  account: "checking",
  balance: 1234.56,
  period: "2025-05",
};

describe("Statement entity: sourceFile round-trip", () => {
  it("threads sourceFile through parseRawStatement → statementToIdbRecord → idbToStatement", () => {
    const raw: RawStatement = { ...baseRaw, sourceFile: "2025-05/firstbank-checking.qfx" };

    const domain = parseRawStatement(raw, 0);
    expect(domain.sourceFile).toBe("2025-05/firstbank-checking.qfx");

    const idb = statementToIdbRecord(domain);
    expect(idb.sourceFile).toBe("2025-05/firstbank-checking.qfx");

    const roundTripped = idbToStatement(idb);
    expect(roundTripped.sourceFile).toBe("2025-05/firstbank-checking.qfx");
  });

  it("defaults sourceFile to null when absent from RawStatement", () => {
    const domain = parseRawStatement(baseRaw, 0);
    expect(domain.sourceFile).toBeNull();

    const idb = statementToIdbRecord(domain);
    expect(idb.sourceFile).toBeNull();

    const roundTripped = idbToStatement(idb);
    expect(roundTripped.sourceFile).toBeNull();
  });

  it("defaults sourceFile to null when explicitly null in RawStatement", () => {
    const raw: RawStatement = { ...baseRaw, sourceFile: null };
    const domain = parseRawStatement(raw, 0);
    expect(domain.sourceFile).toBeNull();
  });

  it("threads sourceFile through statementToRawJson", () => {
    const idb: IdbStatement = {
      id: "stmt-001",
      statementId: "sid-001",
      institution: "firstbank",
      account: "checking",
      balance: 1234.56,
      period: "2025-05",
      balanceDate: null,
      lastTransactionDateMs: null,
      virtual: false,
      sourceFile: "2025-05/firstbank-checking.qfx",
    };

    const raw = statementToRawJson(idb);
    expect(raw.sourceFile).toBe("2025-05/firstbank-checking.qfx");
  });

  it("statementToRawJson defaults sourceFile to null when absent from IdbStatement", () => {
    const idb: IdbStatement = {
      id: "stmt-001",
      statementId: "sid-001",
      institution: "firstbank",
      account: "checking",
      balance: 1234.56,
      period: "2025-05",
      balanceDate: null,
      lastTransactionDateMs: null,
      virtual: false,
    };

    const raw = statementToRawJson(idb);
    expect(raw.sourceFile).toBeNull();
  });

  it("threads sourceFile through serializeSeedStatement", () => {
    const seedData = {
      statementId: "sid-001",
      institution: "firstbank",
      account: "checking",
      balance: 1234.56,
      period: "2025-05",
      balanceDate: null,
      lastTransactionDate: null,
      virtual: false,
      sourceFile: "2025-05/firstbank-checking.qfx",
    };

    const result = serializeSeedStatement(seedData as Parameters<typeof serializeSeedStatement>[0], "stmt-001");
    expect(result.sourceFile).toBe("2025-05/firstbank-checking.qfx");
  });

  it("serializeSeedStatement defaults sourceFile to null when absent", () => {
    const seedData = {
      statementId: "sid-001",
      institution: "firstbank",
      account: "checking",
      balance: 1234.56,
      period: "2025-05",
      balanceDate: null,
      lastTransactionDate: null,
      virtual: false,
    };

    const result = serializeSeedStatement(seedData as Parameters<typeof serializeSeedStatement>[0], "stmt-001");
    expect(result.sourceFile).toBeNull();
  });
});
