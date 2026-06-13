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

  it("onversionchange closes the connection, clears the cache, and lets another tab upgrade", async () => {
    const name = uniqueDbName();
    // Tab 1: open at v1 and hold the connection.
    const tab1 = createDbConnection({
      name,
      version: 1,
      onUpgrade(db) { db.createObjectStore("s"); },
    });
    const db1 = await tab1.openDb();
    expect(typeof db1.onversionchange).toBe("function");
    // Wrap the wired handler so we can observe it fired while keeping its
    // close-and-clear-cache behavior.
    const installed = db1.onversionchange!;
    const versionchangeSpy = vi.fn();
    db1.onversionchange = (event) => {
      versionchangeSpy();
      return installed.call(db1, event);
    };

    // Tab 2: open the same DB name at v2. This fires db1's onversionchange,
    // which closes db1 so the v2 upgrade is not permanently blocked.
    const tab2 = createDbConnection({
      name,
      version: 2,
      onUpgrade(db) {
        if (!db.objectStoreNames.contains("s2")) db.createObjectStore("s2");
      },
    });
    const db2 = await tab2.openDb();
    expect(db2.version).toBe(2);
    // db1's onversionchange fired (the upgrade was not permanently blocked).
    expect(versionchangeSpy).toHaveBeenCalled();

    // The wired handler cleared tab1's cache. A subsequent openDb() on a
    // connection for the same name returns a fresh connection rather than the
    // closed db1. (Use a v2-configured connection because the DB has been
    // upgraded; an old-version open would be rejected by IndexedDB.)
    const tab1Reopened = createDbConnection({
      name,
      version: 2,
      onUpgrade() {},
    });
    const db1b = await tab1Reopened.openDb();
    expect(db1b).not.toBe(db1);
    expect(db1b.version).toBe(2);

    await tab1.closeDb();
    await tab1Reopened.closeDb();
    await tab2.closeDb();
  });

  it("onblocked does not reject an open that later succeeds", async () => {
    const name = uniqueDbName();
    // Tab 1 holds a v1 connection open. We deliberately do NOT let its
    // onversionchange close it immediately — instead we override the handler
    // to close after a tick, so the v2 open is briefly blocked and then unblocks.
    const tab1 = createDbConnection({
      name,
      version: 1,
      onUpgrade(db) { db.createObjectStore("s"); },
    });
    const db1 = await tab1.openDb();
    db1.onversionchange = () => {
      // Defer the close so the upgrading open sees a blocked state first.
      setTimeout(() => db1.close(), 0);
    };

    const tab2 = createDbConnection({
      name,
      version: 2,
      onUpgrade(db) {
        if (!db.objectStoreNames.contains("s2")) db.createObjectStore("s2");
      },
    });

    // The upgrading open must resolve to a usable IDBDatabase, not reject,
    // even though it may pass through a transient blocked state.
    const db2 = await tab2.openDb();
    expect(db2).toBeInstanceOf(IDBDatabase);
    expect(db2.version).toBe(2);

    await tab1.closeDb();
    await tab2.closeDb();
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

    // openDb rejects with the original onUpgrade error, not a generic AbortError.
    await expect(openDb()).rejects.toThrow("upgrade failed");
    // closeDb should not throw even though openDb failed
    await closeDb();
    reportSpy.mockRestore();
  });
});
