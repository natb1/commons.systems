import { afterEach, describe, expect, it, vi } from "vitest";
import { detectFsaCapabilities, isFsaSupported } from "../src/capabilities";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detectFsaCapabilities", () => {
  it("reports all false when window is absent", () => {
    vi.stubGlobal("window", undefined);
    expect(detectFsaCapabilities()).toEqual({
      filePicker: false,
      directoryPicker: false,
    });
  });

  it("never throws on a browser lacking FSA (empty window)", () => {
    vi.stubGlobal("window", {});
    expect(() => detectFsaCapabilities()).not.toThrow();
    expect(detectFsaCapabilities()).toEqual({
      filePicker: false,
      directoryPicker: false,
    });
  });

  it("detects file and directory pickers when present", () => {
    vi.stubGlobal("window", {
      showOpenFilePicker: () => {},
      showDirectoryPicker: () => {},
    });
    expect(detectFsaCapabilities()).toEqual({
      filePicker: true,
      directoryPicker: true,
    });
  });

  it("isFsaSupported is false on a non-Chromium browser (no pickers)", () => {
    vi.stubGlobal("window", {});
    expect(isFsaSupported()).toBe(false);
  });

  it("isFsaSupported is true when either picker exists", () => {
    vi.stubGlobal("window", { showOpenFilePicker: () => {} });
    expect(isFsaSupported()).toBe(true);
  });
});
