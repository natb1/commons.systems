import "fake-indexeddb/auto";
import { describe, it, expect, vi } from "vitest";

// Ensure reportError is available (not provided by all test environments)
if (typeof globalThis.reportError !== "function") {
  globalThis.reportError = () => {};
}

import { createDbConnection } from "../src/connection";

let testCounter = 0;
function uniqueDbName() {
  return `idbutil-test-${++testCounter}`;
}

describe("input validation", () => {
  it("throws on empty name", () => {
    expect(() => createDbConnection({ name: "", version: 1, onUpgrade() {} }))
      .toThrow("DbConnectionConfig.name must be a non-empty string");
  });

  it("throws on zero version", () => {
    expect(() => createDbConnection({ name: "x", version: 0, onUpgrade() {} }))
      .toThrow("DbConnectionConfig.version must be a positive integer, got 0");
  });

  it("throws on negative version", () => {
    expect(() => createDbConnection({ name: "x", version: -1, onUpgrade() {} }))
      .toThrow("DbConnectionConfig.version must be a positive integer, got -1");
  });

  it("throws on float version", () => {
    expect(() => createDbConnection({ name: "x", version: 1.5, onUpgrade() {} }))
      .toThrow("DbConnectionConfig.version must be a positive integer, got 1.5");
  });
});

describe("openDb", () => {
  it("returns an IDBDatabase", async () => {
    const name = uniqueDbName();
    const { openDb, closeDb } = createDbConnection({
      name,
      version: 1,
      onUpgrade(db) { db.createObjectStore("s"); },
    });
    const db = await openDb();
    expect(db).toBeInstanceOf(IDBDatabase);
    expect(db.name).toBe(name);
    await closeDb();
  });

  it("concurrent calls return the same promise (singleton)", async () => {
    const { openDb, closeDb } = createDbConnection({
      name: uniqueDbName(),
      version: 1,
      onUpgrade() {},
    });
    const p1 = openDb();
    const p2 = openDb();
    expect(p1).toBe(p2);
    const [db1, db2] = await Promise.all([p1, p2]);
    expect(db1).toBe(db2);
    await closeDb();
  });

  it("calls onUpgrade with oldVersion on first open", async () => {
    const onUpgrade = vi.fn();
    const { openDb, closeDb } = createDbConnection({
      name: uniqueDbName(),
      version: 1,
      onUpgrade,
    });
    await openDb();
    expect(onUpgrade).toHaveBeenCalledWith(expect.any(IDBDatabase), 0);
    await closeDb();
  });

  it("creates a fresh connection after onclose fires", async () => {
    const { openDb, closeDb } = createDbConnection({
      name: uniqueDbName(),
      version: 1,
      onUpgrade() {},
    });
    const db1 = await openDb();
    // Simulate browser closing the connection
    db1.onclose?.(new Event("close"));
    const db2 = await openDb();
    expect(db2).not.toBe(db1);
    await closeDb();
  });
});

describe("closeDb", () => {
  it("is idempotent — multiple calls do not throw", async () => {
    const { openDb, closeDb } = createDbConnection({
      name: uniqueDbName(),
      version: 1,
      onUpgrade() {},
    });
    await openDb();
    await closeDb();
    await closeDb();
    await closeDb();
  });

  it("allows reopening after close", async () => {
    const { openDb, closeDb } = createDbConnection({
      name: uniqueDbName(),
      version: 1,
      onUpgrade() {},
    });
    const db1 = await openDb();
    await closeDb();
    const db2 = await openDb();
    expect(db2).not.toBe(db1);
    await closeDb();
  });

  it("does not throw when openDb previously failed", async () => {
    const reportSpy = vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
    const { openDb, closeDb } = createDbConnection({
      name: uniqueDbName(),
      version: 1,
      onUpgrade() {
        throw new Error("upgrade failed");
      },
    });

    await expect(openDb()).rejects.toThrow();
    // closeDb should not throw even though openDb failed
    await closeDb();
    reportSpy.mockRestore();
  });
});
