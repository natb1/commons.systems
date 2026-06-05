import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isFsaSupported,
  pickBencFile,
  queryReadWritePermission,
  requestReadWritePermission,
  readFileFromHandle,
  writeFileToHandle,
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

describe("queryReadWritePermission", () => {
  it("delegates to handle.queryPermission with mode readwrite", async () => {
    const queryPermission = vi.fn().mockResolvedValue("granted");
    const handle = { queryPermission } as unknown as FileSystemFileHandle;
    expect(await queryReadWritePermission(handle)).toBe("granted");
    expect(queryPermission).toHaveBeenCalledWith({ mode: "readwrite" });
  });
});

describe("requestReadWritePermission", () => {
  it("delegates to handle.requestPermission with mode readwrite", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    const handle = { requestPermission } as unknown as FileSystemFileHandle;
    expect(await requestReadWritePermission(handle)).toBe("granted");
    expect(requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
  });
});

describe("writeFileToHandle", () => {
  it("writes bytes and closes the writable stream", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const createWritable = vi.fn().mockResolvedValue({ write, close });
    const handle = { createWritable } as unknown as FileSystemFileHandle;
    const data = new Uint8Array([1, 2, 3]);
    await writeFileToHandle(handle, data);
    expect(write).toHaveBeenCalledWith(data);
    expect(close).toHaveBeenCalled();
  });

  it("calls close even when write rejects", async () => {
    const writeError = new Error("disk full");
    const write = vi.fn().mockRejectedValue(writeError);
    const close = vi.fn().mockResolvedValue(undefined);
    const createWritable = vi.fn().mockResolvedValue({ write, close });
    const handle = { createWritable } as unknown as FileSystemFileHandle;
    await expect(writeFileToHandle(handle, new Uint8Array([4, 5]))).rejects.toThrow("disk full");
    expect(close).toHaveBeenCalled();
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
