import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isDirectoryAccessSupported,
  getStoredDirectoryHandle,
  storeDirectoryHandle,
  ensureReadPermission,
} from "../src/statements-dir";
import { closeDb } from "../src/idb";

// Each test gets a fresh database by deleting between tests.
beforeEach(async () => {
  await closeDb();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("budget");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
});

describe("isDirectoryAccessSupported", () => {
  const hadPicker = "showDirectoryPicker" in window;
  const original = (window as Record<string, unknown>).showDirectoryPicker;

  afterEach(() => {
    if (hadPicker) {
      (window as Record<string, unknown>).showDirectoryPicker = original;
    } else {
      delete (window as Record<string, unknown>).showDirectoryPicker;
    }
  });

  it("is false when showDirectoryPicker is absent", () => {
    delete (window as Record<string, unknown>).showDirectoryPicker;
    expect(isDirectoryAccessSupported()).toBe(false);
  });

  it("is true when showDirectoryPicker is present", () => {
    (window as Record<string, unknown>).showDirectoryPicker = () => Promise.resolve({});
    expect(isDirectoryAccessSupported()).toBe(true);
  });
});

describe("storeDirectoryHandle + getStoredDirectoryHandle round-trip", () => {
  it("returns undefined when no handle stored", async () => {
    expect(await getStoredDirectoryHandle()).toBeUndefined();
  });

  it("round-trips a stub directory handle", async () => {
    const stub = { name: "statements", marker: "the-handle" };
    // The stub stands in for a FileSystemDirectoryHandle; it only needs to be
    // structured-cloneable to persist through IndexedDB.
    await storeDirectoryHandle(stub as unknown as FileSystemDirectoryHandle);
    const loaded = await getStoredDirectoryHandle();
    expect(loaded).toEqual(stub);
  });
});

describe("ensureReadPermission", () => {
  it("returns true when queryPermission resolves granted", async () => {
    const requestPermission = vi.fn();
    const handle = {
      queryPermission: vi.fn().mockResolvedValue("granted"),
      requestPermission,
    };
    const result = await ensureReadPermission(handle as unknown as FileSystemDirectoryHandle);
    expect(result).toBe(true);
    expect(handle.queryPermission).toHaveBeenCalledWith({ mode: "read" });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("requests permission when query resolves prompt, returning true on grant", async () => {
    const handle = {
      queryPermission: vi.fn().mockResolvedValue("prompt"),
      requestPermission: vi.fn().mockResolvedValue("granted"),
    };
    const result = await ensureReadPermission(handle as unknown as FileSystemDirectoryHandle);
    expect(result).toBe(true);
    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: "read" });
  });

  it("returns false when the prompt is denied", async () => {
    const handle = {
      queryPermission: vi.fn().mockResolvedValue("prompt"),
      requestPermission: vi.fn().mockResolvedValue("denied"),
    };
    const result = await ensureReadPermission(handle as unknown as FileSystemDirectoryHandle);
    expect(result).toBe(false);
    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: "read" });
  });
});
