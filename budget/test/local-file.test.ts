import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isFsaSupported,
  pickBencFile,
  queryReadPermission,
  requestReadPermission,
  readFileFromHandle,
} from "../src/local-file";

describe("isFsaSupported", () => {
  let original: PropertyDescriptor | undefined;

  beforeEach(() => {
    original = Object.getOwnPropertyDescriptor(window, "showOpenFilePicker");
  });

  afterEach(() => {
    if (original) {
      Object.defineProperty(window, "showOpenFilePicker", original);
    } else {
      delete (window as unknown as Record<string, unknown>).showOpenFilePicker;
    }
  });

  it("returns false when showOpenFilePicker is absent", () => {
    delete (window as unknown as Record<string, unknown>).showOpenFilePicker;
    expect(isFsaSupported()).toBe(false);
  });

  it("returns true when showOpenFilePicker is present", () => {
    (window as unknown as Record<string, unknown>).showOpenFilePicker = vi.fn();
    expect(isFsaSupported()).toBe(true);
  });
});

describe("pickBencFile", () => {
  let original: PropertyDescriptor | undefined;

  beforeEach(() => {
    original = Object.getOwnPropertyDescriptor(window, "showOpenFilePicker");
  });

  afterEach(() => {
    if (original) {
      Object.defineProperty(window, "showOpenFilePicker", original);
    } else {
      delete (window as unknown as Record<string, unknown>).showOpenFilePicker;
    }
  });

  it("returns the handle when the picker resolves", async () => {
    const stubHandle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    (window as unknown as Record<string, unknown>).showOpenFilePicker = vi
      .fn()
      .mockResolvedValue([stubHandle]);
    expect(await pickBencFile()).toBe(stubHandle);
  });

  it("returns null when the user cancels (AbortError)", async () => {
    (window as unknown as Record<string, unknown>).showOpenFilePicker = vi
      .fn()
      .mockRejectedValue(new DOMException("cancel", "AbortError"));
    expect(await pickBencFile()).toBeNull();
  });

  it("rethrows non-AbortError errors", async () => {
    (window as unknown as Record<string, unknown>).showOpenFilePicker = vi
      .fn()
      .mockRejectedValue(new DOMException("boom", "SecurityError"));
    await expect(pickBencFile()).rejects.toThrow("boom");
  });
});

describe("queryReadPermission", () => {
  it("delegates to handle.queryPermission with mode read", async () => {
    const queryPermission = vi.fn().mockResolvedValue("granted");
    const handle = { queryPermission } as unknown as FileSystemFileHandle;
    expect(await queryReadPermission(handle)).toBe("granted");
    expect(queryPermission).toHaveBeenCalledWith({ mode: "read" });
  });
});

describe("requestReadPermission", () => {
  it("delegates to handle.requestPermission with mode read", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    const handle = { requestPermission } as unknown as FileSystemFileHandle;
    expect(await requestReadPermission(handle)).toBe("granted");
    expect(requestPermission).toHaveBeenCalledWith({ mode: "read" });
  });
});

describe("readFileFromHandle", () => {
  it("delegates to handle.getFile", async () => {
    const file = new File([], "x");
    const getFile = vi.fn().mockResolvedValue(file);
    const handle = { getFile } as unknown as FileSystemFileHandle;
    expect(await readFileFromHandle(handle)).toBe(file);
  });
});
