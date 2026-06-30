import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFsaHandleStore } from "../src/fsa-handle-store";

// idbutil's connection closeDb references reportError; not every test env
// provides it. (Our store never calls closeDb, but keep parity with idbutil.)
if (typeof globalThis.reportError !== "function") {
  globalThis.reportError = () => {};
}

let counter = 0;
const uniqueDbName = () => `fsa-test-${counter++}`;

describe("createFsaHandleStore persistence", () => {
  it("persists a handle and retrieves it across store instances (sessions)", async () => {
    const dbName = uniqueDbName();
    const handle = {
      kind: "directory",
      name: "library",
    } as unknown as FileSystemHandle;

    const writer = createFsaHandleStore({ app: "print", dbName });
    await writer.put("library", handle);

    // A fresh store instance simulates a new session.
    const reader = createFsaHandleStore({ app: "print", dbName });
    expect(await reader.get("library")).toEqual({
      kind: "directory",
      name: "library",
    });
  });

  it("returns null when no handle is persisted", async () => {
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    expect(await store.get("missing")).toBeNull();
  });

  it("namespaces handles by app", async () => {
    const dbName = uniqueDbName();
    const printStore = createFsaHandleStore({ app: "print", dbName });
    const audioStore = createFsaHandleStore({ app: "audio", dbName });
    await printStore.put("library", {
      kind: "directory",
      name: "p",
    } as unknown as FileSystemHandle);
    await audioStore.put("library", {
      kind: "directory",
      name: "a",
    } as unknown as FileSystemHandle);
    expect(await printStore.get("library")).toEqual({
      kind: "directory",
      name: "p",
    });
    expect(await audioStore.get("library")).toEqual({
      kind: "directory",
      name: "a",
    });
  });

  it("removes a persisted handle", async () => {
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    await store.put("library", {
      kind: "file",
      name: "x",
    } as unknown as FileSystemHandle);
    await store.remove("library");
    expect(await store.get("library")).toBeNull();
  });

  it("rejects an empty purpose", async () => {
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    await expect(
      store.put("", {} as unknown as FileSystemHandle),
    ).rejects.toThrow(/purpose/);
  });

  it("rejects an empty app namespace", () => {
    expect(() => createFsaHandleStore({ app: "" })).toThrow(/app/);
  });

  it("rejects an app namespace containing a colon", () => {
    expect(() => createFsaHandleStore({ app: "a:b" })).toThrow(/app/);
  });

  it("rejects a purpose containing a colon", async () => {
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    await expect(
      store.get("a:b"),
    ).rejects.toThrow(/purpose/);
  });

  it("rejects a malformed (non-handle) persisted value", async () => {
    const dbName = uniqueDbName();
    const writer = createFsaHandleStore({ app: "print", dbName });
    // Simulate a tampered store entry: a value that is not a handle shape.
    await writer.put("library", { junk: true } as unknown as FileSystemHandle);
    const reader = createFsaHandleStore({ app: "print", dbName });
    await expect(reader.get("library")).rejects.toThrow(/malformed/);
  });
});

describe("permission flow", () => {
  it("ensurePermission does not prompt when already granted (zero prompts)", async () => {
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    const requestPermission = vi.fn();
    const handle = {
      queryPermission: vi.fn().mockResolvedValue("granted"),
      requestPermission,
    } as unknown as FileSystemHandle;
    expect(await store.ensurePermission(handle, "read")).toBe("granted");
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("ensurePermission requests once when in the prompt state (one click)", async () => {
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    const requestPermission = vi.fn().mockResolvedValue("granted");
    const handle = {
      queryPermission: vi.fn().mockResolvedValue("prompt"),
      requestPermission,
    } as unknown as FileSystemHandle;
    expect(await store.ensurePermission(handle, "readwrite")).toBe("granted");
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
  });

  it("ensurePermission returns denied without prompting", async () => {
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    const requestPermission = vi.fn();
    const handle = {
      queryPermission: vi.fn().mockResolvedValue("denied"),
      requestPermission,
    } as unknown as FileSystemHandle;
    expect(await store.ensurePermission(handle)).toBe("denied");
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("queryPermission/requestPermission default to read mode", async () => {
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    const queryPermission = vi.fn().mockResolvedValue("granted");
    const requestPermission = vi.fn().mockResolvedValue("granted");
    const handle = {
      queryPermission,
      requestPermission,
    } as unknown as FileSystemHandle;
    await store.queryPermission(handle);
    await store.requestPermission(handle);
    expect(queryPermission).toHaveBeenCalledWith({ mode: "read" });
    expect(requestPermission).toHaveBeenCalledWith({ mode: "read" });
  });

  it("load returns null when no handle is persisted", async () => {
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    expect(await store.load("missing")).toBeNull();
  });
});

describe("isSupported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reflects live window state — false when pickers are absent", () => {
    vi.stubGlobal("window", {});
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    expect(store.isSupported()).toBe(false);
  });

  it("reflects live window state — true when showOpenFilePicker is present", () => {
    vi.stubGlobal("window", { showOpenFilePicker: () => {} });
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    expect(store.isSupported()).toBe(true);
  });

  it("returns updated result after window gains FSA support (dynamic probe)", () => {
    vi.stubGlobal("window", {});
    const store = createFsaHandleStore({ app: "print", dbName: uniqueDbName() });
    expect(store.isSupported()).toBe(false);
    // Simulate FSA becoming available (e.g., SSR→hydration transition).
    vi.stubGlobal("window", { showOpenFilePicker: () => {} });
    expect(store.isSupported()).toBe(true);
  });
});
